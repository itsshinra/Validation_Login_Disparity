import { Subscriptions, UserSubscription } from "../models/subscriptions.js";
import { buyCubes } from "./cubes-controllers.js";

export async function getAllSubscriptions(req, res, next) {
  let subscriptions;

  try {
    subscriptions = await Subscriptions.find({
      name: {
        $nin: ["free", "Unlimited"],
      },
    });
  } catch (err) {
    return next({
      message: "Could not find any subscriptions.",
      statusCode: 404,
    });
  }

  res.json({
    subscriptions,
  });
}

export async function getUserSubscription(user) {
  let userSubscription;

  try {
    // if user is HTB  staff, return "Unlimited" subscription
    if (user.email.endsWith("@hackthebox.com")) {
      userSubscription = {
        userId: user.id,
        subscriptionName: "Unlimited",
        expiresAt: new Date("2100-01-01T00:00:00.000Z"),
      };
    }
    // for other users, check if they have a subscription, if not, return free subscription
    else {
      userSubscription = await UserSubscription.findOne({
        userId: user.id,
      });

      if (!userSubscription) {
        throw new Error();
      }

      // if subscription expired, return free subscription
      if (new Date(userSubscription.expiresAt) < new Date()) {
        throw new Error();
      }
    }
  } catch (err) {
    userSubscription = {
      userId: user.id,
      subscriptionName: "free",
      expiresAt: new Date("2100-01-01T00:00:00.000Z"),
    };
  }

  return {
    userId: userSubscription.userId,
    subscriptionName: userSubscription.subscriptionName,
    expiresAt: userSubscription.expiresAt,
  };
}

// only accessed by payment/coupon systems
export async function buySubscription(userId, name, next) {
  let subscription;

  try {
    // get subscription id
    subscription = await Subscriptions.findOne({
      name,
    });

    if (!subscription) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find a matching subscription.",
      statusCode: 404,
    });
  }

  try {
    // get user subscription
    const userSubscription = await UserSubscription.findOne({
      userId,
    });

    // if user has a subscription, return error message
    if (userSubscription && new Date(userSubscription.expiresAt) > new Date()) {
      return next({
        message: "User already has an active subscription.",
        statusCode: 400,
      });
    }

    // delete expired subscription if exists
    if (userSubscription) {
      await UserSubscription.deleteOne({
        userId,
      });
    }

    // create user subscription
    const newUserSubscription = new UserSubscription({
      userId,
      subscriptionName: subscription.name,
      expiresAt: new Date(
        Date.now() + subscription.duration * 1000 * 60 * 60 * 24 * 30
      ),
    });

    await newUserSubscription.save();

    // add cubes to user per reward
    if (subscription.reward > 0) {
      await buyCubes(userId, subscription.reward, next);
    }
  } catch (err) {
    return next({
      message: "Could not create a new user subscription.",
      statusCode: 400,
    });
  }
}

// message: `User subscribed successfully to the ${subscription.name} subscription, valid for ${subscription.description} months.`,

export async function cancelSubscription(req, res, next) {
  const userId = req.user?.id;
  try {
    // get user subscription
    const userSubscription = await UserSubscription.findOne({
      userId,
    });

    // if user has a subscription, return error message
    if (!userSubscription) {
      throw new Error();
    }

    // delete expired subscription if exists
    // await UserSubscription.deleteOne({ userId }); //TODO: cancel subscription at the end of its duration

    res.json({
      message:
        "Subscription cancellation request successful. The subscription will no longer be renewed at the end of its duration.",
    });
  } catch (err) {
    return next({
      message: "User does not have an active subscription.",
      statusCode: 400,
    });
  }
}

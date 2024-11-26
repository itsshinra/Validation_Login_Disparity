import { PaymentCard, validateCartItemDetails } from "../models/payment.js";
import { Exam } from "../models/exam.js";
import { Subscriptions, UserSubscription } from "../models/subscriptions.js";
import { buyExam } from "./exam-controllers.js";
import { buyCubes } from "./cubes-controllers.js";
import { buySubscription } from "./subscriptions-controllers.js";

export async function getUserCards(req, res, next) {
  const userId = req.user?.id;
  let userCards = null;
  try {
    userCards = await PaymentCard.find({
      userId,
    });

    if (!userCards) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any cards linked to this user.",
      statusCode: 404,
    });
  }

  // only return last 4 digits of card number
  const returnedUserCards = userCards.map((card) => {
    return {
      id: card._id.toString(),
      userId: card.userId,
      name: card.name,
      endsWith: card.number.slice(-4),
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      cvc: card.cvc,
      balance: card.balance,
    };
  });

  res.status(200).json({
    cards: returnedUserCards,
  });
}

export async function processPayment(req, res, next) {
  const { cardId, items } = req.body;
  const userId = req.user?.id;

  // get card from db
  let card = null;
  let total = 0;

  try {
    card = await PaymentCard.findOne({
      userId,
      _id: cardId,
    });

    if (!card) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find a card with this id for this user.",
      statusCode: 404,
    });
  }

  // validate items + get prices
  try {
    for (const item of items) {
      const { name, category, price, amount } = item;

      // validate CartItemType array
      const errors = await validateCartItemDetails({
        name,
        category,
        price,
        amount,
      });

      if (errors) {
        return next(errors);
      }

      // add cost to total
      switch (item.category) {
        case "cubes":
          total += (parseInt(name) * amount) / 10;
          break;

        case "subscription":
          // first verify subscription exists, and get its prices
          let subscription;
          try {
            subscription = await Subscriptions.findOne({
              name: {
                $in: [name],
                $nin: ["free", "Unlimited"],
              },
            });

            if (!subscription) {
              throw new Error();
            }
          } catch (err) {
            return next({
              message: "Could not find any subscriptions.",
              statusCode: 404,
            });
          }

          // get user subscription
          const userSubscription = await UserSubscription.findOne({
            userId,
          });

          // if user has a subscription, return error message
          if (
            userSubscription &&
            new Date(userSubscription.expiresAt) > new Date()
          ) {
            return next({
              message: "User already has an active subscription.",
              statusCode: 400,
            });
          }

          total += subscription.cost * amount;
          break;

        case "exam":
          // first verify exam exists, and get its prices
          let exam;

          try {
            exam = await Exam.findOne({
              name: name,
            });

            if (!exam) {
              throw new Error();
            }
          } catch (err) {
            return next({
              message: "Could not find a matching exam with the provided id.",
              statusCode: 404,
            });
          }

          total += exam.cost * amount;
          break;
      }
    }
  } catch (err) {
    return next({
      message: "Could not find prices for all items.",
      statusCode: 404,
    });
  }

  // then verify total <= PaymentCardType.balance
  if (total <= 0 || total > card.balance) {
    // simulate card processing '3 seconds sleep'
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return next({
      message: "Insufficient funds.",
      statusCode: 400,
    });
  }

  // process items
  try {
    for (const item of items) {
      // repeat by the amount
      for (let i = 0; i < item.amount; i++) {
        switch (item.category) {
          // if coupon.type is cubes, then buy cubes for user with item.name
          case "cubes":
            await buyCubes(userId, parseInt(item.name), next);
            break;

          // if coupon.type is subscription, then buy subscription for user with item.name
          case "subscription":
            await buySubscription(userId, item.name, next);
            break;

          // if coupon.type is exam, then buy exam for user with item.name
          case "exam":
            // first get exam from db "no need for try/catch as we already verified exam exists"
            const exam = await Exam.findOne({
              name: item.name,
            });

            await buyExam(userId, exam.id, next);
            break;
        }
      }
    }
  } catch (err) {
    return next({
      message: "Error while processing items.",
      statusCode: 400,
    });
  }

  // adjust card balance, and confirm success
  try {
    card.balance = card.balance - total;
    await PaymentCard.updateOne(
      {
        userId,
        _id: cardId,
      },
      card
    );

    // simulate payment processing '3 seconds sleep'
    await new Promise((resolve) => setTimeout(resolve, 3000));

    res.status(200).json({
      message: `Successfully processed payment for a total of $${total}.`,
    });
  } catch (err) {
    return next({
      message: "Could not process payment.",
      statusCode: 400,
    });
  }
}

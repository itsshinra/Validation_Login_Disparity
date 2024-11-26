import jwt from "jsonwebtoken";

import { User } from "../models/user.js";
import { Cubes } from "../models/cubes.js";
import { getUserSubscription } from "./subscriptions-controllers.js";
import { getCubesByUserId } from "./cubes-controllers.js";

export async function createUserToken(userId, next) {
  let user;

  try {
    user = await User.findById(userId);
    if (!user) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "User does not exist",
      statusCode: 404,
    });
  }

  // get cubes count
  let cubes;
  try {
    cubes = await getCubesByUserId(userId);
  } catch (err) {
    cubes = new Cubes({
      userId,
      count: 0,
    });
  }

  // get user subscription
  let subscription;
  subscription = await getUserSubscription(user);

  let accessToken;
  const userData = JSON.parse(JSON.stringify(user));

  const userPayload = {
    id: userData._id,
    name: userData.name,
    username: userData.username,
    email: userData.email,
    registrationDate: userData.registrationDate,
    cubes: cubes.count,
    subscription: subscription,
  };

  try {
    accessToken = jwt.sign(userPayload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "1d",
    });
  } catch (err) {
    return next({
      message: "Could not login user, please try again.",
      statusCode: 500,
    });
  }

  return accessToken;
}

// used to add user details to request object for verification purposes on protected routes
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next({
      message: "Unauthorized",
      statusCode: 403,
    });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      return next({
        message: "Unauthorized",
        statusCode: 403,
      });
    }

    const userData = JSON.parse(JSON.stringify(user));
    let userDetails;

    if (user) {
      userDetails = {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        registrationDate: userData.registrationDate,
        cubes: userData.cubes,
        subscription: userData.subscription,
      };
      req.user = userDetails; // add user details to request object, so that it can be accessed in the next middleware
      next();
    }
  });
}

// get updated token
export async function updateUserToken(req, res, next) {
  const accessToken = await createUserToken(req.user.id, next);

  if (accessToken)
    res.json({
      token: accessToken,
    });
}

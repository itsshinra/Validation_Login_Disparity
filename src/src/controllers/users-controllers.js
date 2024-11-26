import bcrypt from "bcrypt";
import md5 from "md5";
import jwt from "jsonwebtoken";
import { mixed, object, string } from "yup";
import { ObjectId } from "mongodb";

import { User, validateUserDetails } from "../models/user.js";
import { Cubes } from "../models/cubes.js";
import { createUserToken } from "./auth-controllers.js";

// create user
export async function createUser(req, res, next) {
  const { name, username, email, password } = req.body;

  // name/username are not set as required in the schema, so we need to check for them here
  if (!name || !username) {
    if (!name) {
      return next({
        message: "name is a required field",
        statusCode: 422,
      });
    } else {
      return next({
        message: "username is a required field",
        statusCode: 422,
      });
    }
  }
  const errors = await validateUserDetails({
    email,
    username,
    password,
    name,
  });

  if (errors) {
    return next(errors);
  }

  // disable registering with @hackthebox.com domain
  if (email.endsWith("@hackthebox.com")) {
    return next({
      message: "Registration with @hackthebox.com email is not allowed.",
      statusCode: 422,
    });
  }

  try {
    const hasUser = await User.findOne({
      email,
    });
    if (hasUser) {
      return next({
        message: "Could not create user, email already exists.",
        statusCode: 422,
      });
    }
  } catch (err) {
    return next({
      message: "Could not create user, please try again.",
      statusCode: 500,
    });
  }
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    username,
    password: hashPassword,
    registrationDate: new Date(),
  });

  const userCubes = new Cubes({
    userId: user._id.toString(),
    count: 100,
  });

  try {
    await user.save();
    await userCubes.save();
  } catch (err) {
    return next({
      message: "Could not create user, please try again.",
      statusCode: 500,
    });
  }

  let accessToken;
  const userData = JSON.parse(JSON.stringify(user));

  const userPayload = {
    id: userData._id,
    name: userData.name,
    username: userData.username,
    email: userData.email,
    registrationDate: userData.registrationDate,
    cubes: 30,
    subscription: {
      userId: userData._id,
      subscriptionName: "free",
      expiresAt: new Date(0),
    },
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

  res.status(201).json({
    token: accessToken,
    message: "Registration successful!",
  });
}

// login user
export async function login(req, res, next) {
  const { email, password } = req.body;

  let user;

  const errors = await validateUserDetails({
    email,
    password,
  });
  if (errors) {
    return next(errors);
  }

  try {
    user = await User.findOne({
      email,
    });
    if (!user) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "User does not exist or credentials are wrong.",
      statusCode: 404,
    });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return next({
      message: "User does not exist or credentials are wrong.",
      statusCode: 401,
    });
  }

  const accessToken = await createUserToken(user._id.toString(), next);

  if (accessToken)
    res.json({
      token: accessToken,
      message: "Logged in!",
    });
}

export async function updateUserDetails(req, res, next) {
  const { name, username, email } = req.body;

  const errors = await validateUserDetails({
    email,
    password: process.env.VALIDATION_TEST_PASSWORD,
    name,
    username,
  });
  if (errors) {
    return next(errors);
  }

  // verify that the new email is not used by another user
  try {
    const hasEmail = await User.findOne({
      email,
    });

    if (hasEmail && hasEmail.email !== req.user?.email) {
      return next({
        message: "This email is already in use.",
        statusCode: 422,
      });
    }
  } catch (err) {
    return next({
      message: "Could not update user details, please try again.",
      statusCode: 500,
    });
  }

  try {
    const updateReq = await User.findByIdAndUpdate(
      req.user?.id,
      // use id from token to ensure users can only update their own account
      {
        email,
        name,
        username,
      },
      {
        returnOriginal: false,
      }
    );

    if (!updateReq) {
      throw new Error();
    }

    res.json({
      message: "User details updated successfully!",
    });
  } catch (err) {
    return next({
      message: "Could not update user details, please try again.",
      statusCode: 500,
    });
  }
}

export async function resetPassword(req, res, next) {
  const { id, token, password } = req.body;

  let user;

  const passwordResetSchema = object({
    // validate mongodb object id
    id: mixed((value) => ObjectId.isValid(value))
      .typeError("Invalid id")
      .required(),
    // validate bcrypt hash
    token: string()
      .matches(/[0-9a-f]{32}/i, "Invalid token")
      .required(),
    // validate password
    password: string().min(5).required(),
  }).required();

  try {
    await passwordResetSchema.validate({
      id,
      token,
      password,
    });
  } catch (err) {
    return next({
      message: err.message,
      statusCode: 422,
    });
  }

  // retrieve user based on id
  try {
    user = await User.findById(id);
    if (!user) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "No user exists with the provided id.",
      statusCode: 404,
    });
  }

  // generate password reset token based on password hash and user id
  const hashedToken = md5(`${id}:${user?.password}`);

  // verify password reset token based on password hash and user id
  // if not valid, return error
  if (token !== hashedToken) {
    return next({
      message: "Invalid password reset token.",
      statusCode: 403,
    });
  }
  // if valid, update password
  else {
    const salt = await bcrypt.genSalt();
    const newHashPassword = await bcrypt.hash(password, salt);

    try {
      // update user password
      const updateReq = await User.findOneAndUpdate(
        {
          _id: id,
        },
        {
          password: newHashPassword,
        }
      );

      if (!updateReq) {
        throw new Error();
      }

      res.json({
        message: "Password updated successfully!",
      });
    } catch (err) {
      return next({
        message: "Could not update user password, please try again.",
        statusCode: 500,
      });
    }
  }
}

export async function requestPasswordResetLink(req, res, next) {
  const { email } = req.body;

  let user;

  const errors = await validateUserDetails({
    email,
    password: process.env.VALIDATION_TEST_PASSWORD,
  });
  if (errors) {
    return next(errors);
  }

  // retrieve user based on id
  try {
    user = await User.findOne({
      email,
    });
    if (!user) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "No user exists with the provided email.",
      statusCode: 404,
    });
  }

  // calculate token
  const hashedToken = md5(`${user?._id}:${user?.password}`);

  if (user?.email === email) {
    try {
      // send email with password reset link
      // const emailSent = await sendEmail({
      //   to: email,
      //   subject: "Password reset",
      //   text: `Click on the following link to reset your password: ${process.env.FRONTEND_URL}/reset-password/${user?._id}/${hashedToken}`,
      // });
      res.json({
        message: "Password reset link sent to your email!",
      });
    } catch (err) {
      return next({
        message: "Could not send email, please try again.",
        statusCode: 500,
      });
    }
  }
}

import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import * as yup from "yup";

export async function validateUserDetails({ name, username, email, password }) {
  try {
    await UserSchema.validate({
      name,
      username,
      email,
      password,
    });
  } catch (err) {
    return {
      message: err.message,
      statusCode: 422,
    };
  }
}

export const UserSchema = yup
  .object({
    id: yup.string(),
    name: yup.string(),
    username: yup.string(),
    email: yup.string().email().required(),
    password: yup.string().min(5).required(),
    registrationDate: yup.date(),
  })
  .required();

const UserDBSchema = new Schema({
  // for id, we use the default ObjectId _id
  name: {
    type: String,
  },
  username: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
});

UserDBSchema.plugin(uniqueValidator);

export const User = model("Users", UserDBSchema);

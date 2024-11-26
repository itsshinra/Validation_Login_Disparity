import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import * as yup from "yup";

export async function validateCartItemDetails({
  name,
  category,
  price,
  amount,
}) {
  try {
    await CartItemSchema.validate({
      name,
      category,
      price,
      amount,
    });
  } catch (err) {
    return {
      message: err.message,
      statusCode: 422,
    };
  }
}

// to process cart items in payment requests
export const CartItemSchema = yup
  .object({
    name: yup.string().required(),
    category: yup.mixed().oneOf(["subscription", "exam", "cubes"]).required(),
    price: yup.number().positive().min(1).required(),
    // in usd
    amount: yup.number().positive().min(1).required(), // item count
  })
  .required();

// to store user cards in db
export const PaymentCardSchema = yup.object({
  userId: yup.string().required(),
  name: yup.string().required(),
  number: yup.string().min(15).max(16).required(),
  expiryMonth: yup.string().min(2).max(2).required(),
  expiryYear: yup.string().min(4).max(4).required(),
  cvc: yup.string().min(3).max(4).required(),
  balance: yup.number().min(0).required(), // in usd
});

const paymentCardDBSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  expiryMonth: {
    type: String,
    required: true,
  },
  expiryYear: {
    type: String,
    required: true,
  },
  cvc: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
});

paymentCardDBSchema.plugin(uniqueValidator);

export const PaymentCard = model("PaymentCards", paymentCardDBSchema);

import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import * as yup from "yup";

export async function validateCouponCode({ coupon }) {
  try {
    await CouponCodeSchema.validate({ coupon });
  } catch (err) {
    return {
      message: err.message,
      statusCode: 422,
    };
  }
}

export const CouponCodeSchema = yup.object({
  // coupon must be an md5 hash of the coupon code
  coupon: yup
    .string()
    .matches(/^[a-f0-9]{32}$/i, "Invalid coupon.")
    .required(),
});

export const CouponSchema = CouponCodeSchema.concat(
  yup
    .object({
      type: yup.mixed().oneOf(["cubes", "subscription", "exam"]).required(),
      target: yup.string().required(),
      used: yup.boolean(),
    })
    .required()
);

const CouponDBSchema = new Schema({
  coupon: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
});

CouponDBSchema.plugin(uniqueValidator);

export const Coupon = model("Coupons", CouponDBSchema);

import { Coupon, validateCouponCode } from "../models/coupon.js";
import { buyCubes } from "./cubes-controllers.js";
import { buySubscription } from "./subscriptions-controllers.js";
import { buyExam } from "./exam-controllers.js";

export async function applyCoupon(req, res, next) {
  const { coupon } = req.body;
  const userId = req.user?.id;

  // validate coupon
  const errors = await validateCouponCode({ coupon });
  if (errors) {
    return next(errors);
  }

  // first get coupon details, ensure it is not used, or return error
  let couponDetails;
  try {
    couponDetails = await Coupon.findOne({
      coupon,
      used: false,
    });

    if (!couponDetails) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Invalid coupon.",
      statusCode: 400,
    });
  }

  // then, depending on coupon.type, do the following:
  try {
    switch (couponDetails.type) {
      // if coupon.type is cubes, then buy cubes for user with coupon.target
      case "cubes":
        await buyCubes(userId, parseInt(couponDetails.target), next);
        break;

      // if coupon.type is subscription, then buy subscription for user with coupon.target
      case "subscription":
        await buySubscription(userId, couponDetails.target, next);
        break;

      // if coupon.type is exam, then buy exam for user with coupon.target
      case "exam":
        await buyExam(userId, parseInt(couponDetails.target), next);
        break;
    }

    // finally, mark coupon as used
    couponDetails.used = true;
    await couponDetails.save();
  } catch (err) {
    return next({
      message: "Error while using coupon.",
      statusCode: 400,
    });
  }

  return res.json({
    message: `Coupon successfully used for ${couponDetails.target} ${couponDetails.type}`,
  });
}

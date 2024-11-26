import express from "express";
import { verifyToken } from "../controllers/auth-controllers.js";
import { applyCoupon } from "../controllers/coupon-controllers.js";

const router = express.Router();

router.use(verifyToken);
router.post("/use", applyCoupon);

export default router;

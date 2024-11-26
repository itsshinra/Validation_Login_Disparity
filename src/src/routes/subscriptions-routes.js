import express from "express";
import { verifyToken } from "../controllers/auth-controllers.js";
import {
  getAllSubscriptions,
  cancelSubscription,
} from "../controllers/subscriptions-controllers.js";

const router = express.Router();

router.get("/", getAllSubscriptions);

router.use(verifyToken);
router.get("/cancel", cancelSubscription);

export default router;

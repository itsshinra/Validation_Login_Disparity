import express from "express";
import { verifyToken } from "../controllers/auth-controllers.js";
import {
  getUserCards,
  processPayment,
} from "../controllers/payment-controllers.js";

const router = express.Router();

router.use(verifyToken);
router.get("/cards", getUserCards);
router.post("/charge", processPayment);

export default router;

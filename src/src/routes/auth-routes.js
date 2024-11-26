import express from "express";
import {
  updateUserToken,
  verifyToken,
} from "../controllers/auth-controllers.js";

const router = express.Router();

// secure private routes for content (use req.user in private controllers)
router.use(verifyToken);
router.get("/update_token", updateUserToken);

export default router;

import express from "express";
import { verifyToken } from "../controllers/auth-controllers.js";
import {
  createUser,
  login,
  resetPassword,
  requestPasswordResetLink,
  updateUserDetails,
} from "../controllers/users-controllers.js";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", login);
router.post("/password/reset", resetPassword);
router.post("/password/request_reset_email", requestPasswordResetLink);

// secure private routes for content (use req.user in private controllers)
router.use(verifyToken);
router.post("/update", updateUserDetails);

export default router;

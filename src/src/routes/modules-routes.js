import express from "express";
import { verifyToken } from "../controllers/auth-controllers.js";
import {
  getAllModules,
  getModuleById,
  getModuleUnlockedStatus,
  unlockModule,
} from "../controllers/modules-controllers.js";

const router = express.Router();

router.get("/", getAllModules);
router.get("/:id", getModuleById);

// secure private routes for content (use req.user in private controllers)
router.use(verifyToken);
router.get("/:id/status", getModuleUnlockedStatus);
router.get("/:id/unlock", unlockModule);

export default router;

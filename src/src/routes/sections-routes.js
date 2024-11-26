import express from "express";
import { verifyToken } from "../controllers/auth-controllers.js";
import {
  getModuleSectionsById,
  getSectionsProgress,
  getSectionContent,
  markSectionAsCompleted,
} from "../controllers/sections-controllers.js";

const router = express.Router();

router.get("/:moduleId", getModuleSectionsById);

// secure private routes for content (use req.user in private controllers)
router.use(verifyToken);
router.get("/progress/:moduleId", getSectionsProgress);
router.get("/:moduleId/:sectionId", getSectionContent);
router.post("/complete", markSectionAsCompleted);

export default router;

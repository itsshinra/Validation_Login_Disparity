import express from "express";
import { verifyToken } from "../controllers/auth-controllers.js";
import {
  getAllExams,
  getExamById,
  getExamAvailability,
  getUserExams,
  bookExam,
  getExamContent,
} from "../controllers/exam-controllers.js";

const router = express.Router();

router.get("/", getAllExams);
router.get("/:id", getExamById);
router.post("/availability", getExamAvailability);

// secure private routes for content (use req.user in private controllers)
router.use(verifyToken);
router.get("/user/exams", getUserExams);
router.post("/book", bookExam);
router.get("/content/:id", getExamContent);

export default router;

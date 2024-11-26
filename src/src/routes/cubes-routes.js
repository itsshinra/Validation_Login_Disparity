import express from "express";
import { verifyToken } from "../controllers/auth-controllers.js";
import { getCubes } from "../controllers/cubes-controllers.js";

const router = express.Router();

router.use(verifyToken);
router.get("/count", getCubes);

export default router;

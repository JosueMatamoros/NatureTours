import { Router } from "express";
import {
  upsertDayBlock,
  deleteDayBlock,
  getDayBlocksByRange,
} from "../controllers/availability.blocks.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getDayBlocksByRange);
router.post("/", authenticateToken, upsertDayBlock);
router.delete("/", authenticateToken, deleteDayBlock);

export default router;

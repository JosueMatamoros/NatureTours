import { Router } from "express";
import {
  upsertDayBlock,
  deleteDayBlock,
  getDayBlocksByRange,
} from "../controllers/availability.blocks.controller.js";

const router = Router();

// listar bloqueos (rango)
router.get("/", getDayBlocksByRange);

// bloquear día (upsert)
router.post("/", upsertDayBlock);

// desbloquear día
router.delete("/", deleteDayBlock);

export default router;

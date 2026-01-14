import { Router } from "express";
import { getBlockedByRange } from "../controllers/availability.controller.js";

const router = Router();

router.get("/blocked", getBlockedByRange);

export default router;

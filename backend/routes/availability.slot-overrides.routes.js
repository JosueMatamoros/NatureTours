import { Router } from "express";
import {
  getSlotOverrides,
  upsertSlotOverride,
  deleteSlotOverride,
} from "../controllers/availability.slot-overrides.controller.js";

const router = Router();

router.get("/", getSlotOverrides);
router.put("/", upsertSlotOverride);
router.delete("/", deleteSlotOverride);

export default router;

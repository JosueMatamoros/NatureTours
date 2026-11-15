import { Router } from "express";
import {
  getAllGuides,
  createGuide,
  updateGuide,
  deleteGuide,
  getAssignments,
  assignGuide,
  publishSlotOffer,
  cancelSlotOffer,
} from "../controllers/guides.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Asignaciones por horario (rutas literales antes que /:id).
router.get("/assignments", authenticateToken, getAssignments);
router.put("/assignments", authenticateToken, assignGuide);
router.post("/offers", authenticateToken, publishSlotOffer);
router.delete("/offers/:id", authenticateToken, cancelSlotOffer);

// CRUD de guías.
router.get("/", authenticateToken, getAllGuides);
router.post("/", authenticateToken, createGuide);
router.patch("/:id", authenticateToken, updateGuide);
router.delete("/:id", authenticateToken, deleteGuide);

export default router;

import { Router } from "express";
import {
  listDay,
  createReservation,
  editReservation,
  cancelReservation,
  moveReservation,
} from "../controllers/bookings.manage.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticateToken, listDay);
router.post("/", authenticateToken, createReservation);
router.patch("/:id", authenticateToken, editReservation);
router.post("/:id/cancel", authenticateToken, cancelReservation);
router.post("/:id/move", authenticateToken, moveReservation);

export default router;

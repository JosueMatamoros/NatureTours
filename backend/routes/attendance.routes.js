import { Router } from "express";
import {
  getAttendance,
  setArrived,
  createManualBooking,
} from "../controllers/attendance.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Todo el módulo es solo para admin (a futuro, guías con alcance limitado).
router.get("/", authenticateToken, getAttendance);
router.post("/manual", authenticateToken, createManualBooking);
router.patch("/:bookingId", authenticateToken, setArrived);

export default router;

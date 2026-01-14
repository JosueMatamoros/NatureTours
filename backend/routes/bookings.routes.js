// src/routes/bookings.routes.js
import { Router } from "express";
import { createBooking, getBookingById, changePendingBooking } from "../controllers/bookings.controller.js";

const router = Router();

router.post("/", createBooking);
router.get("/:id", getBookingById);
router.post("/:id/change", changePendingBooking);

export default router;

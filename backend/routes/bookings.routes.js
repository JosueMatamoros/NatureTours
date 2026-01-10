// src/routes/bookings.routes.js
import { Router } from "express";
import { createBooking, getBookingById } from "../controllers/ bookings.controller.js";

const router = Router();

router.post("/", createBooking);
router.get("/:id", getBookingById);

export default router;

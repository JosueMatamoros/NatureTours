// src/routes/bookings.routes.js
import { Router } from "express";
import { createBooking, getBookingById, expireBooking, validateBooking} from "../controllers/bookings.controller.js";

const router = Router();

router.post("/", createBooking);
router.get("/:id", getBookingById);
router.patch("/:id/expire", expireBooking);
router.get("/:id/validate", validateBooking);


export default router;

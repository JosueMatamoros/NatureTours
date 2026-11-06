import { Router } from "express";
import {
  createCustomPayment,
  getCustomPayment,
  listCustomPayments,
} from "../controllers/custom-payments.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Admin
router.get("/", authenticateToken, listCustomPayments);

// Público (página /custom-payment)
router.post("/", createCustomPayment);
router.get("/:id", getCustomPayment);

export default router;

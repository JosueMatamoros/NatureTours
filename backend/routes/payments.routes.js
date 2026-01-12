import { Router } from "express";
import { createPayment, getPaymentById } from "../controllers/payments.controller.js";

const router = Router();

router.post("/", createPayment);
router.get("/:id", getPaymentById);

export default router;

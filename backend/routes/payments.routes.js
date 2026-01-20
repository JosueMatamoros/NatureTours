import { Router } from "express";
import { createPayment, getPaymentById, getAllPayments } from "../controllers/payments.controller.js";

const router = Router();

router.post("/", createPayment);
router.get("/:id", getPaymentById);
router.get("/", getAllPayments);

export default router;

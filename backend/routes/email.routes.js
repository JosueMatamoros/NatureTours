import { Router } from "express";
import { sendReceiptEmail } from "../controllers/email.controller.js";

const router = Router();

// POST /api/email/send-receipt
router.post("/send-receipt", sendReceiptEmail);

export default router;

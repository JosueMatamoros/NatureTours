import { Router } from "express";
import {
  getFinanceMonth,
  saveFinanceMonth,
  addFinancePayment,
  deleteFinancePayment,
} from "../controllers/finance.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

// Solo admin (token del panel).
const router = Router();
router.get("/", authenticateToken, getFinanceMonth);
router.post("/payments", authenticateToken, addFinancePayment);
router.delete("/payments/:id", authenticateToken, deleteFinancePayment);
router.put("/:month", authenticateToken, saveFinanceMonth);
export default router;

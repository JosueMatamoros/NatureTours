import { Router } from "express";
import {
  getResellerById,
  getAllResellers,
  createReseller,
  updateReseller,
  getResellerCommissions,
  updateCommissionStatus,
} from "../controllers/resellers.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Admin
router.get("/", authenticateToken, getAllResellers);
router.post("/", authenticateToken, createReseller);
router.patch("/commissions/:paymentId", authenticateToken, updateCommissionStatus);
router.get("/:id/commissions", authenticateToken, getResellerCommissions);
router.patch("/:id", authenticateToken, updateReseller);

// Público (página /reseller/:id)
router.get("/:id", getResellerById);

export default router;

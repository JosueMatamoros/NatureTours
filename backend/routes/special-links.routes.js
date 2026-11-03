import { Router } from "express";
import {
  listSpecialLinks,
  createSpecialLink,
  updateSpecialLink,
  getSpecialLink,
  bookSpecialLink,
} from "../controllers/special-links.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Admin
router.get("/", authenticateToken, listSpecialLinks);
router.post("/", authenticateToken, createSpecialLink);
router.patch("/:id", authenticateToken, updateSpecialLink);

// Público (página /link/:id)
router.get("/:id", getSpecialLink);
router.post("/:id/book", bookSpecialLink);

export default router;

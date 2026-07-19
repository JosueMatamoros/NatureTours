import { Router } from "express";
import { getResellerById } from "../controllers/resellers.controller.js";

const router = Router();

router.get("/:id", getResellerById);

export default router;

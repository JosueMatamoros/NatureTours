import { Router } from "express";
import { otaInbound } from "../controllers/ota.controller.js";

const router = Router();

// Autenticado por token secreto (x-ota-token), no por sesión admin.
router.post("/inbound", otaInbound);

export default router;

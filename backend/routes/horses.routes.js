import { Router } from "express";
import {
  horsesMe, listHorses, createHorse, updateHorse, addHorseEvent, horseHistory,
  horsesDay, assignHorse, horsesDays, horsesStats,
} from "../controllers/horses.controller.js";
import { authenticateHorses } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticateHorses);

router.get("/me", horsesMe);
router.get("/day", horsesDay);
router.get("/days", horsesDays);
router.get("/stats", horsesStats);
router.put("/day/assign", assignHorse);
router.get("/", listHorses);
router.post("/", createHorse);
router.patch("/:id", updateHorse);
router.get("/:id/events", horseHistory);
router.post("/:id/events", addHorseEvent);

export default router;

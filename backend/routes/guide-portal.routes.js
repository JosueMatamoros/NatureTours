import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  guideLogin,
  guideLogout,
  guideMe,
  guideMyDay,
  guideMyDays,
  guideSetArrived,
  guideAllGuides,
  guideAssignSlot,
  guideOffers,
  guideTakeOffer,
  guideReply,
  guidePublishOffer,
  guideCancelOffer,
} from "../controllers/guide-portal.controller.js";
import { authenticateGuide } from "../middlewares/auth.middleware.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Demasiados intentos, intentá más tarde" },
});

router.post("/login", loginLimiter, guideLogin);
router.post("/logout", guideLogout);
router.get("/me", authenticateGuide, guideMe);
router.get("/my-day", authenticateGuide, guideMyDay);
router.get("/my-days", authenticateGuide, guideMyDays);
router.patch("/attendance/:bookingId", authenticateGuide, guideSetArrived);
router.get("/all-guides", authenticateGuide, guideAllGuides);
router.put("/assign", authenticateGuide, guideAssignSlot);
router.get("/offers", authenticateGuide, guideOffers);
router.post("/offers", authenticateGuide, guidePublishOffer);
router.post("/offers/:id/take", authenticateGuide, guideTakeOffer);
router.delete("/offers/:id", authenticateGuide, guideCancelOffer);
router.post("/reply", authenticateGuide, guideReply);

export default router;

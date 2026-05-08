import { Router } from "express";
import passport from "../config/passport";
import { getMe, logout, googleCallback } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  googleCallback
);

router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);

export default router;

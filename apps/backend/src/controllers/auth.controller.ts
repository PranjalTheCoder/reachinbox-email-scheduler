import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { success, unauthorized } from "../lib/api-response";

export function getMe(req: Request, res: Response): void {
  if (!req.user) {
    unauthorized(res, "Not authenticated");
    return;
  }
  success(res, { user: req.user }, "User fetched");
}

export function logout(req: Request, res: Response): void {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.clearCookie("token");
      success(res, null, "Logged out");
    });
  });
}

export function googleCallback(req: Request, res: Response): void {
  const user = req.user as { id: string; email: string; name: string; avatar: string };
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    env.jwt.secret,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(`${env.frontendUrl}/dashboard`);
}

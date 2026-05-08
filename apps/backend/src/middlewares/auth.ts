import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { userRepository } from "../repositories/user.repository";
import { unauthorized } from "../lib/api-response";
import type { JwtPayload } from "../types";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token;
  if (!token) {
    unauthorized(res, "Authentication required");
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    const user = await userRepository.findById(payload.id);
    if (!user) {
      unauthorized(res, "User not found");
      return;
    }
    req.user = user;
    next();
  } catch {
    unauthorized(res, "Invalid or expired token");
  }
}

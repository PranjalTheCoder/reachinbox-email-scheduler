import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { validate, validateQuery, validateParams } from "../middlewares/validate";
import { scheduleEmailsSchema, paginationSchema, emailIdParamSchema } from "../validators/email.validator";
import {
  scheduleEmails,
  parseCSV,
  getScheduled,
  getSent,
  getById,
  getEvents,
  getStats,
  upload,
} from "../controllers/email.controller";

const router = Router();

router.use(requireAuth);

router.post("/schedule", validate(scheduleEmailsSchema), asyncHandler(scheduleEmails));
router.post("/parse-csv", upload.single("file"), asyncHandler(parseCSV));
router.get("/scheduled", validateQuery(paginationSchema), asyncHandler(getScheduled));
router.get("/sent", validateQuery(paginationSchema), asyncHandler(getSent));
router.get("/stats", asyncHandler(getStats));
router.get("/:id", validateParams(emailIdParamSchema), asyncHandler(getById));
router.get("/:id/events", validateParams(emailIdParamSchema), asyncHandler(getEvents));

export default router;

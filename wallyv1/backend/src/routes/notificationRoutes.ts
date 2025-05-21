import express from "express";
import { handleWarpcastWebhook } from "../controllers/notificationController";

const router = express.Router();

router.post("/warpcast-webhook", handleWarpcastWebhook);

export default router;
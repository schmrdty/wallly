import axios from "axios";
import { logError, logInfo } from "../utils/logger";

export async function sendWarpcastNotification(
  tokens: string[],
  title: string,
  body: string,
  targetUrl: string
) {
  const payload = {
    notificationId: `notif-${Date.now()}`,
    title,
    body,
    targetUrl,
    tokens,
  };

  try {
    const response = await axios.post("https://api.warpcast.com/v1/frame-notifications", payload);
    logInfo("Notification sent:", response.data);
    return response.data;
  } catch (error) {
    logError("Error sending notification:", error);
    throw error;
  }
}
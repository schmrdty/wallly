import nodemailer from 'nodemailer';
import axios from 'axios';
import FormData from 'form-data';
import redisClient from '../../db/redisClient';
import { v4 as uuidv4 } from 'uuid';
import base64url from 'base64url';

// Helper: logError (define if not imported elsewhere)
function logError(...args: any[]) {
  // Replace with your logger if needed
  console.error(...args);
}

// Helper: getTelegramIdByEmail (stub, implement as needed)
async function getTelegramIdByEmail(email: string): Promise<string | null> {
  // Implement actual lookup logic
  return null;
}

export async function sendEmail(to: string, subject: string, text: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({ from: '"Wally" <noreply@yourdomain.com>', to, subject, text });
  } catch (err: any) {
    logError(`Email send failed for ${to}:`, err);
    // Fallback: send Telegram if user has telegramId
    const telegramId = await getTelegramIdByEmail(to);
    if (telegramId) {
      try {
        await sendTelegram(telegramId, `[Email Fallback] ${subject}\n${text}`);
      } catch (tgErr: any) {
        logError(`Telegram fallback failed for ${telegramId}:`, tgErr);
      }
    }
    // Optionally log to audit
    await redisClient.lPush('notificationErrors', JSON.stringify({
      type: 'email',
      to,
      subject,
      error: err.message,
      timestamp: Date.now()
    }));
  }
}

export async function sendTelegram(chatId: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });
  } catch (err: any) {
    logError(`Telegram send failed for ${chatId}:`, err);
    await redisClient.lPush('notificationErrors', JSON.stringify({
      type: 'telegram',
      chatId,
      message,
      error: err.message,
      timestamp: Date.now()
    }));
  }
}

export async function sendTelegramFile(chatId: string, buffer: Buffer, filename: string, caption?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendDocument`;

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', buffer, { filename });
  if (caption) formData.append('caption', caption);

  try {
    await axios.post(url, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  } catch (err: any) {
    logError(`Telegram file send failed for ${chatId}:`, err);
    await redisClient.lPush('notificationErrors', JSON.stringify({
      type: 'telegram_file',
      chatId,
      filename,
      error: err.message,
      timestamp: Date.now()
    }));
  }
}

export async function sendWarpcast(fid: string, message: string, idempotencyKey?: string) {
  if (!idempotencyKey) {
    idempotencyKey = base64url(uuidv4());
  }
  const key = `warpcast:${idempotencyKey}`;
  const alreadySent = await redisClient.get(key);
  if (alreadySent) return;

  try {
    await axios.post('https://api.warpcast.com/send', { fid, message, idempotencyKey });
    await redisClient.set(key, '1', 'EX', 3600);
  } catch (err: any) {
    logError(`Warpcast send failed for ${fid}:`, err);
    await redisClient.lPush('notificationErrors', JSON.stringify({
      type: 'warpcast',
      fid,
      message,
      error: err.message,
      timestamp: Date.now()
    }));
  }
}

export async function sendDedupedNotification(user: string, title: string, message: string, dedupeKey: string) {
  const key = `notif:${user}:${dedupeKey}`;
  const alreadySent = await redisClient.get(key);
  if (alreadySent) return; // Don't send duplicate
  await redisClient.set(key, '1', 'EX', 3600); // 1 hour dedupe window
  await sendInAppNotification(user, title, message);
}

export async function sendInAppNotification(user: string, title: string, message: string) {
  try {
    await redisClient.lPush(`notifications:${user}`, JSON.stringify({
      title,
      message,
      timestamp: Date.now()
    }));
  } catch (err: any) {
    await redisClient.lPush('notificationErrors', JSON.stringify({
      type: 'inapp',
      user,
      title,
      message,
      error: err.message,
      timestamp: Date.now()
    }));
  }
}

interface NotifyUserParams {
  userId: string;
  userAddress: string;
  title: string;
  message: string;
}

export async function notifyUser({ userId, userAddress, title, message }: NotifyUserParams) {
  let fid: string | null = null;
  try {
    const userMeta = await redisClient.get(`userMeta:${userId}`);
    if (userMeta) {
      const parsed = JSON.parse(userMeta);
      fid = parsed.fid || null;
    }
  } catch (e) {
    fid = null;
  }

  if (fid) {
    await sendWarpcast(fid, message);
  } else {
    await sendInAppNotification(userAddress, title, message);
  }
}
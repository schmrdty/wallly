import nodemailer from 'nodemailer';
import axios from 'axios';
import FormData from 'form-data';

export async function sendEmail(to: string, subject: string, text: string) {
  const transporter = nodemailer.createTransport({
    // Replace with your SMTP config or use a service like SendGrid/Mailgun
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({ from: '"Wally" <noreply@yourdomain.com>', to, subject, text });
}

export async function sendTelegram(chatId: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: message,
  });
}

export async function sendTelegramFile(chatId: string, buffer: Buffer, filename: string, caption?: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendDocument`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', buffer, filename);
    if (caption) formData.append('caption', caption);

    await axios.post(url, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });
}

export async function sendWarpcast(fid: string, message: string) {
  // Replace with actual Warpcast/Farcaster API integration
  await axios.post('https://api.warpcast.com/send', { fid, message });
}
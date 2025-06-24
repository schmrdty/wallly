import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import { getUserPreferences } from './userPreferences.js';

export async function sendFarcasterNotification(userId: string, message: string) {
    try {
        const response = await fetch(`https://api.warpcast.com/notifications/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FARCASTER_API_KEY}`
            },
            body: JSON.stringify({ userId, message })
        });
        if (!response.ok) throw new Error(`Failed to send Farcaster notification`);
        console.log(`Farcaster notification sent to ${userId}`);
    } catch (error) {
        console.error('Error sending Farcaster notification:', error);
    }
}

export async function sendFarcasterCast(userId: string, message: string) {
    try {
        const response = await fetch(`https://api.warpcast.com/casts/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FARCASTER_API_KEY}`
            },
            body: JSON.stringify({ userId, message })
        });
        if (!response.ok) throw new Error(`Failed to send Farcaster cast`);
        console.log(`Farcaster cast sent to ${userId}`);
    } catch (error) {
        console.error('Error sending Farcaster cast:', error);
    }
}

export async function sendTelegramMessage(userId: string, message: string) {
    try {
        const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            body: JSON.stringify({ chat_id: userId, text: message }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Failed to send Telegram message`);
        console.log(`Telegram message sent to ${userId}`);
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendEmail(userId: string, message: string) {
    try {
        const user = await getUserPreferences(userId);
        if (!user || !user.email) return;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Wallet Activity Notification',
            text: message
        });
        console.log(`Email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

export async function sendPushNotification(userId: string, message: string) {
    try {
        const pushApiUrl = `https://push-service.example.com/send`;
        const response = await fetch(pushApiUrl, {
            method: 'POST',
            body: JSON.stringify({ userId, message }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Failed to send push notification`);
        console.log(`Push notification sent to ${userId}`);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

export { getUserPreferences } from './userPreferences.js';

import { sendTelegramFile } from './notificationServices';

export async function exportAndSendUserDataViaTelegram(
    chatId: string,
    userData: any[],
    format: 'csv' | 'json' = 'csv'
) {
    let buffer: Buffer;
    let filename: string;
    if (format === 'csv') {
        buffer = generateCSV(userData);
        filename = 'user_data.csv';
    } else {
        buffer = generateJSON(userData);
        filename = 'user_data.json';
    }
    await sendTelegramFile(chatId, buffer, filename, 'Your exported data from Wally');
}
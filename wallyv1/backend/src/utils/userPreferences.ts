import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URI,
});

export async function getUserPreferences(userId: string) {
    try {
        const { rows } = await pool.query('SELECT preferences FROM users WHERE user_id = $1', [userId]);
        if (!rows.length) {
            console.warn(`User preferences not found for ${userId}`);
            return null;
        }
        return rows[0].preferences;
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        return null;
    }
}

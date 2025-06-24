// Minimal index.ts for debugging path-to-regexp issue
import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

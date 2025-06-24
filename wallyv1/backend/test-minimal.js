// Test Express with helmet and cors
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const PORT = 5001; // Use different port to avoid conflicts

// Add middleware
app.use(helmet());
app.use(cors({
    origin: [
        'https://wally.schmidtiest.xyz',
        'https://app.schmidtiest.xyz',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/test', (req, res) => {
    res.json({ message: 'test with helmet and cors works' });
});

app.listen(PORT, () => {
    console.log(`Test server with middleware running on port ${PORT}`);
});

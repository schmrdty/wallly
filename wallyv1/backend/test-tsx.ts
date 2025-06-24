// Test TypeScript compilation with tsx
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5002;

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

app.get('/test', (req: express.Request, res: express.Response) => {
    res.json({ message: 'TypeScript test with tsx works' });
});

app.listen(PORT, () => {
    console.log(`TypeScript test server running on port ${PORT}`);
});

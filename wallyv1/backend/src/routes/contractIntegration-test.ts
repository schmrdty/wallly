import { Router } from 'express';

const router = Router();

// Simple test route
router.get('/', (req, res) => {
    res.json({ message: 'Contract integration test routes are working!' });
});

export default router;

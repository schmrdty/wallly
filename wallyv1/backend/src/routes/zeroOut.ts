import express from 'express';

const router = express.Router();

// Zero Out Old Wallet Routes
router.get('/rules', async (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        console.error('Error fetching zero out rules:', error);
        res.status(500).json({ error: 'Failed to fetch zero out rules' });
    }
});

router.post('/create', async (req, res) => {
    try {
        const rule = req.body;
        console.log('Creating zero out rule:', rule);
        res.status(201).json({ message: 'Zero out rule created successfully', id: 'temp-id' });
    } catch (error) {
        console.error('Error creating zero out rule:', error);
        res.status(500).json({ error: 'Failed to create zero out rule' });
    }
});

router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log('Updating zero out rule:', id, updates);
        res.json({ message: 'Zero out rule updated successfully' });
    } catch (error) {
        console.error('Error updating zero out rule:', error);
        res.status(500).json({ error: 'Failed to update zero out rule' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Deleting zero out rule:', id);
        res.json({ message: 'Zero out rule deleted successfully' });
    } catch (error) {
        console.error('Error deleting zero out rule:', error);
        res.status(500).json({ error: 'Failed to delete zero out rule' });
    }
});

export default router;

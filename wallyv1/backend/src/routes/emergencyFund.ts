import express from 'express';

const router = express.Router();

// Emergency Fund Routes
router.get('/rules', async (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        console.error('Error fetching emergency fund rules:', error);
        res.status(500).json({ error: 'Failed to fetch emergency fund rules' });
    }
});

router.post('/create', async (req, res) => {
    try {
        const rule = req.body;
        console.log('Creating emergency fund rule:', rule);
        res.status(201).json({ message: 'Emergency fund rule created successfully', id: 'temp-id' });
    } catch (error) {
        console.error('Error creating emergency fund rule:', error);
        res.status(500).json({ error: 'Failed to create emergency fund rule' });
    }
});

router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log('Updating emergency fund rule:', id, updates);
        res.json({ message: 'Emergency fund rule updated successfully' });
    } catch (error) {
        console.error('Error updating emergency fund rule:', error);
        res.status(500).json({ error: 'Failed to update emergency fund rule' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Deleting emergency fund rule:', id);
        res.json({ message: 'Emergency fund rule deleted successfully' });
    } catch (error) {
        console.error('Error deleting emergency fund rule:', error);
        res.status(500).json({ error: 'Failed to delete emergency fund rule' });
    }
});

export default router;

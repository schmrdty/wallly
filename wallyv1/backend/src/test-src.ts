// Minimal test for src folder
import express from 'express';

const app = express();
const PORT = 5003;

app.get('/src-test', (req, res) => {
    res.json({ message: 'src folder test works' });
});

console.log('Starting src folder test...');
app.listen(PORT, () => {
    console.log(`Src folder test server running on port ${PORT}`);
});

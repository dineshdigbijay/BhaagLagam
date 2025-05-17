require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from frontend
app.use(express.static('../frontend'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/groups', require('./routes/groups'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: "Bhaaglagam API is working!" });
});

// Start server
const PORT = process.env.PORT || 3306;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
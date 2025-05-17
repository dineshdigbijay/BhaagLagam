const express = require('express');
const router = express.Router();
const db = require('../db');

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND password = ?', 
      [email, password]
    );
    
    if (users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    
    res.json({ 
      success: true, 
      user: { id: result.insertId, name, email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
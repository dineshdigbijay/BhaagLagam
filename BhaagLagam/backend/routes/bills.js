const express = require('express');
const router = express.Router();
const db = require('../db');

// Create a new bill
router.post('/', async (req, res) => {
  const { description, amount, paid_by, group_id } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO bills (description, amount, paid_by, group_id) VALUES (?, ?, ?, ?)',
      [description, amount, paid_by, group_id]
    );
    
    res.json({ 
      success: true, 
      bill: { id: result.insertId, description, amount, paid_by, group_id }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bills for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const [bills] = await db.query(
      'SELECT * FROM bills WHERE group_id = ?',
      [req.params.groupId]
    );
    
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
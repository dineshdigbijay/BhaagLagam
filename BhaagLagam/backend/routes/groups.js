const express = require('express');
const router = express.Router();
const db = require('../db');

// Create a new group
router.post('/', async (req, res) => {
  const { name, created_by } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO groups (name, created_by) VALUES (?, ?)',
      [name, created_by]
    );
    
    res.json({ 
      success: true, 
      group: { id: result.insertId, name, created_by }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's groups
router.get('/user/:userId', async (req, res) => {
  try {
    const [groups] = await db.query(`
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `, [req.params.userId]);
    
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
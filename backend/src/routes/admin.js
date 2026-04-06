const express = require('express');
const router = express.Router();
const db = require('../models');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Apply auth and adminAuth to all routes in this router
router.use(auth);
router.use(adminAuth);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: ['id', 'username', 'email', 'tokens', 'isAdmin', 'createdAt'],
      include: [
        {
          model: db.History,
          as: 'histories',
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/tokens
router.put('/users/:id/tokens', async (req, res) => {
  try {
    const { tokens } = req.body;
    if (typeof tokens !== 'number') {
      return res.status(400).json({ success: false, error: 'Tokens must be a number' });
    }

    const user = await db.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.tokens = tokens;
    await user.save();

    res.json({ success: true, user: { id: user.id, username: user.username, tokens: user.tokens } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

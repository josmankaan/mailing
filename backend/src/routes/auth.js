const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'b2b_secret_key';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    let user = await db.User.findOne({ where: { username } });

    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    user = await db.User.create({ username, password, email });

    const payload = { user: { id: user.id, isAdmin: user.isAdmin } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ success: true, token, user: { id: user.id, username, email: user.email, tokens: user.tokens, isAdmin: user.isAdmin } });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = await db.User.findOne({ where: { username } });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id, isAdmin: user.isAdmin } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ success: true, token, user: { id: user.id, username, email: user.email, tokens: user.tokens, isAdmin: user.isAdmin } });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, { attributes: ['id', 'username', 'email', 'tokens', 'isAdmin'] });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../models');
const auth = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');



// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    let user = await db.User.findOne({ where: { username } });

    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    user = await db.User.create({ 
      username, 
      password, 
      email, 
      tokens: 50,
      isVerified: false,
      verificationToken
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'Registration successful! Please check your email to verify your account.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await db.User.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error during verification' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if the input is an email or username
    const { Op } = require('sequelize');
    let user = await db.User.findOne({ 
      where: { 
        [Op.or]: [
          { username: username },
          { email: username }
        ]
      } 
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid Credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        error: 'Email not verified. Please check your inbox for the activation link.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id, isAdmin: user.isAdmin } };
    jwt.sign(payload, process.env.JWT_SECRET || 'b2b_secret_key', { expiresIn: '7d' }, (err, token) => {
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
    const user = await db.User.findByPk(req.user.id, { attributes: ['id', 'username', 'email', 'tokens', 'isAdmin', 'isVerified'] });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

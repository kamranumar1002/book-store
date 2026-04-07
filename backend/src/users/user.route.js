const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./user.model');

const router = express.Router();

// Use env JWT secret if provided, otherwise fall back to the README value
const JWT_SECRET =
  process.env.JWT_SECRET_KEY ||
  'bc992a20cb6706f741433686be814e3df45e57ea1c2fc85f9dbb0ef7df12308a669bfa7c976368ff32e32f6541480ce9ec1b122242f9b1257ab669026aeaf16';

const signAuthToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const normalizeUsername = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const isBcryptHash = (value) => typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

const verifyAndUpgradePassword = async (user, plainPassword) => {
  // Normal bcrypt flow
  if (isBcryptHash(user.password)) {
    return bcrypt.compare(plainPassword, user.password);
  }

  // Legacy fallback for old plain-text users: allow login once, then upgrade hash
  if (user.password === plainPassword) {
    user.password = plainPassword; // pre-save hook hashes this
    await user.save();
    return true;
  }

  return false;
};

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';
  if (!normalizedUsername || !normalizedPassword) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  try {
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const normalizedRole = role === 'admin' ? 'admin' : 'user';
    const user = new User({ username: normalizedUsername, password: normalizedPassword, role: normalizedRole });
    await user.save(); // pre-save hook hashes password

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Failed to register user', error);
    return res.status(500).json({ message: 'Failed to register user' });
  }
});

// Generic login for both `user` and `admin`
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';
  if (!normalizedUsername || !normalizedPassword) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'JWT secret is not configured' });
  }

  try {
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(404).send({ message: 'User not found!' });
    }

    const ok = await verifyAndUpgradePassword(user, normalizedPassword);
    if (!ok) {
      return res.status(401).send({ message: 'Invalid password!' });
    }

    const token = signAuthToken(user);
    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: { username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Failed to login', error);
    return res.status(401).send({ message: 'Failed to login' });
  }
});

// Admin login used by the dashboard
router.post('/admin', async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';
  if (!normalizedUsername || !normalizedPassword) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'JWT secret is not configured' });
  }

  try {
    const admin = await User.findOne({ username: normalizedUsername, role: 'admin' });
    if (!admin) {
      return res.status(404).send({ message: 'Admin not found!' });
    }

    const ok = await verifyAndUpgradePassword(admin, normalizedPassword);
    if (!ok) {
      return res.status(401).send({ message: 'Invalid password!' });
    }

    const token = signAuthToken(admin);
    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Failed to login as admin', error);
    return res.status(401).send({ message: 'Failed to login as admin' });
  }
});

module.exports = router;
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'f1-app-secret-key-2025';

// In-memory user store
const users: Map<string, User> = new Map();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields required' });
  }

  // Check if user exists
  const existing = Array.from(users.values()).find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'User already exists' });
  }

  const user: User = {
    id: uuidv4(),
    username,
    email,
    password, // In production, hash this!
  };

  users.set(user.id, user);

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, username: user.username, email: user.email }
    }
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const user = Array.from(users.values()).find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, username: user.username, email: user.email }
    }
  });
});

router.post('/favorites', (req, res) => {
  const { userId, favoriteDriver, favoriteTeam } = req.body;
  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  if (favoriteDriver) user.favoriteDriver = favoriteDriver;
  if (favoriteTeam) user.favoriteTeam = favoriteTeam;
  res.json({ success: true, data: { favoriteDriver: user.favoriteDriver, favoriteTeam: user.favoriteTeam } });
});

export default router;

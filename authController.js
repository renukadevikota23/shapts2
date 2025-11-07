import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { dbHelpers } from '../config/db.js';

// Register new user
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const existingUser = await dbHelpers.findOne('users', { email });
  if (existingUser) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userRole = ['patient', 'doctor', 'admin'].includes(role) ? role : 'patient';

  const user = await dbHelpers.insert('users', {
    name,
    email,
    password: hashedPassword,
    role: userRole
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await dbHelpers.findOne('users', { email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// Logout user (token invalidation handled client-side or token blacklist not implemented here)
export const logout = asyncHandler(async (req, res) => {
  // Since JWT is stateless, logout is client-side by removing token.
  res.json({ message: 'Logout successful' });
});

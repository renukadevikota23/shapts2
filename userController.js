import asyncHandler from 'express-async-handler';
import { dbHelpers } from '../config/db.js';

// @desc Get logged in user profile
// @route GET /api/users/profile
// @access Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await dbHelpers.findById('users', req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const { password, ...safe } = user;
  res.json(safe);
});

// @desc Update logged in user profile (except password)
// @route PUT /api/users/profile
// @access Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await dbHelpers.findById('users', req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const { name, email } = req.body;

  if (email && email !== user.email) {
    // Check if new email is unique
    const emailExists = await dbHelpers.findOne('users', { email });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use');
    }
  }

  const updates = { name: name || user.name, email: email || user.email };
  const updatedUser = await dbHelpers.updateById('users', user._id, updates);

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role
  });
});

// @desc List all users (paginated), admin only
// @route GET /api/users
// @access Private/Admin
export const listUsers = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const allUsers = await dbHelpers.find('users');
  const sorted = allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const count = sorted.length;
  const start = pageSize * (page - 1);
  const users = sorted.slice(start, start + pageSize).map((u) => {
    const { password, ...safe } = u;
    return safe;
  });

  res.json({
    users,
    page,
    pages: Math.ceil(count / pageSize)
  });
});

// @desc Delete user by ID, admin only
// @route DELETE /api/users/:id
// @access Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await dbHelpers.findById('users', req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await dbHelpers.removeById('users', req.params.id);
  res.json({ message: 'User removed' });
});

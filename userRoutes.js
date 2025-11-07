import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  listUsers,
  deleteUser
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

router.route('/').get(protect, admin, listUsers);
router.route('/:id').delete(protect, admin, deleteUser);

export default router;

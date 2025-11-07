import express from 'express';
import {
  createPrescription,
  getPrescriptionsByUser,
  updatePrescription,
  deletePrescription
} from '../controllers/prescriptionController.js';
import { protect, admin, doctor, patient } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, doctor, createPrescription);

router.route('/user/:userId')
  .get(protect, getPrescriptionsByUser);

router.route('/:id')
  .put(protect, doctor, updatePrescription)
  .delete(protect, (req, res, next) => {
    // doctor or admin allowed
    if (req.user.role === 'doctor' || req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: 'Access denied' });
  }, deletePrescription);

export default router;

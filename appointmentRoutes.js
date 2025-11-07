import express from 'express';
import {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  cancelAppointment
} from '../controllers/appointmentController.js';
import { protect, admin, doctor, patient } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, patient, createAppointment)
  .get(protect, getAppointments);

router.route('/:id/status')
  .put(protect, (req, res, next) => {
    // only doctor or admin
    if (req.user.role === 'doctor' || req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: 'Access denied' });
  }, updateAppointmentStatus);

router.route('/:id')
  .delete(protect, patient, cancelAppointment);

export default router;

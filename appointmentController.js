import asyncHandler from 'express-async-handler';
import { dbHelpers } from '../config/db.js';

// @desc Create appointment (patient books doctor)
// @route POST /api/appointments
// @access Private (patient)
export const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, notes } = req.body;

  if (!doctorId || !appointmentDate) {
    res.status(400);
    throw new Error('Doctor and appointment date are required');
  }

  // Validate doctor exists and is role doctor
  const doctor = await dbHelpers.findById('users', doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    res.status(400);
    throw new Error('Doctor not found');
  }

  const appointmentDateObj = new Date(appointmentDate);
  if (isNaN(appointmentDateObj.getTime())) {
    res.status(400);
    throw new Error('Invalid appointment date');
  }

  if (appointmentDateObj < new Date()) {
    res.status(400);
    throw new Error('Appointment date must be in the future');
  }

  const createdAppointment = await dbHelpers.insert('appointments', {
    patient: req.user._id,
    doctor: doctorId,
    appointmentDate: appointmentDateObj.toISOString(),
    notes: notes || '',
    status: 'scheduled'
  });

  res.status(201).json(createdAppointment);
});

// @desc Get appointments filtered by user role
// @route GET /api/appointments
// @access Private
export const getAppointments = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'patient') {
    filter.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    filter.doctor = req.user._id;
  } // admin can see all
  const appointmentsRaw = await dbHelpers.find('appointments', filter);
  // sort by appointmentDate
  const appointments = await Promise.all(
    appointmentsRaw
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
      .map(async (appt) => {
        const patient = await dbHelpers.findById('users', appt.patient);
        const doctor = await dbHelpers.findById('users', appt.doctor);
        return {
          ...appt,
          patient: patient ? { _id: patient._id, name: patient.name, email: patient.email } : null,
          doctor: doctor ? { _id: doctor._id, name: doctor.name, email: doctor.email } : null
        };
      })
  );

  res.json(appointments);
});

// @desc Update appointment status (doctor/admin)
// @route PUT /api/appointments/:id/status
// @access Private (doctor/admin)
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await dbHelpers.findById('appointments', req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Only doctor assigned or admin
  if (
    req.user.role !== 'admin' &&
    !(req.user.role === 'doctor' && String(appointment.doctor) === String(req.user._id))
  ) {
    res.status(403);
    throw new Error('Not authorized to update appointment status');
  }

  const { status } = req.body;
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const updated = await dbHelpers.updateById('appointments', appointment._id, { status });

  res.json(updated);
});

// @desc Cancel appointment (patient)
// @route DELETE /api/appointments/:id
// @access Private (patient)
export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await dbHelpers.findById('appointments', req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (String(appointment.patient) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to cancel this appointment');
  }

  if (appointment.status === 'cancelled') {
    res.status(400);
    throw new Error('Appointment is already cancelled');
  }

  await dbHelpers.updateById('appointments', appointment._id, { status: 'cancelled' });

  res.json({ message: 'Appointment cancelled' });
});

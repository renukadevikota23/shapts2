import asyncHandler from 'express-async-handler';
import { dbHelpers } from '../config/db.js';

// @desc Create prescription (doctor creates for appointment)
// @route POST /api/prescriptions
// @access Private (doctor)
export const createPrescription = asyncHandler(async (req, res) => {
  const { appointmentId, medications, instructions } = req.body;

  if (!appointmentId || !Array.isArray(medications) || medications.length === 0) {
    res.status(400);
    throw new Error('Appointment ID and at least one medication are required');
  }

  const appointment = await dbHelpers.findById('appointments', appointmentId);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Only assigned doctor can create prescription
  if (!(req.user.role === 'doctor' && String(appointment.doctor) === String(req.user._id))) {
    res.status(403);
    throw new Error('Not authorized to create prescription for this appointment');
  }

  const createdPrescription = await dbHelpers.insert('prescriptions', {
    appointment: appointmentId,
    medications,
    instructions: instructions || '',
    issuedDate: new Date().toISOString()
  });

  res.status(201).json(createdPrescription);
});

// @desc Get prescriptions by patient user ID
// @route GET /api/prescriptions/user/:userId
// @access Private (patient self or doctor/admin)
export const getPrescriptionsByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Patient can only get own prescriptions
  if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
    res.status(403);
    throw new Error('Not authorized to access these prescriptions');
  }

  // Find all prescriptions where appointment.patient == userId
  const allPrescriptions = await dbHelpers.find('prescriptions');
  // For each prescription, load its appointment and related users, filter by appointment.patient === userId
  const withAppointment = [];
  for (const p of allPrescriptions) {
    const appointment = await dbHelpers.findById('appointments', p.appointment);
    if (appointment && String(appointment.patient) === String(userId)) {
      const doctor = await dbHelpers.findById('users', appointment.doctor);
      const patient = await dbHelpers.findById('users', appointment.patient);
      withAppointment.push({
        ...p,
        appointment: {
          ...appointment,
          doctor: doctor ? { _id: doctor._id, name: doctor.name, email: doctor.email } : null,
          patient: patient ? { _id: patient._id, name: patient.name, email: patient.email } : null
        }
      });
    }
  }

  // sort by issuedDate desc
  withAppointment.sort((a, b) => new Date(b.issuedDate) - new Date(a.issuedDate));

  res.json(withAppointment);
});

// @desc Update prescription (doctor)
// @route PUT /api/prescriptions/:id
// @access Private (doctor)
export const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await dbHelpers.findById('prescriptions', req.params.id);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }
  const appointment = await dbHelpers.findById('appointments', prescription.appointment);
  if (!(req.user.role === 'doctor' && appointment && String(appointment.doctor) === String(req.user._id))) {
    res.status(403);
    throw new Error('Not authorized to update this prescription');
  }

  const { medications, instructions } = req.body;
  const updates = {};
  if (medications && Array.isArray(medications) && medications.length > 0) {
    updates.medications = medications;
  }
  if (instructions !== undefined) {
    updates.instructions = instructions;
  }

  const updatedPrescription = await dbHelpers.updateById('prescriptions', prescription._id, updates);

  res.json(updatedPrescription);
});

// @desc Delete prescription (doctor/admin)
// @route DELETE /api/prescriptions/:id
// @access Private (doctor/admin)
export const deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await dbHelpers.findById('prescriptions', req.params.id);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }
  const appointment = await dbHelpers.findById('appointments', prescription.appointment);

  if (
    req.user.role !== 'admin' &&
    !(req.user.role === 'doctor' && appointment && String(appointment.doctor) === String(req.user._id))
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this prescription');
  }

  await dbHelpers.removeById('prescriptions', req.params.id);
  res.json({ message: 'Prescription deleted' });
});

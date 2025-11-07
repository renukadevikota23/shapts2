import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import dotenv from 'dotenv';

dotenv.config();

let doctorToken;
let patientToken;
let appointmentId;
let prescriptionId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  await User.deleteMany({});
  await Appointment.deleteMany({});
  await Prescription.deleteMany({});

  // Create doctor user
  const doctorRes = await request(app).post('/api/auth/register').send({
    name: 'Doctor User',
    email: 'doctor2@example.com',
    password: 'DoctorPass123',
    role: 'doctor'
  });
  doctorToken = doctorRes.body.token;

  // Create patient user
  const patientRes = await request(app).post('/api/auth/register').send({
    name: 'Patient User',
    email: 'patient3@example.com',
    password: 'PatientPass123',
    role: 'patient'
  });
  patientToken = patientRes.body.token;

  // Create appointment assigned to doctor and patient
  const doctor = await User.findOne({ email: 'doctor2@example.com' });
  const patient = await User.findOne({ email: 'patient3@example.com' });

  const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const appointment = await Appointment.create({
    doctor: doctor._id,
    patient: patient._id,
    appointmentDate
  });
  appointmentId = appointment._id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Prescription API', () => {
  test('Doctor creates prescription', async () => {
    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId,
        medications: [
          { name: 'Med1', dosage: '10mg', frequency: 'Once a day' },
          { name: 'Med2', dosage: '5mg', frequency: 'Twice a day' }
        ],
        instructions: 'Take with food'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    prescriptionId = res.body._id;
  });

  test('Patient fetches own prescriptions', async () => {
    const patient = await User.findOne({ email: 'patient3@example.com' });
    const res = await request(app)
      .get(`/api/prescriptions/user/${patient._id}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('Doctor updates prescription', async () => {
    const res = await request(app)
      .put(`/api/prescriptions/${prescriptionId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        instructions: 'Updated instructions'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.instructions).toBe('Updated instructions');
  });

  test('Doctor deletes prescription', async () => {
    const res = await request(app)
      .delete(`/api/prescriptions/${prescriptionId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Prescription deleted');
  });
});

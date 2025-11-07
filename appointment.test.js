import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import dotenv from 'dotenv';

dotenv.config();

let patientToken;
let doctorToken;
let appointmentId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  await User.deleteMany({});
  await Appointment.deleteMany({});

  // Create doctor user
  const doctorRes = await request(app).post('/api/auth/register').send({
    name: 'Doctor User',
    email: 'doctor@example.com',
    password: 'DoctorPass123',
    role: 'doctor'
  });
  doctorToken = doctorRes.body.token;

  // Create patient user
  const patientRes = await request(app).post('/api/auth/register').send({
    name: 'Patient User',
    email: 'patient2@example.com',
    password: 'PatientPass123',
    role: 'patient'
  });
  patientToken = patientRes.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Appointment API', () => {
  test('Patient creates appointment', async () => {
    // Fetch doctor id
    const doctor = await User.findOne({ email: 'doctor@example.com' });
    const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctor._id,
        appointmentDate,
        notes: 'Need consultation'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    appointmentId = res.body._id;
  });

  test('Patient fetches own appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('Doctor fetches own appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('Doctor updates appointment status', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'completed' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  test('Patient cancels appointment', async () => {
    const res = await request(app)
      .delete(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Appointment cancelled');
  });
});

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

let adminToken;
let patientToken;
let testUserId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  await User.deleteMany({});

  // Create admin user
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPass123',
    role: 'admin'
  });
  adminToken = adminRes.body.token;

  // Create patient user
  const patientRes = await request(app).post('/api/auth/register').send({
    name: 'Patient User',
    email: 'patient@example.com',
    password: 'PatientPass123',
    role: 'patient'
  });
  patientToken = patientRes.body.token;
  testUserId = patientRes.body._id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('User API', () => {
  test('Get logged in user profile', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('patient@example.com');
  });

  test('Update logged in user profile', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ name: 'Updated Patient' });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Patient');
  });

  test('Admin can list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
  });

  test('Non-admin cannot list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Admin can delete user', async () => {
    // Create a new user to delete
    const newUserRes = await request(app).post('/api/auth/register').send({
      name: 'Delete User',
      email: 'delete@example.com',
      password: 'DeletePass123',
      role: 'patient'
    });

    const userIdToDelete = newUserRes.body._id;

    const res = await request(app)
      .delete(`/api/users/${userIdToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User removed');
  });
});

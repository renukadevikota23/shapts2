import { Low } from 'lowdb';
import { JSONFile } from 'lowdb';
import { join } from 'path';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

// Use a JSON file to persist data in development/local environments
const dbFile = process.env.LOWDB_FILE || join(process.cwd(), 'data', 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

// Initialize DB with defaults if empty
const connectDB = async () => {
  await db.read();
  db.data ||= { users: [], appointments: [], prescriptions: [] };
  await db.write();
  console.log(`lowdb initialized at ${dbFile}`);
};

// Helpers
const match = (item, query) => {
  return Object.keys(query).every((k) => {
    if (query[k] && typeof query[k] === 'object' && query[k].$in) {
      return query[k].$in.includes(item[k]);
    }
    return String(item[k]) === String(query[k]);
  });
};

const dbHelpers = {
  read: async () => {
    await db.read();
  },
  write: async () => {
    await db.write();
  },
  findOne: async (collection, query) => {
    await db.read();
    return db.data[collection].find((item) => match(item, query)) || null;
  },
  findById: async (collection, id) => {
    await db.read();
    return db.data[collection].find((item) => String(item._id) === String(id)) || null;
  },
  insert: async (collection, obj) => {
    await db.read();
    const record = { ...obj, _id: obj._id || nanoid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.data[collection].push(record);
    await db.write();
    return record;
  },
  updateById: async (collection, id, updates) => {
    await db.read();
    const idx = db.data[collection].findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return null;
    const updated = { ...db.data[collection][idx], ...updates, updatedAt: new Date().toISOString() };
    db.data[collection][idx] = updated;
    await db.write();
    return updated;
  },
  removeById: async (collection, id) => {
    await db.read();
    const idx = db.data[collection].findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return false;
    db.data[collection].splice(idx, 1);
    await db.write();
    return true;
  },
  find: async (collection, filter = {}) => {
    await db.read();
    const arr = db.data[collection];
    if (!filter || Object.keys(filter).length === 0) return arr.slice();
    return arr.filter((item) => {
      return Object.keys(filter).every((k) => {
        if (filter[k] && typeof filter[k] === 'object' && filter[k].$in) {
          return filter[k].$in.includes(item[k]);
        }
        return String(item[k]) === String(filter[k]);
      });
    });
  },
  count: async (collection, filter = {}) => {
    const arr = await dbHelpers.find(collection, filter);
    return arr.length;
  }
};

export default connectDB;
export { dbHelpers };

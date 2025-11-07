import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      trim: true
    }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
    },
    medications: {
      type: [medicationSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one medication is required'
      }
    },
    issuedDate: {
      type: Date,
      default: Date.now
    },
    instructions: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;

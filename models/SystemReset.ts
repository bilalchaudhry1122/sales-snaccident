import mongoose from 'mongoose';

const SystemResetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

// Create TTL index to automatically delete expired OTPs after 10 minutes
SystemResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.SystemReset || mongoose.model('SystemReset', SystemResetSchema);

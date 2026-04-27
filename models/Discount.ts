import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema({
  scope: { type: String, enum: ['global', 'item'], required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  type: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true },
  label: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Discount || mongoose.model('Discount', DiscountSchema);

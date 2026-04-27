import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  priceAtOrder: { type: Number, required: true },
  quantity: { type: Number, required: true },
  // Using 'discountType' / 'discountValue' to avoid Mongoose 'type' key conflict
  itemDiscount: {
    discountType: { type: String, enum: ['percent', 'flat'] },
    value: { type: Number }
  },
  lineTotal: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  // Fix: use 'discountType' instead of 'type' to avoid Mongoose schema key conflict
  orderDiscount: {
    discountType: { type: String, enum: ['percent', 'flat'] },
    value: { type: Number },
    label: { type: String }
  },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'failed'],
    default: 'pending'
  },
  placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String },
  failureReason: { type: String },
  notes: { type: String },
  placedAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date }
}, { timestamps: true });

// Core query indexes — critical for performance at 1000s of orders
OrderSchema.index({ status: 1, placedAt: -1 }); // primary: status filter + sort
OrderSchema.index({ placedAt: -1 });             // date range queries (audit reports)
OrderSchema.index({ orderNumber: 1 }, { unique: true }); // orderNumber lookups
OrderSchema.index({ placedBy: 1, placedAt: -1 }); // per-staff queries
OrderSchema.index({ customerName: 'text' });     // text search on customer name

// Partial index — only active orders (~3 statuses). Makes counter screens ultra-fast.
OrderSchema.index(
  { status: 1, placedAt: 1 },
  { partialFilterExpression: { status: { $in: ['pending', 'preparing', 'ready'] } } }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);

import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  priceAtOrder: { type: Number, required: true },
  quantity: { type: Number, required: true },
  itemDiscount: { 
    type: { type: String, enum: ['percent', 'flat'] },
    value: { type: Number }
  },
  lineTotal: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  orderDiscount: {
    type: { type: String, enum: ['percent', 'flat'] },
    value: { type: Number }
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

// Required indexes
OrderSchema.index({ status: 1 });
OrderSchema.index({ customerName: 1 });
OrderSchema.index({ placedAt: -1 });
OrderSchema.index({ status: 1, placedAt: -1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);

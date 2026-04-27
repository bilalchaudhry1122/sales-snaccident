import mongoose from 'mongoose';

const SaleItemSchema = new mongoose.Schema({
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

const SaleSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  items: [SaleItemSchema],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveredAt: { type: Date, required: true }
}, { timestamps: true });

SaleSchema.index({ deliveredAt: -1 });
SaleSchema.index({ 'items.menuItemId': 1 });
SaleSchema.index({ deliveredAt: -1, totalAmount: 1 });

export default mongoose.models.Sale || mongoose.model('Sale', SaleSchema);

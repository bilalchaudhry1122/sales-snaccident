import Counter from '../models/Counter';

export async function generateOrderNumber(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    'orderNumber',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  return `ORD-${counter.seq.toString().padStart(4, '0')}`;
}

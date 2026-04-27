interface Discount {
  type: 'percent' | 'flat';
  value: number;
}

export function applyDiscount(price: number, discount?: Discount | null): number {
  if (!discount) return 0;
  
  if (discount.type === 'percent') {
    const deduction = Math.floor(price * (discount.value / 100));
    return Math.min(deduction, price);
  } else if (discount.type === 'flat') {
    return Math.min(discount.value, price);
  }
  return 0;
}

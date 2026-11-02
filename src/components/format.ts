export const money = (n: number): string => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US')}`;
export const num = (n: number): string => n.toLocaleString('en-US');

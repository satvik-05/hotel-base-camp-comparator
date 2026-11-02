import { makeMoney, num } from './format';

describe('money formatting per city', () => {
  it('puts the symbol first and groups digits by the city locale', () => {
    expect(makeMoney({ symbol: '$', locale: 'en-US' })(1290)).toBe('$1,290');
    expect(makeMoney({ symbol: '₹', locale: 'en-IN' })(125000)).toBe('₹1,25,000');
    expect(makeMoney({ symbol: '₹', locale: 'en-IN' })(20500)).toBe('₹20,500');
    expect(makeMoney({ symbol: '¥', locale: 'en-US' })(56000)).toBe('¥56,000');
    expect(makeMoney({ symbol: '€', locale: 'en-US' })(790)).toBe('€790');
  });

  it('keeps the minus sign in front of the symbol and handles zero', () => {
    expect(makeMoney({ symbol: '₹', locale: 'en-IN' })(-9500)).toBe('-₹9,500');
    expect(makeMoney({ symbol: '$', locale: 'en-US' })(0)).toBe('$0');
  });

  it('formats importance-minute totals without a currency', () => {
    expect(num(1712)).toBe('1,712');
  });
});

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export class MemoryStore {
  constructor(seed) {
    this.products = structuredClone(seed).map((p, i) => ({
      ...p,
      _id: `local-product-${i + 1}`,
    }));
    this.orders = [];
    this.customers = [];
    this.customerTokens = new Map();
    this.coupons = [
      {
        _id: 'local-coupon-welcome',
        code: 'BERRY100',
        customerName: 'Guest',
        discountType: 'fixed',
        discountValue: 100,
        maxDiscount: null,
        minimumCartValue: 500,
        eligibleSkus: [],
        waiveCodAdvance: false,
        startsAt: new Date('2020-01-01T00:00:00Z'),
        expiresAt: new Date('2035-01-01T00:00:00Z'),
        usageLimit: 100,
        perCustomerLimit: 3,
        usedCount: 0,
        active: true,
        redemptions: [],
      },
    ];
    this.settings = {
      shipping: {
        standardFee: 0,
        freeShippingThreshold: null,
        codAdvanceFee: 0,
        codEnabled: true,
      },
      brand: {},
      faq: [],
      policies: {},
    };
    this.admins = [];
    this.enquiries = [];
    this.sequence = 0;
    this.tokens = new Map();
    const isProduction = process.env.NODE_ENV === 'production';
    this.adminPassword =
      process.env.ADMIN_PASSWORD || (isProduction ? '' : 'local-admin-123');
    this.adminEmail = (
      process.env.ADMIN_EMAIL ||
      (isProduction ? '' : 'admin@seabuckthorn.local')
    ).toLowerCase();
    this.logins = new Map();
  }
  nextId() {
    return `SBH-${new Date().getFullYear()}-${String(++this.sequence).padStart(6, '0')}`;
  }
  login(email, password) {
    if (!this.adminEmail || !this.adminPassword) return null;
    let now = Date.now(),
      a = this.logins.get(email) || { count: 0, until: 0 };
    if (a.until > now && a.count >= 8) return null;
    if (
      !timingSafeEqual(
        Buffer.from(String(password).padEnd(256, ' ').slice(0, 256)),
        Buffer.from(this.adminPassword.padEnd(256, ' ').slice(0, 256))
      )
    ) {
      a.count++;
      a.until = now + 15 * 60 * 1000;
      this.logins.set(email, a);
      return null;
    }
    this.logins.delete(email);
    let token = randomBytes(32).toString('hex');
    this.tokens.set(token, Date.now() + 8 * 60 * 60 * 1000);
    return token;
  }
  validToken(token) {
    return token && this.tokens.get(token) > Date.now();
  }
  issueCustomerToken(customerId) {
    let token = randomBytes(32).toString('hex');
    this.customerTokens.set(token, {
      customerId,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    });
    return token;
  }
}

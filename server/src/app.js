import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import {
  Product,
  Coupon,
  Order,
  Admin,
  Customer,
  Setting,
  nextOrderId,
} from './models.js';
import { catalogue } from './data.js';
import { MemoryStore } from './store.js';
const store = new MemoryStore(catalogue);
const useMemory = () => mongoose.connection.readyState !== 1;
const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true }));
app.use(
  express.json({
    limit: '32kb',
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith('/api/payments/cashfree/webhook'))
        req.rawBody = Buffer.from(buf);
    },
  })
);
const limited = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limited);
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
});
const fail = (res, status, message) => res.status(status).json({ message });
const bodySchema = z.object({
  items: z
    .array(
      z.object({
        sku: z.string().min(3),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(40),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ]{10,15}$/),
    email: z.string().email().optional().or(z.literal('')),
  }),
  address: z.object({
    line1: z.string().trim().min(3).max(160),
    line2: z.string().max(160).optional(),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    pincode: z.string().regex(/^\d{6}$/),
  }),
  paymentMethod: z.enum(['cod', 'cashfree']),
  couponCode: z.string().trim().max(40).optional(),
});
async function productsOrSeed() {
  if (useMemory()) return;
  if ((await Product.countDocuments()) === 0)
    await Product.insertMany(catalogue);
}
app.get('/api/health', (req, res) =>
  res.json({
    ok: true,
    database: useMemory() ? 'local-demo-memory' : 'connected',
  })
);
const customerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{10,15}$/),
  password: z.string().min(10).max(128),
});
const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(128),
});
const customerDto = (c) => ({
  _id: String(c._id),
  name: c.name,
  email: c.email,
  phone: c.phone,
});
function issueCustomerToken(customer) {
  if (useMemory()) return store.issueCustomerToken(String(customer._id));
  if (!process.env.JWT_SECRET)
    throw Error('JWT_SECRET must be configured for customer sessions.');
  return jwt.sign(
    { sub: String(customer._id), role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}
app.post('/api/auth/customer/register', authLimit, async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, parsed.error.issues[0].message);
  const d = parsed.data,
    email = d.email.toLowerCase();
  try {
    let customer;
    if (useMemory()) {
      if (store.customers.some((x) => x.email === email))
        return fail(res, 409, 'An account with this email already exists.');
      customer = {
        _id: `local-customer-${crypto.randomUUID()}`,
        name: d.name,
        email,
        phone: d.phone,
        passwordHash: await bcrypt.hash(d.password, 12),
        active: true,
      };
      store.customers.push(customer);
    } else {
      if (!process.env.JWT_SECRET)
        return fail(res, 503, 'Customer sign-in is not configured yet.');
      customer = await Customer.create({
        name: d.name,
        email,
        phone: d.phone,
        passwordHash: await bcrypt.hash(d.password, 12),
      });
    }
    res
      .status(201)
      .json({
        token: issueCustomerToken(customer),
        customer: customerDto(customer),
        demo: useMemory(),
      });
  } catch (e) {
    if (e.code === 11000)
      return fail(res, 409, 'An account with this email already exists.');
    throw e;
  }
});
app.post('/api/auth/customer/login', authLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, 'Enter a valid email address and password.');
  const { email, password } = parsed.data;
  let customer = useMemory()
    ? store.customers.find((x) => x.email === email.toLowerCase())
    : await Customer.findOne({ email: email.toLowerCase(), active: true });
  if (!customer || !(await bcrypt.compare(password, customer.passwordHash)))
    return fail(res, 401, 'Email or password is incorrect.');
  try {
    res.json({
      token: issueCustomerToken(customer),
      customer: customerDto(customer),
      demo: useMemory(),
    });
  } catch (e) {
    fail(res, 503, e.message);
  }
});
async function requireCustomer(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return fail(res, 401, 'Sign in to view your account.');
    if (useMemory()) {
      const session = store.customerTokens.get(token);
      if (!session || session.expiresAt < Date.now())
        return fail(res, 401, 'Customer session expired.');
      req.customer = store.customers.find(
        (x) => String(x._id) === session.customerId
      );
      if (!req.customer)
        return fail(res, 401, 'Customer account was not found.');
    } else {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role !== 'customer')
        return fail(res, 403, 'Customer access is required.');
      req.customer = await Customer.findOne({
        _id: payload.sub,
        active: true,
      }).select('name email phone');
      if (!req.customer)
        return fail(res, 401, 'Customer account was not found.');
    }
    next();
  } catch {
    return fail(res, 401, 'Customer session expired.');
  }
}
async function optionalCustomer(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next();
  try {
    if (useMemory()) {
      const session = store.customerTokens.get(token);
      if (!session || session.expiresAt < Date.now())
        return fail(res, 401, 'Customer session expired.');
      req.customer = store.customers.find(
        (x) => String(x._id) === session.customerId
      );
    } else {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role !== 'customer')
        return fail(res, 403, 'Customer access is required.');
      req.customer = await Customer.findOne({
        _id: payload.sub,
        active: true,
      }).select('name email phone');
    }
    if (!req.customer) return fail(res, 401, 'Customer account was not found.');
    next();
  } catch {
    return fail(res, 401, 'Customer session expired.');
  }
}
// The storefront exposes one sign-in endpoint and routes by the provisioned account role.
app.post('/api/auth/login', authLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, 'Enter a valid email address and password.');
  const { email, password } = parsed.data,
    normalizedEmail = email.toLowerCase();
  try {
    if (useMemory()) {
      if (normalizedEmail === store.adminEmail) {
        const token = store.login(normalizedEmail, password);
        return token
          ? res.json({ role: 'admin', token, demo: true })
          : fail(res, 401, 'Email or password is incorrect.');
      }
      const customer = store.customers.find((x) => x.email === normalizedEmail);
      if (!customer || !(await bcrypt.compare(password, customer.passwordHash)))
        return fail(res, 401, 'Email or password is incorrect.');
      return res.json({
        role: 'customer',
        token: issueCustomerToken(customer),
        customer: customerDto(customer),
        demo: true,
      });
    }
    if (!process.env.JWT_SECRET)
      return fail(res, 503, 'Sign-in is not configured yet.');
    const admin = await Admin.findOne({ email: normalizedEmail, active: true });
    if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
      admin.lastLoginAt = new Date();
      await admin.save();
      return res.json({
        role: 'admin',
        token: jwt.sign(
          { id: admin._id, role: admin.role },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
        ),
      });
    }
    const customer = await Customer.findOne({
      email: normalizedEmail,
      active: true,
    });
    if (!customer || !(await bcrypt.compare(password, customer.passwordHash)))
      return fail(res, 401, 'Email or password is incorrect.');
    return res.json({
      role: 'customer',
      token: issueCustomerToken(customer),
      customer: customerDto(customer),
    });
  } catch (error) {
    return fail(
      res,
      503,
      error.message || 'Sign-in is temporarily unavailable.'
    );
  }
});
app.get('/api/account/me', requireCustomer, (req, res) =>
  res.json({ customer: customerDto(req.customer) })
);
app.get('/api/account/orders', requireCustomer, async (req, res, next) => {
  try {
    const rows = useMemory()
      ? store.orders
          .filter((o) => String(o.customerId) === String(req.customer._id))
          .sort((a, b) => b.createdAt - a.createdAt)
      : await Order.find({ customerId: req.customer._id })
          .sort({ createdAt: -1 })
          .select(
            'orderId items subtotal discount shippingFee total paymentMethod paymentStatus orderStatus shipment createdAt'
          )
          .lean();
    res.json({ orders: rows });
  } catch (e) {
    next(e);
  }
});
app.get('/api/products', async (req, res, next) => {
  try {
    await productsOrSeed();
    let rows = useMemory() ? store.products : await Product.find({}).lean();
    res.json({ products: rows });
  } catch (e) {
    next(e);
  }
});
app.get('/api/products/:slug', async (req, res, next) => {
  try {
    let p = useMemory()
      ? store.products.find((x) => x.slug === req.params.slug)
      : await Product.findOne({ slug: req.params.slug }).lean();
    if (!p) return fail(res, 404, 'Product not found.');
    res.json({ product: p });
  } catch (e) {
    next(e);
  }
});
async function quoteCoupon(code, phone, items, subtotal) {
  if (!code) return { discount: 0, coupon: null };
  let c = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!c) throw Error('This coupon is invalid or unavailable.');
  let now = new Date();
  if (now < c.startsAt || now > c.expiresAt)
    throw Error('This coupon is outside its validity dates.');
  if (c.usedCount >= c.usageLimit)
    throw Error('This coupon has reached its usage limit.');
  if (
    c.redemptions.filter((r) => r.phone === phone).length >= c.perCustomerLimit
  )
    throw Error('This coupon has reached its per-customer limit.');
  if (subtotal < c.minimumCartValue)
    throw Error(
      `Add items worth ${c.minimumCartValue} or more to use this coupon.`
    );
  let eligible = items
    .filter((i) => !c.eligibleSkus.length || c.eligibleSkus.includes(i.sku))
    .reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  if (eligible <= 0)
    throw Error('This coupon does not apply to the selected products.');
  let discount =
    c.discountType === 'fixed'
      ? c.discountValue
      : Math.floor((eligible * c.discountValue) / 100);
  if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(discount, eligible);
  return { discount, coupon: c };
}
app.post('/api/coupons/validate', async (req, res, next) => {
  try {
    const { code, phone, items } = req.body || {};
    if (!code || !Array.isArray(items) || !phone)
      return fail(res, 400, 'Coupon, phone and cart items are required.');
    let rows = useMemory()
      ? store.products
      : await Product.find({
          'variants.sku': { $in: items.map((i) => i.sku) },
          isPublished: true,
        }).lean();
    let resolved = [];
    for (const i of items) {
      let p = rows.find(
          (x) => x.isPublished && x.variants.some((v) => v.sku === i.sku)
        ),
        v = p?.variants.find((v) => v.sku === i.sku);
      if (!v || !v.isActive || v.stock < i.quantity)
        return fail(res, 400, `Item ${i.sku} is unavailable.`);
      resolved.push({
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: v.sellingPrice,
      });
    }
    let subtotal = resolved.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    let q;
    if (useMemory()) {
      let c = store.coupons.find(
        (x) => x.code === code.toUpperCase() && x.active
      );
      if (!c) return fail(res, 400, 'This coupon is invalid or unavailable.');
      let n = new Date();
      if (
        n < c.startsAt ||
        n > c.expiresAt ||
        c.usedCount >= c.usageLimit ||
        c.redemptions.filter((x) => x.phone === phone).length >=
          c.perCustomerLimit ||
        subtotal < c.minimumCartValue
      )
        return fail(
          res,
          400,
          'This coupon is expired, used or not applicable.'
        );
      let eligible = resolved
        .filter((x) => !c.eligibleSkus.length || c.eligibleSkus.includes(x.sku))
        .reduce((s, x) => s + x.unitPrice * x.quantity, 0);
      let discount = Math.min(
        eligible,
        c.discountType === 'fixed'
          ? c.discountValue
          : Math.floor((eligible * c.discountValue) / 100),
        c.maxDiscount || Infinity
      );
      q = { discount, coupon: c };
    } else q = await quoteCoupon(code, phone, resolved, subtotal);
    res.json({
      valid: true,
      discount: q.discount,
      code: q.coupon.code,
      waiveCodAdvance: q.coupon.waiveCodAdvance,
    });
  } catch (e) {
    fail(res, 400, e.message);
  }
});
app.post('/api/orders', requireCustomer, async (req, res, next) => {
  try {
    let parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, parsed.error.issues[0].message);
    let d = parsed.data;
    d.customer = {
      ...d.customer,
      name: req.customer.name,
      email: req.customer.email,
      phone: d.customer.phone || req.customer.phone,
    };
    if (
      d.paymentMethod === 'cashfree' &&
      (!process.env.CASHFREE_APP_ID || useMemory())
    )
      return fail(
        res,
        503,
        'Online payment requires a MongoDB connection and Cashfree sandbox credentials.'
      );
    let found = useMemory()
      ? store.products
      : await Product.find({
          'variants.sku': { $in: d.items.map((i) => i.sku) },
          isPublished: true,
        });
    let lines = [];
    for (let i of d.items) {
      let p = found.find(
          (x) => x.isPublished && x.variants.some((v) => v.sku === i.sku)
        ),
        v = p?.variants.find((v) => v.sku === i.sku);
      if (!p || !v || !v.isActive)
        return fail(res, 400, 'An item is no longer available.');
      if (v.stock < i.quantity)
        return fail(res, 409, `${p.name} (${v.label}) has insufficient stock.`);
      lines.push({
        productId: p._id,
        title: p.name,
        variant: v.label,
        sku: v.sku,
        quantity: i.quantity,
        unitPrice: v.sellingPrice,
        mrp: v.mrp,
      });
    }
    let subtotal = lines.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      coupon = null,
      discount = 0;
    if (d.couponCode) {
      if (useMemory()) {
        coupon = store.coupons.find(
          (c) => c.code === d.couponCode.toUpperCase() && c.active
        );
        if (!coupon)
          return fail(res, 400, 'This coupon is invalid or unavailable.');
        let now = new Date();
        if (
          now < coupon.startsAt ||
          now > coupon.expiresAt ||
          coupon.usedCount >= coupon.usageLimit ||
          coupon.redemptions.filter((x) => x.phone === d.customer.phone)
            .length >= coupon.perCustomerLimit
        )
          return fail(
            res,
            400,
            'This coupon has expired or reached its usage limit.'
          );
        if (subtotal < coupon.minimumCartValue)
          return fail(res, 400, 'Cart does not meet this coupon minimum.');
        let eligible = lines
          .filter(
            (x) =>
              !coupon.eligibleSkus.length || coupon.eligibleSkus.includes(x.sku)
          )
          .reduce((s, x) => s + x.unitPrice * x.quantity, 0);
        if (!eligible)
          return fail(
            res,
            400,
            'This coupon does not apply to these products.'
          );
        discount = Math.min(
          eligible,
          coupon.discountType === 'fixed'
            ? coupon.discountValue
            : Math.floor((eligible * coupon.discountValue) / 100),
          coupon.maxDiscount || Infinity
        );
      } else
        ({ discount, coupon } = await quoteCoupon(
          d.couponCode,
          d.customer.phone,
          lines,
          subtotal
        ));
    }
    let cfg = useMemory()
      ? store.settings.shipping
      : (await Setting.findOne({ key: 'shipping' }).lean())?.value || {};
    if (d.paymentMethod === 'cod' && cfg.codEnabled === false)
      return fail(res, 400, 'Cash on delivery is not available.');
    let shippingFee = cfg.standardFee ?? 0,
      codAdvanceFee = d.paymentMethod === 'cod' ? (cfg.codAdvanceFee ?? 0) : 0;
    if (coupon?.waiveCodAdvance) codAdvanceFee = 0;
    let total = Math.max(0, subtotal - discount + shippingFee + codAdvanceFee),
      orderId = useMemory() ? store.nextId() : await nextOrderId(),
      couponSnap = coupon
        ? {
            code: coupon.code,
            customerName: coupon.customerName,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            amount: discount,
            waiveCodAdvance: coupon.waiveCodAdvance,
          }
        : undefined;
    let order = {
      orderId,
      customerId: req.customer?._id,
      customer: d.customer,
      shippingAddress: d.address,
      items: lines,
      subtotal,
      discount,
      shippingFee,
      codAdvanceFee,
      total,
      amountPaidOnline: 0,
      codBalance: d.paymentMethod === 'cod' ? total : 0,
      coupon: couponSnap,
      paymentMethod: d.paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      shipment: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (useMemory()) {
      for (const line of lines) {
        let v = store.products
          .flatMap((p) => p.variants)
          .find((x) => x.sku === line.sku);
        if (v.stock < line.quantity)
          return fail(res, 409, 'Stock changed while placing the order.');
      }
      for (const line of lines)
        store.products
          .flatMap((p) => p.variants)
          .find((x) => x.sku === line.sku).stock -= line.quantity;
      if (coupon) {
        coupon.usedCount++;
        coupon.redemptions.push({
          phone: d.customer.phone,
          orderId,
          usedAt: new Date(),
        });
      }
      store.orders.push(order);
    } else {
      let saved = await Order.create(order);
      order = saved.toObject();
      if (coupon) {
        let updated = await Coupon.findOneAndUpdate(
          {
            _id: coupon._id,
            active: true,
            usedCount: { $lt: coupon.usageLimit },
            'redemptions.phone': { $ne: d.customer.phone },
          },
          {
            $inc: { usedCount: 1 },
            $push: {
              redemptions: {
                phone: d.customer.phone,
                orderId,
                usedAt: new Date(),
              },
            },
          },
          { new: true }
        );
        if (!updated) {
          await saved.deleteOne();
          return fail(
            res,
            409,
            'This coupon was just used or is no longer available.'
          );
        }
      }
      if (d.paymentMethod === 'cod')
        await Product.bulkWrite(
          lines.map((x) => ({
            updateOne: {
              filter: {
                'variants.sku': x.sku,
                'variants.stock': { $gte: x.quantity },
              },
              update: { $inc: { 'variants.$.stock': -x.quantity } },
            },
          }))
        );
    }
    res
      .status(201)
      .json({
        order: {
          orderId,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          total,
          subtotal,
          discount,
          shippingFee,
          codAdvanceFee,
          codBalance: order.codBalance,
          items: order.items,
        },
      });
  } catch (e) {
    next(e);
  }
});
app.post('/api/orders/track', async (req, res, next) => {
  try {
    const phone = String(req.body?.phone || '').replace(/\s/g, '');
    let o = useMemory()
      ? store.orders.find(
          (x) =>
            x.orderId === req.body?.orderId &&
            x.customer.phone.replace(/\s/g, '') === phone
        )
      : await Order.findOne({
          orderId: req.body?.orderId,
          'customer.phone': phone,
        })
          .select(
            'orderId orderStatus paymentStatus paymentMethod shipment items total codBalance'
          )
          .lean();
    if (!o)
      return fail(res, 404, 'Order reference and phone number did not match.');
    res.json({
      order: {
        orderId: o.orderId,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        shipment: o.shipment,
        items: o.items,
        total: o.total,
        codBalance: o.codBalance,
      },
    });
  } catch (e) {
    next(e);
  }
});
app.get('/api/orders/track/:orderId', async (req, res, next) => {
  try {
    return fail(
      res,
      405,
      'Use the secure order lookup with your order reference and phone number.'
    );
  } catch (e) {
    next(e);
  }
});
app.post('/api/payments/cashfree/session', async (req, res, next) => {
  try {
    const { orderId } = req.body || {};
    let order = await Order.findOne({ orderId, paymentMethod: 'cashfree' });
    if (!order) return fail(res, 404, 'Pending online order was not found.');
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY)
      return fail(res, 503, 'Cashfree credentials are not configured.');
    let base =
      process.env.CASHFREE_ENV === 'production'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
    let response = await fetch(`${base}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': process.env.CASHFREE_API_VERSION || '2025-01-01',
        'x-idempotency-key': order.orderId,
      },
      body: JSON.stringify({
        order_id: order.orderId,
        order_amount: order.total,
        order_currency: 'INR',
        customer_details: {
          customer_id: order.customer.phone.replace(/\D/g, '').slice(-10),
          customer_name: order.customer.name,
          customer_email: order.customer.email || 'orders@example.com',
          customer_phone: order.customer.phone.replace(/\D/g, '').slice(-10),
        },
        order_meta: {
          return_url: `${process.env.PUBLIC_URL}/order-success/${order.orderId}`,
        },
      }),
    });
    let data = await response.json();
    if (!response.ok)
      return fail(
        res,
        502,
        data.message || 'Cashfree could not create a payment session.'
      );
    order.payment = {
      sessionId: data.payment_session_id,
      cfOrderId: data.cf_order_id,
    };
    await order.save();
    res.json({
      paymentSessionId: data.payment_session_id,
      environment: process.env.CASHFREE_ENV || 'sandbox',
    });
  } catch (e) {
    next(e);
  }
});
app.post('/api/payments/cashfree/webhook', async (req, res, next) => {
  try {
    let raw = req.rawBody?.toString() || '',
      signature = req.header('x-webhook-signature'),
      timestamp = req.header('x-webhook-timestamp');
    if (
      !process.env.CASHFREE_WEBHOOK_SECRET ||
      !signature ||
      !timestamp ||
      !raw
    )
      return fail(res, 401, 'Webhook signature is unavailable.');
    let expected = crypto
        .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET)
        .update(timestamp + raw)
        .digest('base64'),
      expectedBytes = Buffer.from(expected),
      receivedBytes = Buffer.from(signature);
    if (
      expectedBytes.length !== receivedBytes.length ||
      !crypto.timingSafeEqual(expectedBytes, receivedBytes)
    )
      return fail(res, 401, 'Invalid webhook signature.');
    let event = JSON.parse(raw),
      orderId = event.data?.order?.order_id || event.data?.order_id,
      cfOrderId = event.data?.order?.cf_order_id,
      order = await Order.findOne({ orderId });
    if (!order) return fail(res, 404, 'Order was not found.');
    let eventId = String(
      event.data?.payment?.cf_payment_id || event.type + timestamp
    );
    if (order.cashfreeWebhookIds.includes(eventId))
      return res.json({ ok: true, duplicate: true });
    if (
      event.type === 'PAYMENT_SUCCESS_WEBHOOK' &&
      event.data?.payment?.payment_status === 'SUCCESS'
    ) {
      let amount = Number(event.data.payment.payment_amount);
      if (amount !== order.total || event.data.order?.order_currency !== 'INR')
        return fail(
          res,
          400,
          'Payment amount or currency does not match this order.'
        );
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.payment = {
        ...(order.payment?.toObject?.() || {}),
        cfOrderId,
        referenceId: String(event.data.payment.cf_payment_id),
        verifiedAt: new Date(),
      };
      order.amountPaidOnline = order.total;
    } else if (event.type === 'PAYMENT_FAILED_WEBHOOK') {
      order.paymentStatus = 'failed';
    } else if (event.type === 'PAYMENT_USER_DROPPED_WEBHOOK') {
      order.paymentStatus = 'cancelled';
    }
    order.cashfreeWebhookIds.push(eventId);
    await order.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
function requireAdmin(req, res, next) {
  try {
    let token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (useMemory()) {
      if (!store.validToken(token))
        return fail(res, 401, 'Admin session expired.');
      req.admin = { id: 'local-admin', role: 'admin' };
      return next();
    }
    if (!token) return fail(res, 401, 'Sign in required.');
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return fail(res, 401, 'Admin session expired.');
  }
}
app.post('/api/admin/auth/login', authLimit, async (req, res) => {
  if (useMemory()) {
    let email = String(req.body?.email || '').toLowerCase(),
      token =
        email === store.adminEmail
          ? store.login(email, req.body?.password)
          : null;
    if (!token) return fail(res, 401, 'Email or password is incorrect.');
    return res.json({ token, name: 'Local Demo Admin', demo: true });
  }
  let admin = await Admin.findOne({
    email: String(req.body?.email || '').toLowerCase(),
    active: true,
  });
  if (
    !admin ||
    !(await bcrypt.compare(
      String(req.body?.password || ''),
      admin.passwordHash
    ))
  )
    return fail(res, 401, 'Email or password is incorrect.');
  admin.lastLoginAt = new Date();
  await admin.save();
  res.json({
    token: jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    ),
    name: admin.name,
  });
});
app.get('/api/admin/overview', requireAdmin, async (req, res, next) => {
  try {
    if (useMemory())
      return res.json({
        orders: store.orders.length,
        pending: store.orders.filter((x) => x.paymentStatus === 'pending')
          .length,
        paidRevenue: store.orders
          .filter((x) => x.paymentStatus === 'paid')
          .reduce((s, x) => s + x.amountPaidOnline, 0),
        lowStock: store.products
          .filter((x) => x.isPublished)
          .flatMap((x) => x.variants)
          .filter((x) => x.stock <= 5).length,
        codDue: store.orders.reduce((s, x) => s + x.codBalance, 0),
      });
    let [orders, pending, paid, lowStock, cod] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaidOnline' } } },
      ]),
      Product.countDocuments({
        'variants.stock': { $lte: 5 },
        isPublished: true,
      }),
      Order.aggregate([
        { $match: { paymentMethod: 'cod' } },
        { $group: { _id: null, total: { $sum: '$codBalance' } } },
      ]),
    ]);
    res.json({
      orders,
      pending,
      paidRevenue: paid[0]?.total || 0,
      lowStock,
      codDue: cod[0]?.total || 0,
    });
  } catch (e) {
    next(e);
  }
});
app.get('/api/admin/orders', requireAdmin, async (req, res, next) => {
  try {
    let page = Math.max(1, Number(req.query.page) || 1),
      limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20)),
      q = String(req.query.q || '').slice(0, 100);
    if (useMemory()) {
      let rows = store.orders
        .filter(
          (x) => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase())
        )
        .sort((a, b) => b.createdAt - a.createdAt);
      return res.json({
        orders: rows.slice((page - 1) * limit, page * limit),
        total: rows.length,
        page,
        limit,
      });
    }
    let filter = q
      ? {
          $or: [
            { orderId: new RegExp(q, 'i') },
            { 'customer.name': new RegExp(q, 'i') },
            { 'customer.phone': new RegExp(q, 'i') },
            { 'customer.email': new RegExp(q, 'i') },
          ],
        }
      : {};
    let [rows, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    res.json({ orders: rows, total, page, limit });
  } catch (e) {
    next(e);
  }
});
app.patch(
  '/api/admin/orders/:orderId/shipment',
  requireAdmin,
  async (req, res, next) => {
    try {
      let schema = z.object({
        provider: z.string().max(80).optional(),
        trackingNumber: z.string().max(100).optional(),
        trackingUrl: z.string().url().optional().or(z.literal('')),
        status: z.string().max(80).optional(),
      });
      let parsed = schema.safeParse(req.body);
      if (!parsed.success) return fail(res, 400, 'Invalid shipment details.');
      if (useMemory()) {
        let o = store.orders.find((x) => x.orderId === req.params.orderId);
        if (!o) return fail(res, 404, 'Order not found.');
        o.shipment = { ...o.shipment, ...parsed.data };
        return res.json({ order: o });
      }
      let o = await Order.findOneAndUpdate(
        { orderId: req.params.orderId },
        { $set: { shipment: parsed.data } },
        { new: true }
      );
      if (!o) return fail(res, 404, 'Order not found.');
      res.json({ order: o });
    } catch (e) {
      next(e);
    }
  }
);
app.patch(
  '/api/admin/orders/:orderId/status',
  requireAdmin,
  async (req, res, next) => {
    let status = z
      .enum([
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ])
      .safeParse(req.body?.orderStatus);
    if (!status.success) return fail(res, 400, 'Invalid order status.');
    if (useMemory()) {
      let o = store.orders.find((x) => x.orderId === req.params.orderId);
      if (!o) return fail(res, 404, 'Order not found.');
      o.orderStatus = status.data;
      return res.json({ order: o });
    }
    let o = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { $set: { orderStatus: status.data } },
      { new: true }
    );
    if (!o) return fail(res, 404, 'Order not found.');
    res.json({ order: o });
  }
);
app.get('/api/admin/products', requireAdmin, async (req, res, next) => {
  try {
    const rows = useMemory() ? store.products : await Product.find().lean();
    res.json({ products: rows.map(({ passwordHash, ...product }) => product) });
  } catch (e) {
    next(e);
  }
});
app.patch('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    let allowed = z
      .object({
        isPublished: z.boolean().optional(),
        featured: z.boolean().optional(),
        shortDescription: z.string().max(400).optional(),
        variants: z
          .array(
            z.object({
              label: z.string(),
              sku: z.string(),
              mrp: z.number().int().min(0),
              sellingPrice: z.number().int().min(0),
              stock: z.number().int().min(0),
              isActive: z.boolean(),
            })
          )
          .max(20)
          .optional(),
      })
      .safeParse(req.body);
    if (!allowed.success) return fail(res, 400, 'Invalid product changes.');
    if (useMemory()) {
      let p = store.products.find(
        (x) => x._id === req.params.id || x.slug === req.params.id
      );
      if (!p) return fail(res, 404, 'Product not found.');
      Object.assign(p, allowed.data);
      return res.json({ product: p });
    }
    let p = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: allowed.data },
      { new: true, runValidators: true }
    );
    if (!p) return fail(res, 404, 'Product not found.');
    res.json({ product: p });
  } catch (e) {
    next(e);
  }
});
app.post('/api/admin/coupons', requireAdmin, async (req, res, next) => {
  try {
    let s = z
      .object({
        customerName: z.string().trim().min(2).max(70),
        discountType: z.enum(['fixed', 'percentage']),
        discountValue: z.number().int().min(1).max(100000),
        maxDiscount: z.number().int().min(1).optional(),
        minimumCartValue: z.number().int().min(0).default(0),
        eligibleSkus: z.array(z.string()).default([]),
        waiveCodAdvance: z.boolean().default(false),
        startsAt: z.string().datetime(),
        expiresAt: z.string().datetime(),
        usageLimit: z.number().int().min(1),
        perCustomerLimit: z.number().int().min(1),
      })
      .safeParse(req.body);
    if (!s.success) return fail(res, 400, s.error.issues[0].message);
    let d = s.data;
    if (new Date(d.expiresAt) <= new Date(d.startsAt))
      return fail(res, 400, 'Expiry must be after the start date.');
    let base =
        d.customerName
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 14) || 'GUEST',
      code;
    for (let i = 0; i < 10; i++) {
      code = `${base}${d.discountType === 'fixed' ? d.discountValue : `${d.discountValue}P`}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      if (
        useMemory()
          ? !store.coupons.some((x) => x.code === code)
          : !(await Coupon.exists({ code }))
      )
        break;
    }
    let coupon = {
      ...d,
      code,
      startsAt: new Date(d.startsAt),
      expiresAt: new Date(d.expiresAt),
      active: true,
      usedCount: 0,
      redemptions: [],
      createdBy: req.admin.id,
      _id: crypto.randomUUID(),
    };
    if (useMemory()) store.coupons.push(coupon);
    else coupon = await Coupon.create({ ...coupon, createdBy: req.admin.id });
    res.status(201).json({ coupon });
  } catch (e) {
    next(e);
  }
});
app.get('/api/admin/coupons', requireAdmin, async (req, res, next) => {
  try {
    let rows = useMemory()
      ? store.coupons.map(({ redemptions, ...c }) => ({
          ...c,
          redemptions: redemptions.length,
        }))
      : await Coupon.find()
          .select('-redemptions.phone')
          .sort({ createdAt: -1 })
          .lean();
    res.json({ coupons: rows });
  } catch (e) {
    next(e);
  }
});
app.patch('/api/admin/coupons/:id', requireAdmin, async (req, res, next) => {
  try {
    if (useMemory()) {
      let c = store.coupons.find(
        (x) => x._id === req.params.id || x.code === req.params.id
      );
      if (!c) return fail(res, 404, 'Coupon not found.');
      c.active = Boolean(req.body?.active);
      return res.json({ coupon: c });
    }
    let c = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: { active: Boolean(req.body?.active) } },
      { new: true }
    ).select('-redemptions.phone');
    if (!c) return fail(res, 404, 'Coupon not found.');
    res.json({ coupon: c });
  } catch (e) {
    next(e);
  }
});
app.get('/api/admin/settings', requireAdmin, async (req, res, next) => {
  try {
    res.json({
      settings: useMemory()
        ? Object.entries(store.settings).map(([key, value]) => ({ key, value }))
        : await Setting.find().lean(),
    });
  } catch (e) {
    next(e);
  }
});
app.put('/api/admin/settings/:key', requireAdmin, async (req, res, next) => {
  try {
    if (!['shipping', 'brand', 'faq', 'policies'].includes(req.params.key))
      return fail(res, 400, 'Unknown setting.');
    if (useMemory()) {
      store.settings[req.params.key] = req.body;
      return res.json({ setting: { key: req.params.key, value: req.body } });
    }
    let row = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ setting: row });
  } catch (e) {
    next(e);
  }
});
app.post('/api/contact', async (req, res) => {
  const s = z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().email(),
      message: z.string().trim().min(5).max(2000),
    })
    .safeParse(req.body);
  if (!s.success)
    return fail(res, 400, 'Please check the contact form fields.');
  if (useMemory()) store.enquiries.push({ ...s.data, createdAt: new Date() });
  res
    .status(202)
    .json({
      message: useMemory()
        ? 'Enquiry saved in this local demo.'
        : 'Enquiry received. Email delivery is not configured.',
    });
});
app.get('/api/admin/enquiries', requireAdmin, async (req, res) =>
  res.json({ enquiries: useMemory() ? store.enquiries : [] })
);
app.get('/api/admin/activity', requireAdmin, async (req, res) =>
  res.json({ activity: [] })
);
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({
      message:
        process.env.NODE_ENV === 'production'
          ? 'Something went wrong.'
          : err.message || 'Internal server error.',
    });
});
export default app;

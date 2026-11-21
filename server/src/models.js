import mongoose from 'mongoose';
const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    mrp: { type: Number, min: 0, required: true },
    sellingPrice: { type: Number, min: 0, required: true },
    stock: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);
export const Product = mongoose.model(
  'Product',
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      slug: { type: String, unique: true, required: true },
      brand: { type: String, default: 'Biosash' },
      category: {
        type: String,
        enum: ['Juice', 'Capsules', 'Oils'],
        required: true,
      },
      shortDescription: String,
      descriptionSections: [mongoose.Schema.Types.Mixed],
      images: [String],
      video: String,
      variants: [variantSchema],
      isPublished: { type: Boolean, default: false },
      featured: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);
export const Coupon = mongoose.model(
  'Coupon',
  new mongoose.Schema(
    {
      code: { type: String, unique: true, index: true, required: true },
      customerName: { type: String, required: true },
      discountType: {
        type: String,
        enum: ['fixed', 'percentage'],
        required: true,
      },
      discountValue: { type: Number, required: true, min: 1 },
      maxDiscount: { type: Number, default: null },
      minimumCartValue: { type: Number, default: 0 },
      eligibleSkus: [String],
      waiveCodAdvance: { type: Boolean, default: false },
      startsAt: { type: Date, required: true },
      expiresAt: { type: Date, required: true },
      usageLimit: { type: Number, default: 1 },
      perCustomerLimit: { type: Number, default: 1 },
      usedCount: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
      redemptions: [{ phone: String, orderId: String, usedAt: Date }],
    },
    { timestamps: true }
  )
);
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', counterSchema);
export async function nextOrderId() {
  let c = await Counter.findOneAndUpdate(
    { _id: 'order' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `SBH-${new Date().getFullYear()}-${String(c.seq).padStart(6, '0')}`;
}
export const Order = mongoose.model(
  'Order',
  new mongoose.Schema(
    {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        index: true,
      },
      orderId: { type: String, unique: true, index: true },
      customer: { name: String, phone: String, email: String },
      shippingAddress: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
      },
      items: [
        {
          productId: mongoose.Schema.Types.ObjectId,
          title: String,
          variant: String,
          sku: String,
          quantity: Number,
          unitPrice: Number,
          mrp: Number,
        },
      ],
      subtotal: Number,
      discount: Number,
      shippingFee: Number,
      codAdvanceFee: Number,
      total: Number,
      amountPaidOnline: Number,
      codBalance: Number,
      coupon: {
        code: String,
        customerName: String,
        discountType: String,
        discountValue: Number,
        amount: Number,
        waiveCodAdvance: Boolean,
      },
      paymentMethod: { type: String, enum: ['cod', 'cashfree'] },
      paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
        default: 'pending',
      },
      payment: {
        sessionId: String,
        cfOrderId: String,
        referenceId: String,
        verifiedAt: Date,
      },
      orderStatus: {
        type: String,
        enum: [
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
        ],
        default: 'pending',
      },
      shipment: {
        provider: String,
        trackingNumber: String,
        trackingUrl: String,
        status: String,
        dispatchDate: Date,
        deliveryDate: Date,
      },
      cashfreeWebhookIds: [String],
      adminNotes: String,
    },
    { timestamps: true }
  )
);
export const Admin = mongoose.model(
  'Admin',
  new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true, lowercase: true },
      passwordHash: String,
      role: { type: String, default: 'admin' },
      active: { type: Boolean, default: true },
      lastLoginAt: Date,
    },
    { timestamps: true }
  )
);
export const Customer = mongoose.model(
  'Customer',
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      phone: { type: String, required: true, trim: true },
      passwordHash: { type: String, required: true },
      active: { type: Boolean, default: true },
      emailVerifiedAt: Date,
    },
    { timestamps: true }
  )
);
export const Setting = mongoose.model(
  'Setting',
  new mongoose.Schema(
    { key: { type: String, unique: true }, value: mongoose.Schema.Types.Mixed },
    { timestamps: true }
  )
);

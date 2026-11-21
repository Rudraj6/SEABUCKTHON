import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { money } from '../data.js';

export default function AdminPage() {
  const [token, setToken] = useState(
      localStorage.getItem('sbh-admin-token') || ''
    ),
    [tab, setTab] = useState('Overview'),
    [error, setError] = useState(''),
    [data, setData] = useState({}),
    [refresh, setRefresh] = useState(0);
  async function api(path, options = {}) {
    let r = await fetch(`/api/admin/${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      }),
      j = await r.json();
    if (!r.ok) throw Error(j.message || 'Admin request failed.');
    return j;
  }
  useEffect(() => {
    if (!token) return;
    let path =
      tab === 'Overview'
        ? 'overview'
        : tab === 'Products'
          ? 'products'
          : tab === 'Orders'
            ? 'orders?limit=50'
            : tab === 'Coupons'
              ? 'coupons'
              : tab === 'Settings'
                ? 'settings'
                : tab === 'Enquiries'
                  ? 'enquiries'
                  : 'activity';
    api(path)
      .then(setData)
      .catch((e) => {
        setError(e.message);
        if (e.message.includes('session')) {
          setToken('');
          localStorage.removeItem('sbh-admin-token');
        }
      });
  }, [token, tab, refresh]);
  async function login(e) {
    e.preventDefault();
    let f = new FormData(e.currentTarget);
    try {
      let r = await fetch('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: f.get('email'),
            password: f.get('password'),
          }),
        }),
        j = await r.json();
      if (!r.ok) throw Error(j.message);
      localStorage.setItem('sbh-admin-token', j.token);
      setToken(j.token);
      setError('');
    } catch (x) {
      setError(x.message);
    }
  }
  if (!token)
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand" to="/">
          <span className="brand-mark">
            S<span>✳</span>
          </span>
          <span>
            <b>SBH ADMIN</b>
            <small>LOCAL STOREFRONT</small>
          </span>
        </Link>
        <nav>
          {[
            'Overview',
            'Products',
            'Orders',
            'Coupons',
            'Settings',
            'Enquiries',
            'Activity',
          ].map((x) => (
            <button
              className={tab === x ? 'active' : ''}
              onClick={() => {
                setTab(x);
                setError('');
              }}
              key={x}
            >
              {x}
            </button>
          ))}
        </nav>
        <button
          className="admin-logout"
          onClick={() => {
            localStorage.removeItem('sbh-admin-token');
            setToken('');
          }}
        >
          Sign out
        </button>
      </aside>
      <section className="admin-content">
        <header>
          <div>
            <span className="eyebrow">STORE ADMINISTRATION</span>
            <h1>{tab}</h1>
          </div>
          <button
            className="button button-light"
            onClick={() => setRefresh((x) => x + 1)}
          >
            Refresh <ArrowRight size={15} />
          </button>
        </header>
        {error && <div className="form-error">{error}</div>}
        {tab === 'Overview' && (
          <div className="admin-metrics">
            {[
              ['Orders', data.orders || 0],
              ['Pending', data.pending || 0],
              ['Paid revenue', money(data.paidRevenue || 0)],
              ['COD due', money(data.codDue || 0)],
              ['Low stock', data.lowStock || 0],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
        )}
        {tab === 'Products' && (
          <div className="admin-table">
            {(data.products || []).map((p) => (
              <article key={p._id}>
                <div>
                  <b>{p.name}</b>
                  <small>
                    {p.slug} · {p.brand}
                  </small>
                  <small>
                    {p.variants
                      .map(
                        (v) =>
                          `${v.label}: ${money(v.sellingPrice)} · ${v.stock} in stock`
                      )
                      .join(' / ')}
                  </small>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={p.isPublished}
                    onChange={async (e) => {
                      await api(`products/${p._id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ isPublished: e.target.checked }),
                      });
                      setRefresh((x) => x + 1);
                    }}
                  />{' '}
                  Published
                </label>
              </article>
            ))}
          </div>
        )}
        {tab === 'Orders' && (
          <div className="admin-table">
            {(data.orders || []).map((o) => (
              <article key={o.orderId}>
                <div>
                  <b>
                    {o.orderId} · {o.customer?.name}
                  </b>
                  <small>
                    {o.customer?.phone} · {o.customer?.email || 'No email'} ·{' '}
                    {o.items
                      ?.map((i) => `${i.title} ${i.variant} × ${i.quantity}`)
                      .join(', ')}
                  </small>
                  <small>
                    {o.shippingAddress?.line1}
                    {o.shippingAddress?.line2
                      ? `, ${o.shippingAddress.line2}`
                      : ''}
                    , {o.shippingAddress?.city}, {o.shippingAddress?.state}{' '}
                    {o.shippingAddress?.pincode} · {money(o.total)} ·{' '}
                    {o.paymentStatus}
                  </small>
                  <small>
                    Tracking: {o.shipment?.provider || '—'}{' '}
                    {o.shipment?.trackingNumber || ''} ·{' '}
                    {o.shipment?.status || 'not shipped'}
                  </small>
                </div>
                <div className="admin-actions">
                  <select
                    value={o.orderStatus}
                    onChange={async (e) => {
                      await api(`orders/${o.orderId}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({ orderStatus: e.target.value }),
                      });
                      setRefresh((x) => x + 1);
                    }}
                  >
                    {[
                      'pending',
                      'confirmed',
                      'processing',
                      'shipped',
                      'delivered',
                      'cancelled',
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      let provider = prompt(
                        'Courier/provider name',
                        o.shipment?.provider || ''
                      );
                      if (provider === null) return;
                      let trackingNumber = prompt(
                        'Tracking/AWB number',
                        o.shipment?.trackingNumber || ''
                      );
                      let trackingUrl = prompt(
                        'Tracking URL',
                        o.shipment?.trackingUrl || ''
                      );
                      await api(`orders/${o.orderId}/shipment`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          provider,
                          trackingNumber,
                          trackingUrl,
                          status: 'In transit',
                        }),
                      });
                      setRefresh((x) => x + 1);
                    }}
                  >
                    Add tracking
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {tab === 'Coupons' && (
          <>
            <form
              className="coupon-create"
              onSubmit={async (e) => {
                e.preventDefault();
                let f = new FormData(e.currentTarget);
                try {
                  await api('coupons', {
                    method: 'POST',
                    body: JSON.stringify({
                      customerName: f.get('customerName'),
                      discountType: f.get('discountType'),
                      discountValue: Number(f.get('discountValue')),
                      minimumCartValue: Number(f.get('minimumCartValue') || 0),
                      waiveCodAdvance: f.get('waiveCodAdvance') === 'on',
                      startsAt: new Date(f.get('startsAt')).toISOString(),
                      expiresAt: new Date(f.get('expiresAt')).toISOString(),
                      usageLimit: Number(f.get('usageLimit')),
                      perCustomerLimit: Number(f.get('perCustomerLimit')),
                      eligibleSkus: [],
                    }),
                  });
                  e.currentTarget.reset();
                  setRefresh((x) => x + 1);
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              <h3>Create a personalised coupon</h3>
              <label>
                Customer name
                <input name="customerName" required />
              </label>
              <label>
                Discount
                <select name="discountType">
                  <option value="fixed">Fixed ₹</option>
                  <option value="percentage">Percent</option>
                </select>
              </label>
              <label>
                Value
                <input name="discountValue" type="number" min="1" required />
              </label>
              <label>
                Minimum cart ₹
                <input
                  name="minimumCartValue"
                  type="number"
                  min="0"
                  defaultValue="0"
                />
              </label>
              <label>
                Starts
                <input name="startsAt" type="datetime-local" required />
              </label>
              <label>
                Expires
                <input name="expiresAt" type="datetime-local" required />
              </label>
              <label>
                Total uses
                <input
                  name="usageLimit"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </label>
              <label>
                Uses per customer
                <input
                  name="perCustomerLimit"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </label>
              <label className="check-label">
                <input type="checkbox" name="waiveCodAdvance" /> Waive COD
                advance
              </label>
              <button className="button button-orange">Generate code</button>
            </form>
            <div className="admin-table">
              {(data.coupons || []).map((c) => (
                <article key={c.code}>
                  <div>
                    <b>
                      {c.code} · {c.customerName}
                    </b>
                    <small>
                      {c.discountType === 'fixed'
                        ? money(c.discountValue)
                        : `${c.discountValue}%`}{' '}
                      off · {c.usedCount}/{c.usageLimit} uses ·{' '}
                      {c.active ? 'Active' : 'Disabled'}
                    </small>
                  </div>
                  <button
                    onClick={async () => {
                      await navigator.clipboard?.writeText(
                        `${c.customerName}, enjoy ${c.discountType === 'fixed' ? money(c.discountValue) : `${c.discountValue}% off`} with ${c.code}`
                      );
                      alert('Coupon offer copied.');
                    }}
                  >
                    Copy share text
                  </button>
                  <button
                    onClick={async () => {
                      await api(`coupons/${c._id || c.code}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ active: !c.active }),
                      });
                      setRefresh((x) => x + 1);
                    }}
                  >
                    {c.active ? 'Disable' : 'Enable'}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === 'Settings' && (
          <form
            className="checkout-form settings-form"
            onSubmit={async (e) => {
              e.preventDefault();
              let f = new FormData(e.currentTarget);
              try {
                await api('settings/shipping', {
                  method: 'PUT',
                  body: JSON.stringify({
                    standardFee: Number(f.get('standardFee')),
                    freeShippingThreshold: f.get('freeShippingThreshold')
                      ? Number(f.get('freeShippingThreshold'))
                      : null,
                    codAdvanceFee: Number(f.get('codAdvanceFee')),
                    codEnabled: f.get('codEnabled') === 'on',
                  }),
                });
                await api('settings/brand', {
                  method: 'PUT',
                  body: JSON.stringify({
                    announcement: f.get('announcement'),
                    supportPhone: f.get('supportPhone'),
                    supportEmail: f.get('supportEmail'),
                    whatsapp: f.get('whatsapp'),
                  }),
                });
                setError('Settings saved.');
              } catch (x) {
                setError(x.message);
              }
            }}
          >
            <h2>Shipping & payment settings</h2>
            <label>
              Standard shipping fee ₹
              <input
                name="standardFee"
                type="number"
                min="0"
                defaultValue={
                  data.settings?.find((x) => x.key === 'shipping')?.value
                    ?.standardFee ?? 0
                }
              />
            </label>
            <label>
              Free shipping threshold ₹
              <input
                name="freeShippingThreshold"
                type="number"
                min="0"
                defaultValue={
                  data.settings?.find((x) => x.key === 'shipping')?.value
                    ?.freeShippingThreshold || ''
                }
              />
            </label>
            <label>
              COD advance ₹
              <input
                name="codAdvanceFee"
                type="number"
                min="0"
                defaultValue={
                  data.settings?.find((x) => x.key === 'shipping')?.value
                    ?.codAdvanceFee ?? 0
                }
              />
            </label>
            <label className="check-label">
              <input
                name="codEnabled"
                type="checkbox"
                defaultChecked={
                  data.settings?.find((x) => x.key === 'shipping')?.value
                    ?.codEnabled ?? true
                }
              />{' '}
              Enable local demo COD
            </label>
            <h2>Brand & support CMS</h2>
            <label>
              Announcement
              <input
                name="announcement"
                defaultValue={
                  data.settings?.find((x) => x.key === 'brand')?.value
                    ?.announcement ||
                  'A little Himalayan sunshine, thoughtfully brought to you'
                }
              />
            </label>
            <label>
              Support phone
              <input name="supportPhone" />
            </label>
            <label>
              Support email
              <input name="supportEmail" type="email" />
            </label>
            <label>
              WhatsApp number
              <input name="whatsapp" />
            </label>
            <button className="button button-orange">Save settings</button>
          </form>
        )}
        {tab === 'Enquiries' && (
          <div className="admin-table">
            {(data.enquiries || []).map((x, i) => (
              <article key={i}>
                <div>
                  <b>
                    {x.name} · {x.email}
                  </b>
                  <small>{x.message}</small>
                  <small>{new Date(x.createdAt).toLocaleString()}</small>
                </div>
              </article>
            ))}
            {!data.enquiries?.length && <p>No enquiries yet.</p>}
          </div>
        )}
        {tab === 'Activity' && (
          <div className="pending-box">
            Sensitive admin activity logging is reserved for the persistent
            database configuration.
          </div>
        )}
      </section>
    </main>
  );
}

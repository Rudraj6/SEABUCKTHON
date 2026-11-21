import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, PackageCheck, UserRound } from 'lucide-react';
import { money } from '../data.js';
import { useAuth } from '../context/AuthContext.jsx';

async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const body = await response.text();
    throw new Error(
      body.includes('Vite') || body.includes('<!DOCTYPE')
        ? 'The account API is not connected to this page. Start the project with npm run dev and open the URL it prints.'
        : 'The account service returned an unexpected response. Please try again.'
    );
  }
  return response.json();
}

function CustomerForm({ mode, onModeChange, onSignedIn }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const endpoint = mode === 'register' ? 'register' : 'login';
    try {
      const response = await fetch(`/api/auth/customer/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result = await readApiResponse(response);
      if (!response.ok)
        throw new Error(result.message || 'We could not sign you in.');
      onSignedIn(result);
    } catch (requestError) {
      setError(
        requestError.message === 'Failed to fetch'
          ? 'The account service is unavailable.'
          : requestError.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className="account-switch"
        role="tablist"
        aria-label="Customer account options"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => {
            onModeChange('login');
            setError('');
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          onClick={() => {
            onModeChange('register');
            setError('');
          }}
        >
          Create account
        </button>
      </div>
      <form className="checkout-form account-form" onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Full name
            <input name="name" autoComplete="name" minLength="2" required />
          </label>
        )}
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required />
        </label>
        {mode === 'register' && (
          <label>
            Mobile number
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              pattern="[+]?[0-9 ]{10,15}"
              placeholder="+91"
              required
            />
          </label>
        )}
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              mode === 'register' ? 'new-password' : 'current-password'
            }
            minLength={mode === 'register' ? 10 : 1}
            required
          />
          {mode === 'register' && <small>Use at least 10 characters.</small>}
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <button
          className="button button-orange full"
          type="submit"
          disabled={busy}
        >
          {busy
            ? 'Please wait…'
            : mode === 'register'
              ? 'Create my account'
              : 'Sign in'}{' '}
          <ArrowRight size={16} />
        </button>
        <p className="account-privacy-note">
          Your account shows orders placed while signed in. Guest orders are
          available through the separate order tracker.
        </p>
      </form>
    </>
  );
}

function CustomerOrders({ token }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetch('/api/account/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) =>
        response.ok
          ? response.json()
          : response
              .json()
              .then((data) => Promise.reject(new Error(data.message)))
      )
      .then((data) => {
        if (live) setOrders(data.orders || []);
      })
      .catch((requestError) => {
        if (live) setError(requestError.message || 'Could not load orders.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token]);

  if (loading) return <div className="account-empty">Loading your orders…</div>;
  if (error) return <div className="form-error">{error}</div>;
  if (!orders.length)
    return (
      <div className="account-empty">
        <PackageCheck size={24} />
        <b>No account orders yet</b>
        <span>Orders placed while you are signed in will appear here.</span>
        <Link className="text-link" to="/shop">
          Browse products <ArrowRight size={15} />
        </Link>
      </div>
    );

  return (
    <div className="customer-orders">
      {orders.map((order) => (
        <article className="customer-order" key={order.orderId}>
          <header>
            <div>
              <span>ORDER REFERENCE</span>
              <b>{order.orderId}</b>
            </div>
            <div>
              <span>PLACED</span>
              <b>{new Date(order.createdAt).toLocaleDateString('en-IN')}</b>
            </div>
            <div className="order-status">
              <span>STATUS</span>
              <b>{order.orderStatus}</b>
            </div>
          </header>
          <div className="customer-order-lines">
            {(order.items || []).map((item, index) => (
              <div key={`${order.orderId}-${item.sku || index}`}>
                <span>
                  {item.title} · {item.variant} × {item.quantity}
                </span>
                <b>{money(item.unitPrice * item.quantity)}</b>
              </div>
            ))}
          </div>
          <footer>
            <span>
              {order.paymentMethod === 'cod'
                ? 'Cash on delivery'
                : 'Online payment'}{' '}
              · {order.paymentStatus}
            </span>
            <b>Total {money(order.total)}</b>
          </footer>
          {order.shipment?.trackingUrl && (
            <a
              className="text-link"
              href={order.shipment.trackingUrl}
              target="_blank"
              rel="noreferrer"
            >
              Track shipment <ArrowRight size={14} />
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

export default function AccountPage() {
  const { token, customer, isLoading, saveSession, signOut } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode || 'login');
  const navigate = useNavigate();

  function onSignedIn(session) {
    saveSession(session.token, session.customer);
    if (location.state?.from) navigate(location.state.from, { replace: true });
  }

  if (token && isLoading)
    return (
      <main className="page-shell account-page">
        <div className="account-empty">Loading your account…</div>
      </main>
    );
  if (!customer && mode !== 'register')
    return (
      <Navigate
        to="/login"
        replace
        state={location.state?.from ? { from: location.state.from } : undefined}
      />
    );

  return (
    <main className="page-shell account-page">
      <div className="page-head">
        <span className="eyebrow">YOUR SEABUCKTHORN BHARAT ACCOUNT</span>
        <h1>
          {customer ? (
            <>
              Welcome, <em>{customer.name.split(' ')[0]}.</em>
            </>
          ) : (
            <>
              Your account, <em>made simple.</em>
            </>
          )}
        </h1>
        <p>Sign in to keep track of purchases and order updates.</p>
      </div>
      {!customer ? (
        <section className="account-card">
          <div className="account-card-heading">
            <span className="account-icon">
              <UserRound size={21} />
            </span>
            <div>
              <h2>Customer account</h2>
              <p>
                Use your email and password to sign in or create an account.
              </p>
            </div>
          </div>
          <CustomerForm
            mode={mode}
            onModeChange={setMode}
            onSignedIn={onSignedIn}
          />
        </section>
      ) : (
        <>
          <section className="account-profile">
            <div>
              <span className="eyebrow">ACCOUNT DETAILS</span>
              <b>{customer.name}</b>
              <span>{customer.email}</span>
              <span>{customer.phone}</span>
            </div>
            <button
              className="button button-light"
              onClick={() => {
                signOut();
                navigate('/account');
              }}
            >
              Sign out
            </button>
          </section>
          <section className="account-orders-section">
            <div className="section-top">
              <div>
                <span className="eyebrow">ORDER HISTORY</span>
                <h2>
                  Your orders, <em>in one place.</em>
                </h2>
              </div>
              <Link to="/track-order" className="text-link">
                Track a guest order <ArrowRight size={15} />
              </Link>
            </div>
            <CustomerOrders token={token} />
          </section>
        </>
      )}
    </main>
  );
}

export function LoginChoice() {
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result = await readApiResponse(response);
      if (!response.ok)
        throw new Error(result.message || 'Email or password is incorrect.');
      if (result.role === 'admin') {
        localStorage.removeItem('sbh-customer-token');
        localStorage.removeItem('sbh-customer');
        localStorage.removeItem('sbh-admin-token');
        localStorage.setItem('sbh-admin-token', result.token);
        navigate('/admin', { replace: true });
      } else {
        localStorage.removeItem('sbh-admin-token');
        saveSession(result.token, result.customer);
        navigate(location.state?.from || '/account', { replace: true });
      }
    } catch (requestError) {
      setError(
        requestError.message === 'Failed to fetch'
          ? 'The account service is unavailable.'
          : requestError.message
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page-shell login-choice-page">
      <div className="page-head">
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h1>
          Welcome <em>back.</em>
        </h1>
        <p>Sign in to continue to checkout or view your account.</p>
      </div>
      <section className="account-card">
        <div className="account-card-heading">
          <span className="account-icon">
            <UserRound size={21} />
          </span>
          <div>
            <h2>Sign in</h2>
            <p>Use your registered email address and password.</p>
          </div>
        </div>
        <form className="checkout-form account-form" onSubmit={submit}>
          <label>
            Email address
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button
            className="button button-orange full"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Please wait…' : 'Sign in'} <ArrowRight size={16} />
          </button>
          <p className="account-privacy-note">
            New customer?{' '}
            <Link
              to="/account"
              state={{ mode: 'register', from: location.state?.from }}
            >
              Create your customer account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

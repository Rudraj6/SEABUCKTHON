import React, { useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Leaf,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { products, money } from './data.js';
import { HomeHero, MovingProductStrip } from './components/HomeHero.jsx';
import AccountPage, { LoginChoice } from './components/AccountPage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { WHATSAPP_ORDER_URL, WHATSAPP_DISPLAY_NUMBER } from './config/site.js';
import { CartProvider, useCart } from './context/CartContext.jsx';
import ProductGallery from './components/ProductGallery.jsx';
import AdminPage from './components/AdminPage.jsx';
import { buildProductGallery } from './data/productMedia.js';
import ProductArt from './components/ProductArt.jsx';
import ProductCard from './components/ProductCard.jsx';
import ProcessJourney from './components/ProcessJourney.jsx';
import useCatalogue from './hooks/useCatalogue.js';

const primaryLinks = [
  ['Home', '/'],
  ['Shop', '/shop'],
  ['Why sea buckthorn', '/why-sea-buckthorn'],
  ['Our story', '/about'],
  ['Contact', '/contact'],
  ['Account', '/login'],
];
function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  return (
    <>
      <div className="announce">
        A little Himalayan sunshine, thoughtfully brought to you <span>✳</span>
      </div>
      <header className="header">
        <Link className="brand" to="/" aria-label="SEABUCKTHORN BHARAT home">
          <img
            className="brand-logo"
            src="/brand/seabuckthorn-bharat-logo.png"
            alt="SEABUCKTHORN BHARAT, powered by Biosash"
          />
          <span className="brand-words">
            <b>SEABUCKTHORN</b>
            <small>BHARAT · POWERED BY BIOSASH</small>
          </span>
        </Link>
        <nav className={open ? 'nav nav-open' : 'nav'}>
          {primaryLinks.map(([label, url]) => (
            <Link key={url} onClick={closeMenu} to={url}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            className="icon-link cart-link"
            to="/cart"
            aria-label={`Cart with ${count} items`}
          >
            <ShoppingBag size={20} />
            <span>Bag</span>
            <i>{count}</i>
          </Link>
          <button
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand-column">
          <Link className="brand brand-footer" to="/">
            <img
              className="brand-logo"
              src="/brand/seabuckthorn-bharat-logo.png"
              alt=""
            />
            <span className="brand-words">
              <b>SEABUCKTHORN</b>
              <small>BHARAT · POWERED BY BIOSASH</small>
            </span>
          </Link>
          <p>
            The goodness of the Himalayan berry,
            <br />
            thoughtfully brought to you.
          </p>
          <a
            className="whatsapp-order"
            href={WHATSAPP_ORDER_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={`Order on WhatsApp at ${WHATSAPP_DISPLAY_NUMBER}`}
          >
            <span className="whatsapp-glyph">
              <img src="/whatsapp.png" alt="" aria-hidden="true" />
            </span>
            <span>
              <b>Order or ask us on WhatsApp</b>
              <small>
                Product questions · order support
                <br />
                +91 {WHATSAPP_DISPLAY_NUMBER}
              </small>
            </span>
            <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="footer-links">
          <b>Explore</b>
          <Link to="/shop">Shop all</Link>
          <Link to="/why-sea-buckthorn">Why sea buckthorn</Link>
          <Link to="/about">Our story</Link>
        </div>
        <div className="footer-links">
          <b>Help</b>
          <Link to="/faq">FAQs</Link>
          <Link to="/track-order">Track an order</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/account">My account</Link>
        </div>
        <div className="footer-links">
          <b>Information</b>
          <Link to="/shipping-policy">Shipping policy</Link>
          <Link to="/cancellation-returns">Returns</Link>
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/terms-and-conditions">Terms</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 SEABUCKTHORN BHARAT</span>
        <span>
          Product brand: Biosash · Store content subject to founder review
        </span>
      </div>
    </footer>
  );
}
function Layout({ children }) {
  const { count, subtotal } = useCart();
  return (
    <>
      <Header />
      {children}
      {count > 0 && (
        <div className="cart-dock">
          <span>
            {count} {count === 1 ? 'item' : 'items'} · <b>{money(subtotal)}</b>
          </span>
          <Link to="/cart">
            View bag <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <Footer />
    </>
  );
}
function Home() {
  const catalog = useCatalogue().products;
  return (
    <main>
      <HomeHero />
      <MovingProductStrip />
      <section className="section collection" id="collection">
        <div className="section-top">
          <div>
            <span className="eyebrow">THE BIOSASH COLLECTION</span>
            <h2>
              Meet your new
              <br />
              <em>favourite berry.</em>
            </h2>
          </div>
          <Link className="text-link" to="/shop">
            Shop all products <ArrowRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {catalog.slice(0, 6).map((p) => (
            <ProductCard p={p} key={p.slug} />
          ))}
        </div>
        <div className="collection-note">
          <Leaf size={18} />
          <span>
            Browse all six product families below. Choose an item and add it to
            your bag.
          </span>
        </div>
      </section>
      <ProcessJourney />
      <section className="trust">
        <div>
          <span>✳</span>
          <b>Selected with care</b>
          <small>A considered, focused collection</small>
        </div>
        <div>
          <span>◌</span>
          <b>Clear product details</b>
          <small>Honest information at every step</small>
        </div>
        <div>
          <span>↗</span>
          <b>Here to help</b>
          <small>Real support for your questions</small>
        </div>
      </section>
      <section className="spotlight">
        <div className="spotlight-image">
          <ProductArt type="juice" large />
          <span className="spotlight-caption">A BRIGHT PLACE TO BEGIN</span>
        </div>
        <div className="spotlight-copy">
          <span className="eyebrow">A GOOD PLACE TO START</span>
          <h2>
            Sea Buckthorn
            <br />
            <em>Juice</em>
          </h2>
          <p>
            A tangy berry drink from the Biosash collection. Choose a 250 ml,
            500 ml, 750 ml or 1000 ml bottle.
          </p>
          <div className="spot-price">
            <strong>From {money(699)}</strong>
            <span>250 ml · ₹699 · MRP ₹800</span>
          </div>
          <Link
            className="button button-orange"
            to="/products/sea-buckthorn-juice"
          >
            Meet the juice <ArrowRight size={17} />
          </Link>
          <small className="quiet-note">
            Pack imagery shown from the client and Biosash product references.
          </small>
        </div>
      </section>
      <section className="faq-preview">
        <div>
          <span className="eyebrow">GOOD QUESTIONS</span>
          <h2>
            Curious? <em>Ask away.</em>
          </h2>
          <p>
            We believe a little clarity goes a long way. Find the basics or
            reach out to our team.
          </p>
          <Link className="text-link" to="/faq">
            Visit our FAQs <ArrowRight size={16} />
          </Link>
        </div>
        <div className="faq-mini">
          {[
            'What is sea buckthorn?',
            'Where can I find product ingredients?',
            'How can I get help with an order?',
          ].map((x, i) => (
            <Link to="/faq" key={x}>
              <span>0{i + 1}</span>
              <b>{x}</b>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
      <div className="disclosure">
        SEABUCKTHORN BHARAT is an independent storefront featuring selected
        Biosash products. Relationship and legal disclosure wording is pending
        founder approval.
      </div>
    </main>
  );
}
function Shop() {
  const [sort, setSort] = useState('featured'),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('All'),
    { products: list } = useCatalogue();
  let shown = [...list].filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  );
  if (sort === 'low')
    shown.sort(
      (a, b) => (a.variants[0][3] || Infinity) - (b.variants[0][3] || Infinity)
    );
  if (sort === 'high')
    shown.sort((a, b) => (b.variants[0][3] || 0) - (a.variants[0][3] || 0));
  return (
    <main className="page-shell">
      <div className="page-head">
        <span className="eyebrow">A CONSIDERED COLLECTION</span>
        <h1>
          Shop the <em>berry.</em>
        </h1>
        <p>
          Explore all six products. Browse six products with listed pack sizes
          and prices. Follow each product label for verified ingredients and use
          information.
        </p>
      </div>
      <div className="shop-toolbar">
        <span>{shown.length} products</span>
        <div className="shop-filters">
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All</option>
            <option>Juice</option>
            <option>Capsules</option>
            <option>Oils</option>
          </select>
          <label>
            Sort by{' '}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
      </div>
      {shown.length ? (
        <div className="product-grid shop-grid">
          {shown.map((p) => (
            <ProductCard p={p} key={p.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No products match your search.</p>
          <button
            className="button button-light"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
          >
            Clear search
          </button>
        </div>
      )}
    </main>
  );
}
function Product() {
  const { slug } = useParams();
  const { products: catalog } = useCatalogue();
  const p = catalog.find((x) => x.slug === slug);
  const { add, count } = useCart();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0),
    [qty, setQty] = useState(1),
    [activeImage, setActiveImage] = useState(0),
    [added, setAdded] = useState(false);
  useEffect(() => {
    setIdx(0);
    setQty(1);
    setActiveImage(0);
    setAdded(false);
  }, [slug]);
  if (!p) return <NotFound />;
  const type =
    p.slug === 'sea-buckthorn-with-turmeric-oil'
      ? 'oil'
      : p.category === 'Juice'
        ? 'juice'
        : p.category === 'Capsules'
          ? 'capsule'
          : 'oil';
  const variant = p.variants[idx],
    published = p.isPublished ?? p.published,
    orderable = published && !p.priceProvisional;
  const gallery = buildProductGallery(p);
  const addSelected = () => {
    add({ slug: p.slug, name: p.name, image: type }, variant, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };
  const changeVariant = (i) => {
    setIdx(i);
    setQty(1);
  };
  const moveImage = (step) =>
    setActiveImage((i) => (i + step + gallery.length) % gallery.length);
  return (
    <main className="product-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / {p.name}
      </div>
      <div className="product-detail">
        <ProductGallery
          name={p.name}
          images={gallery}
          activeIndex={activeImage}
          onSelect={setActiveImage}
        />
        <div className="detail-copy">
          <span className="eyebrow">BIOSASH · {p.category.toUpperCase()}</span>
          <h1>{p.name}</h1>
          <div className="detail-rating">
            <span className="product-brand-pill">BIOSASH</span>
            <small>Product details &amp; pack information</small>
          </div>
          <p className="descriptor">{p.shortDescription || p.descriptor}</p>
          {orderable ? (
            <>
              <label className="field-label">Choose a size</label>
              <div className="variant-list">
                {p.variants.map((v, i) => (
                  <button
                    className={i === idx ? 'variant selected' : 'variant'}
                    onClick={() => changeVariant(i)}
                    key={v[1]}
                    aria-pressed={i === idx}
                  >
                    <span>
                      <b>{v[0]}</b>
                      <small>SKU {v[1]}</small>
                    </span>
                    <span>
                      <strong>{money(v[3])}</strong>
                      {v[2] > v[3] && <del>{money(v[2])}</del>}
                    </span>
                  </button>
                ))}
              </div>
              <div className="price-line">
                <strong>{money(variant[3])}</strong>
                {variant[2] > variant[3] && <del>{money(variant[2])} MRP</del>}
                <span className={variant[4] > 0 ? 'stock-in' : 'stock-out'}>
                  {variant[4] > 0
                    ? `${variant[4]} available`
                    : 'Currently unavailable'}
                </span>
              </div>
              <div className="buy-row">
                <div className="quantity">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span>{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(20, qty + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="button button-orange grow"
                  disabled={variant[4] === 0}
                  onClick={addSelected}
                >
                  {added
                    ? 'Added to bag'
                    : variant[4] === 0
                      ? 'Out of stock'
                      : 'Add to bag'}{' '}
                  {added ? <Check size={17} /> : <ShoppingBag size={17} />}
                </button>
                <button
                  className="button button-outline"
                  disabled={variant[4] === 0}
                  onClick={() => {
                    addSelected();
                    navigate('/checkout');
                  }}
                >
                  Buy now
                </button>
              </div>
              {added && (
                <div className="add-confirmation" role="status">
                  <Check size={16} />
                  {qty} × {variant[0]} added.{' '}
                  <Link to="/cart">View bag ({count})</Link>
                </div>
              )}
              <p className="purchase-note">
                Taxes and delivery details are confirmed at checkout. Demo
                orders do not trigger payment or dispatch.
              </p>
            </>
          ) : (
            <>
              <label className="field-label">Pack and price information</label>
              <div className="variant-list variant-list-pending">
                {p.variants.map((v, i) => (
                  <button
                    className={i === idx ? 'variant selected' : 'variant'}
                    onClick={() => changeVariant(i)}
                    key={v[1]}
                    aria-pressed={i === idx}
                  >
                    <span>
                      <b>{v[0]}</b>
                      <small>
                        {p.priceProvisional
                          ? 'Proposed price · pack confirmation pending'
                          : 'Pack and price confirmation pending'}
                      </small>
                    </span>
                    <span>
                      {v[3] > 0 ? (
                        <>
                          <strong>{money(v[3])}</strong>
                          {v[2] > v[3] && <del>{money(v[2])} MRP</del>}
                        </>
                      ) : (
                        <strong>To be confirmed</strong>
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div className="price-line">
                <strong>
                  {variant[3] > 0 ? money(variant[3]) : 'Price to be confirmed'}
                </strong>
                {variant[2] > variant[3] && <del>{money(variant[2])} MRP</del>}
                <span className="stock-in">Available in demo store</span>
              </div>
              <div className="buy-row">
                <div className="quantity">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span>{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(20, qty + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="button button-orange grow"
                  disabled={!variant[3] || variant[4] === 0}
                  onClick={addSelected}
                >
                  {added
                    ? 'Added to bag'
                    : variant[3]
                      ? 'Add to bag · proposed price'
                      : 'Price to be confirmed'}{' '}
                  {added ? <Check size={17} /> : <ShoppingBag size={17} />}
                </button>
                <button
                  className="button button-outline"
                  disabled={!variant[3] || variant[4] === 0}
                  onClick={() => {
                    addSelected();
                    navigate('/checkout');
                  }}
                >
                  Buy now
                </button>
              </div>
              {added && (
                <div className="add-confirmation" role="status">
                  <Check size={16} />
                  {qty} × {variant[0]} added at proposed pricing.{' '}
                  <Link to="/cart">View bag ({count})</Link>
                </div>
              )}
              <div className="pending-box">
                <b>Proposed pricing · confirm before publishing</b>
                <p>
                  Price and pack details are provisional storefront values for
                  your review. The working local demo lets you add this
                  selection to your bag and place a demo order.
                </p>
                <Link className="text-link" to="/contact">
                  Ask us a question <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
          <div className="detail-accordion">
            <details open>
              <summary>Product overview</summary>
              <p>
                {p.overview ||
                  p.shortDescription ||
                  'Product information is being prepared from its approved pack and label.'}{' '}
                Product brand: Biosash. Product family: {p.category}.
              </p>
            </details>
            <details>
              <summary>Ingredients, nutrition &amp; specifications</summary>
              <p>
                {p.ingredients ||
                  'Refer to the pack for the complete ingredient and nutrition panels.'}{' '}
                Net quantity: {variant[0]}. SKU: {variant[1]}. For
                batch-specific information, follow the current product label.
              </p>
              {p.slug === 'sea-buckthorn-juice' && (
                <div className="detail-info-cards">
                  {gallery
                    .filter(
                      (g) =>
                        g.src.includes('juice-') &&
                        g.src !== '/products/sea-buckthorn-juice-official.png'
                    )
                    .map((g) => (
                      <button
                        key={g.src}
                        onClick={() => setActiveImage(gallery.indexOf(g))}
                      >
                        <img src={g.src} alt="" />
                        <span>{g.alt}</span>
                      </button>
                    ))}
                </div>
              )}
            </details>
            <details>
              <summary>Pack size, price &amp; availability</summary>
              <p>
                Selected pack: {variant[0]} · {money(variant[3])}
                {variant[2] > variant[3] ? ` (MRP ${money(variant[2])})` : ''}.
                Availability is checked when your order is placed.
              </p>
            </details>
            <details>
              <summary>How to use &amp; storage</summary>
              <p>
                {p.usage ||
                  'Follow the directions, storage instructions and warnings printed on the product pack.'}{' '}
                Contact the support team if you need help locating label
                information.
              </p>
            </details>
            <details>
              <summary>Delivery, returns &amp; support</summary>
              <p>
                Review delivery options and applicable charges at checkout. For
                product or order support, use the{' '}
                <Link to="/contact">contact page</Link> or WhatsApp link in the
                footer.
              </p>
            </details>
          </div>
          <p className="health-note">
            Food and supplement products are not a substitute for medical advice
            or prescribed treatment.
          </p>
        </div>
      </div>
      <section className="related">
        <div className="section-top">
          <div>
            <span className="eyebrow">EXPLORE MORE</span>
            <h2>
              A little more <em>to discover.</em>
            </h2>
          </div>
          <Link to="/shop" className="text-link">
            Shop all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="product-grid">
          {catalog
            .filter((x) => x.slug !== p.slug)
            .slice(0, 3)
            .map((x) => (
              <ProductCard key={x.slug} p={x} />
            ))}
        </div>
      </section>
    </main>
  );
}
function CartPage() {
  const { items, change, remove, subtotal } = useCart();
  return (
    <main className="page-shell cart-page">
      <div className="page-head">
        <span className="eyebrow">YOUR SELECTION</span>
        <h1>
          Your <em>bag.</em>
        </h1>
      </div>
      {!items.length ? (
        <div className="empty-state">
          <ShoppingBag size={38} />
          <h2>Your bag is waiting.</h2>
          <p>Take a look at the collection and find a good place to start.</p>
          <Link className="button button-orange" to="/shop">
            Explore the collection <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((x) => (
              <div className="cart-item" key={x.sku}>
                <ProductArt type={x.image} slug={x.slug} />
                <div className="cart-item-copy">
                  <span className="eyebrow">BIOSASH</span>
                  <Link to={`/products/${x.slug}`}>
                    <h3>{x.name}</h3>
                  </Link>
                  <p>
                    {x.label} · SKU {x.sku}
                  </p>
                  <strong>
                    {money(x.price)} <small>each</small>
                  </strong>
                  <div className="cart-controls">
                    <div className="quantity">
                      <button
                        onClick={() => change(x.sku, x.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span aria-live="polite">{x.qty}</span>
                      <button
                        onClick={() => change(x.sku, x.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button className="remove" onClick={() => remove(x.sku)}>
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>
                <b className="line-total">{money(x.price * x.qty)}</b>
              </div>
            ))}
          </div>
          <aside className="summary">
            <h2>Order summary</h2>
            <div>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="summary-total">
              <b>Estimated total</b>
              <strong>{money(subtotal)}</strong>
            </div>
            <p>
              Shipping options and any applicable charges are shown before
              payment.
            </p>
            <Link className="button button-orange full" to="/checkout">
              Continue to checkout <ArrowRight size={17} />
            </Link>
            <Link className="text-link centered" to="/shop">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { token, customer } = useAuth();
  const [error, setError] = useState(''),
    [coupon, setCoupon] = useState(''),
    [applied, setApplied] = useState(null),
    [quote, setQuote] = useState(null),
    [phone, setPhone] = useState('');
  const nav = useNavigate();
  async function applyCoupon() {
    setError('');
    try {
      let r = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: coupon,
            phone,
            items: items.map((x) => ({ sku: x.sku, quantity: x.qty })),
          }),
        }),
        j = await r.json();
      if (!r.ok) throw Error(j.message);
      setApplied(j);
      setQuote(j);
    } catch (e) {
      setApplied(null);
      setError(e.message);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setError('');
    let data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      let r = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((x) => ({ sku: x.sku, quantity: x.qty })),
          customer: { name: data.name, phone: data.phone, email: data.email },
          address: {
            line1: data.line1,
            line2: data.line2,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          },
          paymentMethod: data.paymentMethod,
          couponCode: applied?.code,
        }),
      });
      let j = await r.json();
      if (!r.ok) throw Error(j.message || 'Order could not be created.');
      sessionStorage.setItem('sbh-order-phone', data.phone);
      clear();
      nav(`/order-success/${j.order.orderId}`);
    } catch (e) {
      setError(
        e.message === 'Failed to fetch'
          ? 'The local order service is unavailable.'
          : e.message
      );
    }
  }
  if (!items.length)
    return (
      <main className="empty-state page-shell">
        <h1>Your bag is empty.</h1>
        <Link className="button button-orange" to="/shop">
          Shop the collection
        </Link>
      </main>
    );
  if (!token)
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  return (
    <main className="page-shell">
      <div className="page-head">
        <span className="eyebrow">A FEW FINAL DETAILS</span>
        <h1>
          Checkout, <em>made simple.</em>
        </h1>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>Contact information</h2>
          {!token && (
            <p className="account-checkout-note">
              <Link to="/account">Sign in or create an account</Link> to view
              account orders later, or continue as a guest.
            </p>
          )}
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              defaultValue={customer?.name || ''}
              required
            />
          </label>
          <div className="form-split">
            <label>
              Mobile number
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[+]?[0-9 ]{10,15}"
                placeholder="+91"
                required
                value={phone || customer?.phone || ''}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setApplied(null);
                }}
              />
            </label>
            <label>
              Email <span className="optional">(optional)</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={customer?.email || ''}
              />
            </label>
          </div>
          <h2>Delivery address</h2>
          <label>
            Address line 1
            <input name="line1" autoComplete="address-line1" required />
          </label>
          <label>
            Address line 2 <span className="optional">(optional)</span>
            <input name="line2" autoComplete="address-line2" />
          </label>
          <div className="form-split">
            <label>
              City
              <input name="city" autoComplete="address-level2" required />
            </label>
            <label>
              State
              <input name="state" autoComplete="address-level1" required />
            </label>
          </div>
          <label>
            PIN code
            <input
              name="pincode"
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="postal-code"
              required
            />
          </label>
          <h2>Payment method</h2>
          <label className="payment-choice">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              defaultChecked
            />
            <span>
              <b>Cash on delivery</b>
              <small>
                Demo mode: local orders are recorded with payment pending. No
                collection or dispatch takes place.
              </small>
            </span>
          </label>
          <label className="payment-choice disabled-choice">
            <input
              type="radio"
              name="paymentMethod"
              value="cashfree"
              disabled
            />
            <span>
              <b>Pay online</b>
              <small>
                Cashfree sandbox requires a connected MongoDB database and
                merchant credentials.
              </small>
            </span>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-orange full" type="submit">
            Place demo order <ArrowRight size={17} />
          </button>
          <p className="secure-note">
            Local demo orders do not trigger payment or delivery.
          </p>
        </form>
        <aside className="summary">
          <h2>Your order</h2>
          {items.map((x) => (
            <div className="checkout-line" key={x.sku}>
              <span>
                {x.name} · {x.label} × {x.qty}
              </span>
              <b>{money(x.price * x.qty)}</b>
            </div>
          ))}
          <form
            className="coupon-form"
            onSubmit={(e) => {
              e.preventDefault();
              applyCoupon();
            }}
          >
            <label>Personal coupon</label>
            <div>
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Enter code"
              />
              <button className="button button-light">Apply</button>
            </div>
            {applied && (
              <small>
                Applied: {applied.code} · {money(applied.discount)} off
              </small>
            )}
          </form>
          <div>
            <span>Subtotal</span>
            <b>{money(subtotal)}</b>
          </div>
          {quote && (
            <div>
              <span>Coupon discount</span>
              <b>−{money(quote.discount)}</b>
            </div>
          )}
          <div className="summary-total">
            <b>Estimated total</b>
            <strong>{money(subtotal - (quote?.discount || 0))}</strong>
          </div>
          <p>
            Local demo shipping is set to ₹0 and can be changed in Admin
            settings.
          </p>
          <Link className="text-link" to="/cart">
            Edit your bag
          </Link>
        </aside>
      </div>
    </main>
  );
}
function OrderSuccess() {
  let { orderId } = useParams();
  const [order, setOrder] = useState(null),
    [status, setStatus] = useState('Checking order status…');
  useEffect(() => {
    fetch('/api/orders/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        phone: sessionStorage.getItem('sbh-order-phone') || '',
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setOrder(d.order);
        setStatus('');
      })
      .catch(() =>
        setStatus(
          'Order received. Enter your order reference and checkout phone on Track order to view its verified status.'
        )
      );
  }, [orderId]);
  return (
    <main className="empty-state page-shell">
      <div className="success-icon">
        {order?.paymentStatus === 'paid' ? (
          <Check size={28} />
        ) : (
          <ShoppingBag size={25} />
        )}
      </div>
      <span className="eyebrow">
        {order?.paymentStatus === 'paid'
          ? 'PAYMENT CONFIRMED'
          : order?.paymentMethod === 'cashfree'
            ? 'PAYMENT PENDING'
            : 'ORDER RECEIVED'}
      </span>
      <h1>
        {order?.paymentStatus === 'paid'
          ? 'Payment confirmed for'
          : order?.paymentMethod === 'cashfree'
            ? 'Payment pending for'
            : 'Your order was received,'}{' '}
        <em>your order.</em>
      </h1>
      <p>
        {status || (
          <>
            Order reference <b>{orderId}</b>. Current status:{' '}
            <b>{order?.orderStatus}</b>; payment: <b>{order?.paymentStatus}</b>.
            Total {money(order?.total)}.
          </>
        )}
      </p>
      <Link className="button button-orange" to="/track-order">
        Track an order <ArrowRight size={17} />
      </Link>
    </main>
  );
}
function InfoPage({ title, kicker, children }) {
  return (
    <main className="page-shell info-page">
      <div className="page-head">
        <span className="eyebrow">{kicker}</span>
        <h1>{title}</h1>
      </div>
      <div className="info-content">{children}</div>
    </main>
  );
}
function About() {
  return (
    <InfoPage
      title={
        <>
          A little care, <em>in every choice.</em>
        </>
      }
      kicker="OUR STORY"
    >
      <p>
        SEABUCKTHORN BHARAT is a thoughtfully curated storefront for selected
        Biosash products. We want discovering sea buckthorn to feel clear,
        welcoming and grounded in good information.
      </p>
      <p>
        Our focus is simple: share product details honestly, answer questions
        with care and build a considered collection as verified product
        information becomes available.
      </p>
      <div className="pending-box">
        <b>Founder story in progress</b>
        <p>
          Company details, founder biography, distributor relationship wording
          and supporting documents are pending approval.
        </p>
      </div>
    </InfoPage>
  );
}
function Why() {
  return (
    <InfoPage
      title={
        <>
          Get to know the <em>berry.</em>
        </>
      }
      kicker="A MOMENT TO DISCOVER"
    >
      <p>
        Sea buckthorn is a fruit-bearing shrub found in parts of Europe and
        Asia. Its orange berries are known for their distinctive tart flavour
        and have a long history of traditional use.
      </p>
      <p>
        Growing conditions and product composition vary. For specific
        ingredients, nutrition facts and directions, refer to the current label
        of each product.
      </p>
      <div className="pending-box">
        <b>Clear, careful information</b>
        <p>
          This page avoids health claims. Any product-specific claims will be
          reviewed against approved labels and applicable Indian regulations
          before publication.
        </p>
      </div>
    </InfoPage>
  );
}
function Contact() {
  const [sent, setSent] = useState(false),
    [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    let f = new FormData(e.currentTarget);
    try {
      let r = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: f.get('name'),
            email: f.get('email'),
            message: f.get('message'),
          }),
        }),
        j = await r.json();
      if (!r.ok) throw Error(j.message);
      setSent(true);
    } catch (x) {
      setError(x.message);
    }
  }
  return (
    <InfoPage
      title={
        <>
          We’re here to <em>help.</em>
        </>
      }
      kicker="CONTACT"
    >
      <p>
        Questions about a product or an order? Send us a note and our team will
        get back to you.
      </p>
      {sent ? (
        <div className="pending-box">
          <b>Thanks for reaching out.</b>
          <p>
            Your message has been saved in this local demo. Connect an email
            service for delivery notifications.
          </p>
        </div>
      ) : (
        <form className="checkout-form contact-form" onSubmit={submit}>
          <label>
            Your name
            <input name="name" required />
          </label>
          <label>
            Email address
            <input name="email" type="email" required />
          </label>
          <label>
            How can we help?
            <textarea name="message" rows="5" required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-orange">
            Send enquiry <ArrowRight size={17} />
          </button>
        </form>
      )}
      <p className="quiet-note">
        For a quicker reply,{' '}
        <a href={WHATSAPP_ORDER_URL} target="_blank" rel="noreferrer">
          message us on WhatsApp
        </a>{' '}
        for product questions or order support.
      </p>
    </InfoPage>
  );
}
function FAQ() {
  return (
    <InfoPage
      title={
        <>
          Good questions, <em>straight answers.</em>
        </>
      }
      kicker="FREQUENTLY ASKED"
    >
      <div className="detail-accordion">
        {[
          [
            'Where do your products come from?',
            'Our storefront features selected Biosash products. Product origin and manufacturer details are shown only when verified on the relevant label.',
          ],
          [
            'Where can I find ingredients and directions?',
            'Please refer to the current product label. Verified pack information will also be published on each product page.',
          ],
          [
            'How much does delivery cost?',
            'Applicable shipping charges are shown at checkout once the business shipping settings are configured.',
          ],
          [
            'Can I pay online or choose cash on delivery?',
            'Online payments will be enabled after Cashfree merchant setup. COD availability and any advance terms will be stated clearly before order placement.',
          ],
          [
            'Do these products treat a health condition?',
            'We do not make treatment or prevention claims. Food and supplement products are not a substitute for medical advice or prescribed treatment.',
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
function Track() {
  const [id, setId] = useState(''),
    [phone, setPhone] = useState(''),
    [msg, setMsg] = useState('');
  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      let r = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, phone }),
      });
      let j = await r.json();
      setMsg(
        r.ok
          ? `Status: ${j.order.orderStatus} · Payment: ${j.order.paymentStatus} · Total: ${money(j.order.total)}`
          : j.message
      );
    } catch {
      setMsg('Order tracking service is not available.');
    }
  }
  return (
    <InfoPage
      title={
        <>
          Your order, <em>in the loop.</em>
        </>
      }
      kicker="TRACK AN ORDER"
    >
      <p>
        Enter your order reference and checkout phone number to see the latest
        saved status.
      </p>
      <form className="checkout-form contact-form" onSubmit={submit}>
        <label>
          Order reference
          <input value={id} onChange={(e) => setId(e.target.value)} required />
        </label>
        <label>
          Checkout phone number
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <button className="button button-orange">
          Find my order <ArrowRight size={17} />
        </button>
        {msg && <div className="pending-box">{msg}</div>}
      </form>
    </InfoPage>
  );
}
function Legal({ title }) {
  return (
    <InfoPage title={<>{title}</>} kicker="INFORMATION">
      <div className="pending-box">
        <b>Draft policy — founder review required</b>
        <p>
          This policy has not been approved for customer use. Business address,
          support details, shipping timelines, cancellation and returns terms,
          privacy contact and other applicable legal information must be
          supplied before launch.
        </p>
      </div>
    </InfoPage>
  );
}
function NotFound() {
  return (
    <InfoPage
      title={
        <>
          That page is <em>not here.</em>
        </>
      }
      kicker="404"
    >
      <Link className="button button-orange" to="/">
        Return home <ArrowRight size={17} />
      </Link>
    </InfoPage>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/products/:slug" element={<Product />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/login" element={<LoginChoice />} />
                  <Route
                    path="/order-success/:orderId"
                    element={<OrderSuccess />}
                  />
                  <Route path="/track-order" element={<Track />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/why-sea-buckthorn" element={<Why />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  {[
                    'shipping-policy',
                    'cancellation-returns',
                    'privacy-policy',
                    'terms-and-conditions',
                  ].map((r, i) => (
                    <Route
                      key={r}
                      path={`/${r}`}
                      element={
                        <Legal
                          title={
                            [
                              'Shipping policy',
                              'Cancellation & returns',
                              'Privacy policy',
                              'Terms & conditions',
                            ][i]
                          }
                        />
                      }
                    />
                  ))}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

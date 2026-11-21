import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { money } from '../data.js';
import { useCart } from '../context/CartContext.jsx';
import ProductArt from './ProductArt.jsx';

export default function ProductCard({ product: suppliedProduct, p }) {
  const product = suppliedProduct || p;
  const variant = product.variants[0];
  const published = product.isPublished ?? product.published;
  const available = published && variant[4] > 0;
  const { add } = useCart();
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const productUrl = `/products/${product.slug}`;

  return (
    <article className="product-card">
      <div className="card-image-wrap">
        <Link to={productUrl} className="card-image">
          <ProductArt slug={product.slug} type={product.image} />
          {published && variant[2] > variant[3] && (
            <span className="offer">
              SAVE {Math.round((1 - variant[3] / variant[2]) * 100)}%
            </span>
          )}
          <span className="draft-tag">
            {product.priceProvisional
              ? 'Price to confirm'
              : available
                ? 'Biosash selection'
                : 'Currently unavailable'}
          </span>
          <span className="quick-view">
            View details <ArrowUpRight size={15} />
          </span>
        </Link>
        <button
          className={favorite ? 'favorite active' : 'favorite'}
          onClick={() => setFavorite(!favorite)}
          aria-label={
            favorite
              ? `Remove ${product.name} from saved products`
              : `Save ${product.name}`
          }
          aria-pressed={favorite}
        >
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="card-copy">
        <span className="eyebrow">{product.category} · BIOSASH</span>
        <Link to={productUrl}>
          <h3>{product.name}</h3>
        </Link>
        <p className="card-pack">{variant[0]}</p>
        <p className="card-price">
          {variant[3] > 0 ? (
            <>
              <strong>{money(variant[3])}</strong>{' '}
              {variant[2] > variant[3] && <del>{money(variant[2])}</del>}
              {product.priceProvisional && (
                <small className="proposed-price-note">
                  {' '}
                  Proposed · confirm before publication
                </small>
              )}
            </>
          ) : (
            <span className="muted">Price to be confirmed</span>
          )}
        </p>
        <div className="card-actions">
          <Link className="card-details" to={productUrl}>
            View details <ArrowUpRight size={15} />
          </Link>
          <button
            className="card-add"
            disabled={!available}
            onClick={() => {
              add(product, variant, 1);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1600);
            }}
            aria-label={`Add ${product.name} to bag`}
          >
            {available ? (
              <>
                {added ? 'Added' : 'Add to bag'}{' '}
                {added ? <Check size={15} /> : <ShoppingBag size={15} />}
              </>
            ) : (
              <>Unavailable</>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

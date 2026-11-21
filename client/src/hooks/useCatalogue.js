import { useEffect, useState } from 'react';
import { products as localProducts } from '../data.js';

export default function useCatalogue() {
  const [products, setProducts] = useState(localProducts);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    fetch('/api/products')
      .then(async (response) => {
        if (
          !response.ok ||
          !(response.headers.get('content-type') || '').includes(
            'application/json'
          )
        )
          throw new Error('Catalogue API unavailable');
        return response.json();
      })
      .then((data) => {
        if (!active || !Array.isArray(data.products)) return;
        setProducts(
          data.products.map((product) => ({
            ...product,
            priceProvisional: product.priceProvisional ?? false,
            variants: product.variants.map((variant) => [
              variant.label,
              variant.sku,
              variant.mrp,
              variant.sellingPrice,
              variant.stock,
            ]),
            image:
              product.slug === 'sea-buckthorn-with-turmeric-oil'
                ? 'oil'
                : product.category === 'Juice'
                  ? 'juice'
                  : product.category === 'Capsules'
                    ? 'capsule'
                    : 'oil',
          }))
        );
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('offline');
      });
    return () => {
      active = false;
    };
  }, []);

  return { products, status };
}

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function useMobileHero() {
  const [mobile, setMobile] = useState(
    () => window.matchMedia('(max-width: 680px)').matches
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width: 680px)');
    const update = (event) => setMobile(event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}

export function HomeHero() {
  const mobile = useMobileHero();
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const video = mobile
    ? '/videos/2026-07-home-hero-2-mobile.mp4'
    : '/videos/hero.mp4';

  return (
    <section className="hero-refined">
      <div className="hero-refined-copy">
        <span className="eyebrow">
          <i /> A BERRY, ROOTED IN THE HIMALAYAS
        </span>
        <h1>
          Nature’s golden
          <br />
          <em>little secret.</em>
        </h1>
        <p>
          Meet sea buckthorn: a vibrant Himalayan berry, thoughtfully brought to
          you by SEABUCKTHORN BHARAT.
        </p>
        <div className="hero-actions">
          <Link className="button button-orange" to="/shop">
            Explore the collection <ArrowRight size={17} />
          </Link>
          <Link className="text-link" to="/why-sea-buckthorn">
            Get to know the berry <ArrowRight size={15} />
          </Link>
        </div>
        <span className="hero-refined-note">
          Rooted in nature. Chosen with care. <b>Powered by Biosash</b>
        </span>
      </div>
      <div className="hero-video-frame">
        {reduceMotion ? (
          <img
            src="/products/hero-seedoil.webp"
            alt="Biosash sea buckthorn seed oil campaign artwork"
          />
        ) : (
          <video
            key={video}
            src={video}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/products/hero-seedoil.webp"
            aria-label="Sea buckthorn product film"
          />
        )}
        <span className="hero-video-label">
          SEABUCKTHORN BHARAT · POWERED BY BIOSASH
        </span>
      </div>
    </section>
  );
}

const messages = [
  'Sea Buckthorn Juice',
  'Seed Oil Capsules',
  'Berry Oil Capsules',
  'Diabo Juice',
  'Turmeric Oil',
  'Shop the collection',
];
export function MovingProductStrip() {
  const repeat = [...messages, ...messages];
  return (
    <div className="moving-strip" aria-label="Explore the collection">
      <div className="moving-strip-track">
        {repeat.map((message, index) => (
          <span key={`${message}-${index}`}>
            <i /> {message}
          </span>
        ))}
      </div>
    </div>
  );
}

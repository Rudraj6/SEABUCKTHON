import React, { useState } from 'react';
import { packImages, productVideos } from '../data/productMedia.js';

export default function ProductArt({
  type = 'juice',
  slug,
  large = false,
  editorial = false,
}) {
  const [showVideo, setShowVideo] = useState(false);
  const image = editorial
    ? '/editorial/sea-buckthorn-oil-campaign-editorial.jpg'
    : packImages[slug] || '/products/sea-buckthorn-juice-pack.jpg';
  const video = productVideos[slug];

  return (
    <div
      className={`product-art art-${type} ${large ? 'art-large' : ''} ${editorial ? 'art-editorial' : ''}`}
    >
      {showVideo && large && video ? (
        <video
          src={video}
          controls
          playsInline
          muted
          autoPlay
          aria-label="Product video"
        />
      ) : (
        <img
          src={image}
          alt={
            editorial
              ? 'Sea Buckthorn Oil campaign artwork'
              : `Biosash ${slug || 'Sea Buckthorn'} product packaging`
          }
          loading={large ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      {large && video && (
        <button
          className="media-toggle"
          onClick={() => setShowVideo((value) => !value)}
        >
          {showVideo ? 'View product pack' : 'Play product video'}
        </button>
      )}
    </div>
  );
}

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductGallery({
  name,
  images,
  activeIndex,
  onSelect,
}) {
  const active = images[activeIndex];
  const move = (step) =>
    onSelect((activeIndex + step + images.length) % images.length);

  return (
    <div className="detail-gallery">
      <div className="gallery-thumbnails" aria-label={`${name} product images`}>
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            className={
              index === activeIndex ? 'gallery-thumb active' : 'gallery-thumb'
            }
            onClick={() => onSelect(index)}
            aria-label={`Show image ${index + 1}: ${image.alt}`}
            aria-pressed={index === activeIndex}
          >
            {image.video ? (
              <span className="video-thumb">
                <img src={image.src} alt="" />
                <b>▶</b>
              </span>
            ) : (
              <img src={image.src} alt="" />
            )}
          </button>
        ))}
      </div>
      <div className="detail-image">
        <div className="gallery-main" key={`${name}-${activeIndex}`}>
          {active.video ? (
            <video
              src={active.video}
              controls
              playsInline
              preload="metadata"
              poster={active.src}
              aria-label={active.alt}
            />
          ) : (
            <img src={active.src} alt={active.alt} decoding="async" />
          )}
          {images.length > 1 && (
            <>
              <button
                className="gallery-arrow previous"
                onClick={() => move(-1)}
                aria-label="Previous product image"
              >
                <ChevronLeft />
              </button>
              <button
                className="gallery-arrow next"
                onClick={() => move(1)}
                aria-label="Next product image"
              >
                <ChevronRight />
              </button>
              <span className="gallery-counter">
                {activeIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>
        <div className="image-footnote">
          {images.length > 1
            ? 'Select a thumbnail or use the arrows to explore product images · additional pack views will be updated as photography is finalized'
            : 'Official product pack image'}
        </div>
      </div>
    </div>
  );
}

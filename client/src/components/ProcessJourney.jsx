import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const steps = [
  ['Harvest.', 'Certified wild-harvested organic sea buckthorn berries.'],
  [
    'Process.',
    'Initial processing within six hours to preserve omega oils and nutrition.',
  ],
  ['Refine.', 'Processing facility in Leh, pioneering since 2004.'],
  ['Innovate.', 'India’s first patent-pending processing technology.'],
  ['Preserve.', 'Maximum natural nutrition preservation.'],
  ['Bottle.', 'From berry to bottle, with supply chain control.'],
  ['Trust.', 'Trusted since 2004, exporting to USA, UK and UAE.'],
  ['Verify.', 'Juices checked for heavy metals and impurities.'],
];

const points = [
  [84, 330],
  [220, 290],
  [356, 250],
  [492, 210],
  [628, 170],
  [764, 130],
  [900, 105],
  [1036, 70],
];

const route =
  'M84 330 H166 L220 290 H302 L356 250 H438 L492 210 H574 L628 170 H710 L764 130 H846 L900 105 L1036 70';

export default function ProcessJourney() {
  const reduceMotion = useReducedMotion();
  const [mobile, setMobile] = React.useState(
    () => window.matchMedia('(max-width: 680px)').matches
  );
  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 680px)');
    const update = (event) => setMobile(event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const rise = (index) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: {
      duration: reduceMotion ? 0 : 0.55,
      delay: reduceMotion ? 0 : index * 0.12,
      ease: 'easeOut',
    },
    style: {
      '--step-x': `${(points[index][0] / 1120) * 100}%`,
      '--step-y': `${(points[index][1] / 360) * 380}px`,
    },
  });
  return (
    <section
      className="process-journey"
      aria-labelledby="process-journey-title"
    >
      <div className="process-heading">
        <span className="eyebrow">FROM HARVEST TO HOME</span>
        <h2 id="process-journey-title">
          Sea Buckthorn <em>Journey</em>
        </h2>
        <p>Eight steps from the Himalayan harvest to the finished product.</p>
      </div>
      <div className="process-route">
        {!mobile && (
          <svg
            className="process-route-line"
            viewBox="0 0 1120 360"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <motion.path
              d={route}
              initial={reduceMotion ? false : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: reduceMotion ? 0 : 2.2,
                ease: 'easeInOut',
              }}
            />
            {points.map(([cx, cy], index) => (
              <motion.circle
                key={index}
                cx={cx}
                cy={cy}
                r={index === 3 ? 11 : 7}
                {...rise(index)}
              />
            ))}
          </svg>
        )}
        {steps.map(([title, copy], index) => {
          const [x, y] = points[index];
          const labelSide =
            index === 6 || index % 2 === 0
              ? 'process-step-above'
              : 'process-step-below';
          return (
            <motion.div
              className="process-step-motion"
              key={title}
              {...rise(index)}
              style={rise(index).style}
            >
              <article className={`process-step ${labelSide}`}>
                <span className="process-step-number">STEP {index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            </motion.div>
          );
        })}
        <motion.span className="process-berry" aria-hidden="true" {...rise(7)}>
          <i />
          <i />
          <i />
          <i />
        </motion.span>
      </div>
      <p className="process-note">
        For product ingredients, certifications and batch details, refer to the
        current product packaging.
      </p>
    </section>
  );
}

export const products = [
  {
    slug: 'sea-buckthorn-juice',
    name: 'Sea Buckthorn Juice',
    category: 'Juice',
    descriptor: 'A bright, tangy berry drink from the Biosash collection.',
    overview:
      'Cold-pressed sea buckthorn juice, presented in four pack sizes. Biosash describes the juice as 99.9% pulp. See the pack for complete nutrition and ingredient details.',
    ingredients:
      'Sea buckthorn juice. Refer to the current pack label for the complete ingredient and nutrition panels.',
    usage:
      'Shake well and follow the serving instructions printed on the bottle. Refrigerate after opening and use within the period stated on the label.',
    image: 'juice',
    published: true,
    variants: [
      ['250 ml', 'SBH-JU-250', 800, 699, 30],
      ['500 ml', 'SBH-JU-500', 1600, 1399, 24],
      ['750 ml', 'SBH-JU-750', 2400, 1999, 18],
      ['1000 ml', 'SBH-JU-1000', 3200, 2499, 12],
    ],
  },
  {
    slug: 'sea-buckthorn-seed-oil-capsule',
    name: 'Sea Buckthorn Seed Oil Capsule',
    category: 'Capsules',
    descriptor:
      'A 30-capsule pack of sea buckthorn seed oil. Check product label for ingredients and directions.',
    overview:
      'A 30-capsule pack featuring Biosash sea buckthorn seed oil. Biosash identifies the oil as CO₂-extracted on its listing. Refer to the current packaging for confirmed product specifications.',
    ingredients:
      'Sea buckthorn seed oil. Check the product label for the capsule shell and complete ingredients.',
    usage:
      'Follow the serving instructions and warnings printed on the product label.',
    image: 'capsule',
    published: true,
    variants: [['30 capsules', 'SBH-SC-01', 2715, 1999, 12]],
  },
  {
    slug: 'sea-buckthorn-berry-oil-capsule',
    name: 'Sea Buckthorn Berry Oil Capsule',
    category: 'Capsules',
    descriptor:
      'A 30-capsule pack featuring sea buckthorn berry oil. Check product label for ingredients and directions.',
    overview:
      'A 30-capsule pack featuring sea buckthorn berry oil. Check the current packaging for complete product specifications.',
    ingredients:
      'Sea buckthorn berry oil. Check the product label for the capsule shell and complete ingredients.',
    usage:
      'Follow the serving instructions and warnings printed on the product label.',
    image: 'capsule',
    published: true,
    variants: [['30 capsules', 'SBH-BC-01', 2715, 1999, 12]],
  },
  {
    slug: 'sea-buckthorn-diabo-juice',
    name: 'Sea Buckthorn Diabo Juice',
    category: 'Juice',
    descriptor:
      'Sea buckthorn Diabo Juice. Choose a pack size; refer to the product label for use and ingredients.',
    overview:
      'A juice blend featuring sea buckthorn. Biosash lists Karela, Jamun and Punarnava extracts among its ingredients. Check the product pack for the full formulation and nutrition details.',
    ingredients:
      'Sea buckthorn with Karela (bitter gourd), Jamun (Java plum) and Punarnava extracts as listed by Biosash. Verify the complete ingredient list on the pack.',
    usage:
      'Follow serving directions on the product label. This product is not a substitute for prescribed treatment or medical advice.',
    image: 'juice',
    published: true,
    variants: [
      ['250 ml', 'SBH-DJ-250', 800, 699, 12],
      ['500 ml', 'SBH-DJ-500', 1600, 1399, 12],
      ['750 ml', 'SBH-DJ-750', 2400, 1999, 12],
      ['1000 ml', 'SBH-DJ-1000', 3200, 2499, 12],
    ],
  },
  {
    slug: 'sea-buckthorn-with-turmeric-oil',
    name: 'Sea Buckthorn with Turmeric Oil',
    category: 'Juice',
    descriptor:
      'Sea buckthorn juice blended with turmeric oil. Official listing shows 250 ml and 750 ml packs.',
    overview:
      'Sea buckthorn juice formulated with turmeric oil. The Biosash listing shows 250 ml and 750 ml pack options.',
    ingredients:
      'Sea buckthorn and turmeric oil are identified in the product name and Biosash listing. Refer to the pack for the full ingredient panel.',
    usage:
      'Follow serving and storage instructions printed on the product label.',
    image: 'oil',
    published: true,
    variants: [
      ['250 ml', 'SBH-TO-250', 850, 850, 12],
      ['750 ml', 'SBH-TO-750', 2500, 2500, 12],
    ],
  },
  {
    slug: 'sea-buckthorn-oil',
    name: 'Sea Buckthorn Oil',
    category: 'Oils',
    descriptor:
      'Sea Buckthorn Oil in a 10 ml dropper bottle. Refer to the product label for directions and storage.',
    overview:
      'A 10 ml dropper bottle of sea buckthorn oil, listed by Biosash as a skin and beauty oil.',
    ingredients:
      'Sea buckthorn oil. Check the packaging for full ingredient and product information.',
    usage:
      'Use only as directed on the label. Avoid contact with eyes and discontinue use if irritation occurs.',
    image: 'oil',
    published: true,
    variants: [['10 ml', 'SBH-OI-10', 999, 999, 12]],
  },
];

export const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

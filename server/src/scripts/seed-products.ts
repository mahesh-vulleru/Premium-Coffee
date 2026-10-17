import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';

export const SEED_COFFEE_PRODUCTS = [
  {
    name: 'Espresso Roast',
    subtitle: 'Full-bodied with smoky chocolate notes',
    category: 'espresso',
    price: 650,
    originalPrice: 750,
    rating: 4.9,
    reviewsCount: 142,
    image: '/images/product-espresso.jpg',
    isSale: true,
    saleLabel: 'Sale',
    tag: 'best_sellers',
    roastLevel: 'Dark',
    tastingNotes: ['Dark Chocolate', 'Molasses', 'Caramel'],
    origin: 'Antioquia, Colombia',
    description:
      'Our crown jewel espresso roast. Intensely rich, syrupy, and crafted specifically for velvety crema and balanced milk drinks.',
    stockAvailable: 24,
    brewGuide: {
      method: 'Espresso Machine / Moka Pot',
      ratio: '1:2 (18g in, 36g out in 27s)',
      temperature: '93°C / 200°F',
      grindRecommendation: 'Fine',
    },
  },
  {
    name: 'Dark Blend',
    subtitle: 'Deep, rich, and earthy roast',
    category: 'americano',
    price: 590,
    originalPrice: 690,
    rating: 4.8,
    reviewsCount: 98,
    image: '/images/product-dark-blend.jpg',
    isSale: false,
    tag: 'best_sellers',
    roastLevel: 'Dark',
    tastingNotes: ['Toasted Walnut', 'Cacao Nibs', 'Brown Sugar'],
    origin: 'Sumatra & Guatemala',
    description:
      'A robust dark blend balancing Indonesian volcanic body with Guatemalan cacao sweetness. Zero bitterness, pure satisfaction.',
    stockAvailable: 19,
    brewGuide: {
      method: 'French Press / Drip',
      ratio: '1:15 (30g coffee to 450ml water)',
      temperature: '94°C / 202°F',
      grindRecommendation: 'Coarse to Medium-Coarse',
    },
  },
  {
    name: 'Vanilla Flavored Beans',
    subtitle: 'Natural Madagascar bourbon vanilla infusion',
    category: 'latte',
    price: 690,
    originalPrice: 790,
    rating: 4.9,
    reviewsCount: 86,
    image: '/images/product-vanilla.jpg',
    isSale: false,
    tag: 'new_arrivals',
    roastLevel: 'Medium',
    tastingNotes: ['Madagascar Vanilla', 'Sweet Cream', 'Toffee'],
    origin: 'Huila, Colombia',
    description:
      'Slow-infused with genuine organic vanilla pods during the cooling process. A fragrant, silky cup perfect for morning lattes.',
    stockAvailable: 15,
    brewGuide: {
      method: 'Pour Over / Aeropress',
      ratio: '1:16 (15g coffee to 240ml water)',
      temperature: '92°C / 198°F',
      grindRecommendation: 'Medium',
    },
  },
  {
    name: 'Espresso Roast Reserve',
    subtitle: 'Single estate volcanic soil harvest',
    category: 'espresso',
    price: 720,
    originalPrice: 850,
    rating: 5.0,
    reviewsCount: 119,
    image: '/images/product-espresso.jpg',
    isSale: true,
    saleLabel: 'Sale',
    tag: 'top_rates',
    roastLevel: 'Medium-Dark',
    tastingNotes: ['Black Cherry', 'Cedar', 'Dark Fudge'],
    origin: 'Tarrazú, Costa Rica',
    description:
      'Hand-picked at 1,800m elevation. Offers an intense aroma with a sweet black cherry nuance under rich chocolate crema.',
    stockAvailable: 12,
    brewGuide: {
      method: 'Espresso Machine',
      ratio: '1:2.2 (19g in, 42g out in 30s)',
      temperature: '93.5°C / 200°F',
      grindRecommendation: 'Fine',
    },
  },
  {
    name: 'Hazelnut Infused Coffee',
    subtitle: 'Aromatic roasted hazelnut & butter cookie',
    category: 'cappuccino',
    price: 680,
    originalPrice: 780,
    rating: 4.7,
    reviewsCount: 74,
    image: '/images/product-hazelnut.jpg',
    isSale: false,
    tag: 'new_arrivals',
    roastLevel: 'Medium',
    tastingNotes: ['Roasted Hazelnut', 'Praline', 'Graham Cracker'],
    origin: 'Minas Gerais, Brazil',
    description:
      'Decadent roasted Oregon hazelnuts infused into sweet Brazilian Santos beans. Creates an unforgettable cozy afternoon brew.',
    stockAvailable: 28,
    brewGuide: {
      method: 'Drip / Cold Brew',
      ratio: '1:14 (Cold brew steep 16h)',
      temperature: 'Chilled / 92°C',
      grindRecommendation: 'Medium-Coarse',
    },
  },
  {
    name: 'Espresso Roast Classic',
    subtitle: 'Traditional Italian bar profile',
    category: 'espresso',
    price: 620,
    originalPrice: 720,
    rating: 4.8,
    reviewsCount: 210,
    image: '/images/product-espresso.jpg',
    isSale: true,
    saleLabel: 'Sale',
    tag: 'best_sellers',
    roastLevel: 'Dark',
    tastingNotes: ['Roasted Almond', 'Bittersweet Chocolate', 'Nutmeg'],
    origin: 'Brazil & Ethiopia',
    description:
      'Crafted for espresso purists. Thick body, hazelnut-colored crema, and a lingering bittersweet cocoa finish.',
    stockAvailable: 30,
    brewGuide: {
      method: 'Moka Pot / Espresso',
      ratio: '1:2 (18g in, 36g out)',
      temperature: '92°C / 198°F',
      grindRecommendation: 'Fine',
    },
  },
  {
    name: 'Dark Blend Signature',
    subtitle: 'Heavy body with volcanic mineral depth',
    category: 'americano',
    price: 640,
    originalPrice: 740,
    rating: 4.9,
    reviewsCount: 165,
    image: '/images/product-dark-blend.jpg',
    isSale: false,
    tag: 'best_sellers',
    roastLevel: 'Dark',
    tastingNotes: ['Pipe Tobacco', 'Black Currant', 'Smoky Oak'],
    origin: 'Aceh Highlands, Sumatra',
    description:
      'Wet-hulled specialty beans roasted to deep dark perfection. Phenomenal with a dash of heavy cream or black as night.',
    stockAvailable: 22,
    brewGuide: {
      method: 'French Press',
      ratio: '1:15 (4 min steep time)',
      temperature: '95°C / 203°F',
      grindRecommendation: 'Coarse',
    },
  },
  {
    name: 'Vanilla Flavored Reserve',
    subtitle: 'Double bean infused small batch',
    category: 'latte',
    price: 710,
    originalPrice: 820,
    rating: 4.8,
    reviewsCount: 92,
    image: '/images/product-vanilla.jpg',
    isSale: false,
    tag: 'top_rates',
    roastLevel: 'Medium',
    tastingNotes: ['Vanilla Bean', 'Butterscotch', 'Honey'],
    origin: 'Cerrado, Brazil',
    description:
      'Small-batch roasted every Tuesday. Balanced medium roast saturated with true orchid vanilla flavor.',
    stockAvailable: 14,
    brewGuide: {
      method: 'Aeropress / V60',
      ratio: '1:16 (16g coffee to 250ml water)',
      temperature: '91°C / 196°F',
      grindRecommendation: 'Medium',
    },
  },
  {
    name: 'Organic Fair Trade Beans',
    subtitle: '100% Certified cooperative shade grown',
    category: 'cold_brew',
    price: 750,
    originalPrice: 890,
    rating: 5.0,
    reviewsCount: 178,
    image: '/images/product-organic.jpg',
    isSale: false,
    tag: 'top_rates',
    roastLevel: 'Medium',
    tastingNotes: ['Citrus Blossom', 'Golden Honey', 'Apricot'],
    origin: 'Yirgacheffe, Ethiopia',
    description:
      'Directly sourced from fair trade indigenous cooperatives in southern Ethiopia. Exceptionally clean, floral, and vibrant.',
    stockAvailable: 18,
    brewGuide: {
      method: 'Pour Over (Hario V60) / Cold Drip',
      ratio: '1:16.5 (15g coffee to 250ml water in 3:15m)',
      temperature: '92°C / 198°F',
      grindRecommendation: 'Medium-Fine',
    },
  },
  {
    name: 'Espresso Roast Gold',
    subtitle: 'Limited release micro-lot selection',
    category: 'moca',
    price: 780,
    originalPrice: 890,
    rating: 4.9,
    reviewsCount: 63,
    image: '/images/product-espresso.jpg',
    isSale: true,
    saleLabel: 'Sale',
    tag: 'new_arrivals',
    roastLevel: 'Medium-Dark',
    tastingNotes: ['Dark Cocoa', 'Spiced Plum', 'Orange Zest'],
    origin: 'Guatemala Antigua',
    description:
      'Grown on the sunlit volcanic slopes of Mount Agua. Complex acidity balanced by heavy chocolate sweetness.',
    stockAvailable: 16,
    brewGuide: {
      method: 'Espresso / Chemex',
      ratio: '1:2.1 (18.5g in, 39g out)',
      temperature: '93°C / 200°F',
      grindRecommendation: 'Fine',
    },
  },
];

export async function seedProducts() {
  await connectDB();

  const count = await Product.countDocuments();
  if (count > 0) {
    console.log(`[Seed] Product catalogue already contains ${count} items. Skipping seed.`);
    await disconnectDB();
    return;
  }

  console.log(`[Seed] Database catalogue empty. Seeding ${SEED_COFFEE_PRODUCTS.length} specialty roasts...`);
  await Product.insertMany(SEED_COFFEE_PRODUCTS);
  console.log(`[Seed] Successfully seeded ${SEED_COFFEE_PRODUCTS.length} specialty coffee products!`);

  await disconnectDB();
}

if (process.argv[1]?.endsWith('seed-products.ts') || process.argv[1]?.endsWith('seed-products.js')) {
  seedProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error seeding products:', err);
      process.exit(1);
    });
}

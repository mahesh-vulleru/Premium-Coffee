export interface CoffeeProduct {
  id: string;
  name: string;
  subtitle?: string;
  category: 'cappuccino' | 'espresso' | 'moca' | 'latte' | 'americano' | 'cold_brew';
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  isSale?: boolean;
  saleLabel?: string;
  tag: 'new_arrivals' | 'best_sellers' | 'top_rates';
  roastLevel: 'Light' | 'Medium' | 'Medium-Dark' | 'Dark';
  tastingNotes: string[];
  origin: string;
  description: string;
  stockAvailable: number;
}

export type GrindOption = 'Whole Bean' | 'French Press' | 'Pour Over' | 'Espresso' | 'Cold Brew';
export type BagSize = '250g' | '500g' | '1kg';
export type SubscriptionFrequency = '2_weeks' | '3_weeks' | '4_weeks';

export interface CartItem {
  product: CoffeeProduct;
  quantity: number;
  grind: GrindOption;
  size: BagSize;
  frequency?: SubscriptionFrequency;
}

export const CATEGORIES = [
  { name: 'Mobiles', icon: '📱' },
  { name: 'Electronics', icon: '💻' },
  { name: 'Vehicles', icon: '🚗' },
  { name: 'Property', icon: '🏠' },
  { name: 'Furniture', icon: '🛋️' },
  { name: 'Fashion', icon: '👕' },
  { name: 'Books & Sports', icon: '📚' },
  { name: 'Pets', icon: '🐶' },
  { name: 'Services', icon: '🛠️' },
  { name: 'Other', icon: '📦' },
];

export const CONDITIONS = ['New', 'Like new', 'Good', 'Fair'];

export const categoryIcon = (name) => CATEGORIES.find((c) => c.name === name)?.icon || '📦';

// Test data with 100 different sizes for UI testing
export const generateTestProductWith100Sizes = () => {
  // Generate 100 different sizes with various formats
  const sizes = [];
  
  // Standard numeric sizes (1-50)
  for (let i = 1; i <= 50; i++) {
    sizes.push({
      size: i.toString(),
      quantity: Math.floor(Math.random() * 100) + 1, // Random quantity 1-100
      price: (15 + Math.random() * 10).toFixed(2) // Random price $15-25
    });
  }
  
  // Letter sizes (XS, S, M, L, XL, XXL, XXXL, etc.)
  const letterSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL', '6XL'];
  letterSizes.forEach(size => {
    sizes.push({
      size: size,
      quantity: Math.floor(Math.random() * 50) + 1,
      price: (18 + Math.random() * 12).toFixed(2)
    });
  });
  
  // Age-based sizes (2T, 3T, 4T, etc.)
  for (let i = 2; i <= 16; i++) {
    sizes.push({
      size: i <= 5 ? `${i}T` : `${i}Y`,
      quantity: Math.floor(Math.random() * 30) + 1,
      price: (12 + Math.random() * 8).toFixed(2)
    });
  }
  
  // European sizes (EU 32-50)
  for (let i = 32; i <= 50; i++) {
    sizes.push({
      size: `EU${i}`,
      quantity: Math.floor(Math.random() * 25) + 1,
      price: (20 + Math.random() * 15).toFixed(2)
    });
  }
  
  // UK sizes (UK 6-16)
  for (let i = 6; i <= 16; i++) {
    sizes.push({
      size: `UK${i}`,
      quantity: Math.floor(Math.random() * 20) + 1,
      price: (16 + Math.random() * 14).toFixed(2)
    });
  }
  
  // Ensure we have exactly 100 sizes
  const finalSizes = sizes.slice(0, 100);
  
  return {
    id: 'test-product-100-sizes',
    name: 'Test Uniform with 100 Sizes',
    type: 'UNIFORM',
    gender: 'UNISEX',
    level: 'ALL',
    basePrice: '20.00',
    category: 'School Uniform',
    creator: 'Test Admin',
    role: 'Inventory Manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [
      {
        id: 'variant-navy-100-sizes',
        uniformId: 'test-product-100-sizes',
        variant: 'Navy Blue',
        color: 'Navy Blue',
        price: '20.00',
        sizes: finalSizes,
        totalQuantity: finalSizes.reduce((sum, size) => sum + size.quantity, 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'variant-white-100-sizes',
        uniformId: 'test-product-100-sizes',
        variant: 'White',
        color: 'White',
        price: '18.00',
        sizes: finalSizes.map(size => ({
          ...size,
          quantity: Math.floor(Math.random() * 80) + 1 // Different quantities for white variant
        })),
        totalQuantity: finalSizes.reduce((sum, size) => sum + Math.floor(Math.random() * 80) + 1, 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'variant-grey-100-sizes',
        uniformId: 'test-product-100-sizes',
        variant: 'Grey',
        color: 'Grey',
        price: '22.00',
        sizes: finalSizes.map(size => ({
          ...size,
          quantity: Math.floor(Math.random() * 60) + 1 // Different quantities for grey variant
        })),
        totalQuantity: finalSizes.reduce((sum, size) => sum + Math.floor(Math.random() * 60) + 1, 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };
};

// Generate test data for smaller size sets for comparison
export const generateTestProductWithFewSizes = () => {
  const sizes = [
    { size: 'S', quantity: 25, price: '18.00' },
    { size: 'M', quantity: 30, price: '18.00' },
    { size: 'L', quantity: 20, price: '18.00' },
    { size: 'XL', quantity: 15, price: '18.00' },
    { size: 'XXL', quantity: 10, price: '18.00' }
  ];
  
  return {
    id: 'test-product-few-sizes',
    name: 'Test Uniform with Few Sizes',
    type: 'UNIFORM',
    gender: 'UNISEX',
    level: 'ALL',
    basePrice: '18.00',
    category: 'School Uniform',
    creator: 'Test Admin',
    role: 'Inventory Manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [
      {
        id: 'variant-navy-few-sizes',
        uniformId: 'test-product-few-sizes',
        variant: 'Navy Blue',
        color: 'Navy Blue',
        price: '18.00',
        sizes: sizes,
        totalQuantity: sizes.reduce((sum, size) => sum + size.quantity, 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };
};

export default {
  generateTestProductWith100Sizes,
  generateTestProductWithFewSizes
};

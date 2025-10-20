// Static data for the Monisha Inventory Management App

export const uniforms = [
  {
    id: '1',
    name: "Boys' Trousers",
    category: 'bottoms',
    gender: 'male',
    description: 'Navy blue school trousers for boys',
    image: 'https://via.placeholder.com/150x150/1f2937/ffffff?text=Boys+Trousers'
  },
  {
    id: '2',
    name: "Girls' Skirt",
    category: 'bottoms',
    gender: 'female',
    description: 'Pleated navy blue school skirt for girls',
    image: 'https://via.placeholder.com/150x150/1f2937/ffffff?text=Girls+Skirt'
  },
  {
    id: '3',
    name: "White Shirt",
    category: 'tops',
    gender: 'unisex',
    description: 'White cotton school shirt - unisex',
    image: 'https://via.placeholder.com/150x150/ffffff/1f2937?text=White+Shirt'
  },
  {
    id: '4',
    name: "School Blazer",
    category: 'outerwear',
    gender: 'unisex',
    description: 'Navy blue school blazer with school crest',
    image: 'https://via.placeholder.com/150x150/1f2937/ffffff?text=Blazer'
  },
  {
    id: '5',
    name: "School Tie",
    category: 'accessories',
    gender: 'unisex',
    description: 'School striped tie - navy and gold',
    image: 'https://via.placeholder.com/150x150/1f2937/ffd700?text=Tie'
  }
];

export const uniformVariants = [
  // Boys' Trousers variants
  { id: '1-1', uniformId: '1', size: 'XS', color: 'Navy Blue', price: 25.99 },
  { id: '1-2', uniformId: '1', size: 'S', color: 'Navy Blue', price: 27.99 },
  { id: '1-3', uniformId: '1', size: 'M', color: 'Navy Blue', price: 29.99 },
  { id: '1-4', uniformId: '1', size: 'L', color: 'Navy Blue', price: 31.99 },
  { id: '1-5', uniformId: '1', size: 'XL', color: 'Navy Blue', price: 33.99 },
  
  // Girls' Skirt variants
  { id: '2-1', uniformId: '2', size: 'XS', color: 'Navy Blue', price: 22.99 },
  { id: '2-2', uniformId: '2', size: 'S', color: 'Navy Blue', price: 24.99 },
  { id: '2-3', uniformId: '2', size: 'M', color: 'Navy Blue', price: 26.99 },
  { id: '2-4', uniformId: '2', size: 'L', color: 'Navy Blue', price: 28.99 },
  
  // White Shirt variants
  { id: '3-1', uniformId: '3', size: 'XS', color: 'White', price: 18.99 },
  { id: '3-2', uniformId: '3', size: 'S', color: 'White', price: 19.99 },
  { id: '3-3', uniformId: '3', size: 'M', color: 'White', price: 21.99 },
  { id: '3-4', uniformId: '3', size: 'L', color: 'White', price: 23.99 },
  { id: '3-5', uniformId: '3', size: 'XL', color: 'White', price: 25.99 },
  
  // School Blazer variants
  { id: '4-1', uniformId: '4', size: 'S', color: 'Navy Blue', price: 45.99 },
  { id: '4-2', uniformId: '4', size: 'M', color: 'Navy Blue', price: 49.99 },
  { id: '4-3', uniformId: '4', size: 'L', color: 'Navy Blue', price: 53.99 },
  { id: '4-4', uniformId: '4', size: 'XL', color: 'Navy Blue', price: 57.99 },
  
  // School Tie variants
  { id: '5-1', uniformId: '5', size: 'One Size', color: 'Navy/Gold', price: 12.99 }
];

export const batchInventory = [
  {
    id: 'batch-001',
    name: 'September 2024 Delivery',
    arrivalDate: '2024-09-01',
    supplier: 'SchoolWear Ltd',
    status: 'active',
    items: [
      { uniformId: '1', variantId: '1-2', quantity: 50, remainingQuantity: 35 },
      { uniformId: '1', variantId: '1-3', quantity: 75, remainingQuantity: 60 },
      { uniformId: '1', variantId: '1-4', quantity: 60, remainingQuantity: 45 },
      { uniformId: '2', variantId: '2-2', quantity: 40, remainingQuantity: 25 },
      { uniformId: '2', variantId: '2-3', quantity: 55, remainingQuantity: 40 },
      { uniformId: '3', variantId: '3-2', quantity: 100, remainingQuantity: 80 },
      { uniformId: '3', variantId: '3-3', quantity: 120, remainingQuantity: 95 }
    ]
  },
  {
    id: 'batch-002',
    name: 'October 2024 Delivery',
    arrivalDate: '2024-10-15',
    supplier: 'Uniform Express',
    status: 'active',
    items: [
      { uniformId: '4', variantId: '4-2', quantity: 30, remainingQuantity: 28 },
      { uniformId: '4', variantId: '4-3', quantity: 35, remainingQuantity: 32 },
      { uniformId: '5', variantId: '5-1', quantity: 200, remainingQuantity: 180 },
      { uniformId: '1', variantId: '1-1', quantity: 25, remainingQuantity: 20 }
    ]
  },
  {
    id: 'batch-003',
    name: 'November 2024 Delivery',
    arrivalDate: '2024-11-01',
    supplier: 'SchoolWear Ltd',
    status: 'pending',
    items: [
      { uniformId: '2', variantId: '2-1', quantity: 30, remainingQuantity: 30 },
      { uniformId: '3', variantId: '3-1', quantity: 50, remainingQuantity: 50 },
      { uniformId: '3', variantId: '3-4', quantity: 40, remainingQuantity: 40 }
    ]
  }
];

export const schools = [
  {
    id: 'school-001',
    name: 'Greenfield Primary School',
    contact: 'admin@greenfield.edu',
    phone: '+44 20 7946 0958',
    address: '123 Education Lane, London, SW1A 1AA',
    studentCount: 450,
    principalName: 'Mrs. Sarah Johnson'
  },
  {
    id: 'school-002',
    name: 'Riverside Secondary School',
    contact: 'office@riverside.edu',
    phone: '+44 20 7946 0959',
    address: '456 Learning Street, Manchester, M1 1AA',
    studentCount: 680,
    principalName: 'Mr. David Thompson'
  },
  {
    id: 'school-003',
    name: 'Oakwood Academy',
    contact: 'reception@oakwood.edu',
    phone: '+44 20 7946 0960',
    address: '789 Knowledge Road, Birmingham, B1 1AA',
    studentCount: 320,
    principalName: 'Dr. Emily Roberts'
  }
];

const ordersData = [
  {
    id: 'order-001',
    schoolId: 'school-001',
    orderDate: '2024-09-15',
    status: 'completed',
    totalAmount: 1250.75,
    items: [
      { uniformId: '1', variantId: '1-2', quantity: 15, unitPrice: 27.99 },
      { uniformId: '2', variantId: '2-2', quantity: 12, unitPrice: 24.99 },
      { uniformId: '3', variantId: '3-2', quantity: 20, unitPrice: 19.99 }
    ],
    paymentStatus: 'paid',
    deliveryDate: '2024-09-20'
  },
  {
    id: 'order-002',
    schoolId: 'school-002',
    orderDate: '2024-10-01',
    status: 'processing',
    totalAmount: 890.50,
    items: [
      { uniformId: '4', variantId: '4-2', quantity: 8, unitPrice: 49.99 },
      { uniformId: '5', variantId: '5-1', quantity: 25, unitPrice: 12.99 }
    ],
    paymentStatus: 'pending',
    deliveryDate: '2024-10-10'
  },
  {
    id: 'order-003',
    schoolId: 'school-003',
    orderDate: '2024-10-20',
    status: 'pending',
    totalAmount: 675.25,
    items: [
      { uniformId: '1', variantId: '1-3', quantity: 10, unitPrice: 29.99 },
      { uniformId: '3', variantId: '3-3', quantity: 15, unitPrice: 21.99 }
    ],
    paymentStatus: 'pending',
    deliveryDate: null
  }
];

export const orders = ordersData;

export const dashboardMetrics = {
  totalRevenue: 15750.80,
  pendingOrders: 3,
  completedOrders: 12,
  lowStockItems: 5,
  totalProducts: 15,
  activeBatches: 2,
  totalSchools: 3,
  monthlyGrowth: 12.5
};

// Utility functions for data manipulation
export const getUniformById = (id) => uniforms.find(uniform => uniform.id === id);

export const getVariantById = (id) => uniformVariants.find(variant => variant.id === id);

export const getVariantsByUniformId = (uniformId) => 
  uniformVariants.filter(variant => variant.uniformId === uniformId);

export const getBatchById = (id) => batchInventory.find(batch => batch.id === id);

export const getSchoolById = (id) => schools.find(school => school.id === id);

export const getOrderById = (id) => ordersData.find(order => order.id === id);

export const getOrdersBySchoolId = (schoolId) => 
  ordersData.filter(order => order.schoolId === schoolId);

export const getTotalStockForVariant = (variantId) => {
  return batchInventory.reduce((total, batch) => {
    const item = batch.items.find(item => item.variantId === variantId);
    return total + (item ? item.remainingQuantity : 0);
  }, 0);
};

export const getLowStockItems = (threshold = 10) => {
  const lowStockItems = [];
  uniformVariants.forEach(variant => {
    const totalStock = getTotalStockForVariant(variant.id);
    if (totalStock <= threshold && totalStock > 0) {
      lowStockItems.push({
        ...variant,
        uniform: getUniformById(variant.uniformId),
        totalStock
      });
    }
  });
  return lowStockItems;
};

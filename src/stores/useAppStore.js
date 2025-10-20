import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Data - Now using Firebase stores instead of static data
  uniforms: [],
  uniformVariants: [],
  batchInventory: [],
  schools: [],
  orders: [],
  dashboardMetrics: {},

  // Derived state selectors
  getLowStockItems: (threshold = 10) => {
    const { uniformVariants, batchInventory } = get();
    if (!uniformVariants || !batchInventory) return [];

    const lowStockItems = [];
    uniformVariants.forEach(variant => {
      const totalStock = batchInventory.reduce((total, batch) => {
        const item = batch.items.find(item => item.variantId === variant.id);
        return total + (item ? item.remainingQuantity : 0);
      }, 0);

      if (totalStock <= threshold && totalStock > 0) {
        lowStockItems.push({
          ...variant,
          uniform: uniforms.find(u => u.id === variant.uniformId),
          totalStock
        });
      }
    });
    return lowStockItems;
  },

  getPendingOrders: () => {
    const { orders } = get();
    return orders ? orders.filter(o => o.status === 'pending') : [];
  },

  getCompletedOrders: () => {
    const { orders } = get();
    return orders ? orders.filter(o => o.status === 'completed') : [];
  },

  getTotalRevenue: () => {
    const { orders } = get();
    if (!orders) return 0;
    return orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
  },

  // UI State
  loading: false,
  selectedTab: 'Dashboard',
  
  // Actions
  setLoading: (loading) => set({ loading }),
  setSelectedTab: (tab) => set({ selectedTab: tab }),

  // Batch Management
  addBatch: (batch) => set((state) => ({
    batchInventory: [...state.batchInventory, { ...batch, id: `batch-${Date.now()}` }]
  })),

  updateBatchQuantity: (batchId, variantId, newQuantity) => set((state) => ({
    batchInventory: state.batchInventory.map(batch => 
      batch.id === batchId 
        ? {
            ...batch,
            items: batch.items.map(item => 
              item.variantId === variantId 
                ? { ...item, remainingQuantity: newQuantity }
                : item
            )
          }
        : batch
    )
  })),

  // Order Management
  addOrder: (order) => set((state) => ({
    orders: [...state.orders, { ...order, id: `order-${Date.now()}` }]
  })),

  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    )
  })),

  // School Management
  addSchool: (school) => set((state) => ({
    schools: [...state.schools, { ...school, id: `school-${Date.now()}` }]
  })),

  updateSchool: (schoolId, updates) => set((state) => ({
    schools: state.schools.map(school => 
      school.id === schoolId ? { ...school, ...updates } : school
    )
  })),

  // Computed values
  getLowStockItems: (threshold = 10) => {
    const { uniformVariants, batchInventory, uniforms } = get();
    if (!uniformVariants || !batchInventory) return [];

    const lowStockItems = [];
    uniformVariants.forEach(variant => {
      const totalStock = batchInventory.reduce((total, batch) => {
        const item = batch.items.find(item => item.variantId === variant.id);
        return total + (item ? item.remainingQuantity : 0);
      }, 0);

      if (totalStock <= threshold && totalStock > 0) {
        lowStockItems.push({
          ...variant,
          uniform: uniforms.find(u => u.id === variant.uniformId),
          totalStock
        });
      }
    });
    return lowStockItems;
  },
  
  getTotalStockForVariant: (variantId) => {
    const { batchInventory } = get();
    if (!batchInventory) return 0;
    return batchInventory.reduce((total, batch) => {
      const item = batch.items.find(item => item.variantId === variantId);
      return total + (item ? item.remainingQuantity : 0);
    }, 0);
  },

  getMonthlyOrders: () => {
    const { orders } = get();
    if (!orders) return [];
    const currentMonth = new Date().getMonth();
    return orders.filter(order => {
      const orderMonth = new Date(order.orderDate).getMonth();
      return orderMonth === currentMonth;
    });
  }
}));

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart, StackedBarChart } from 'react-native-chart-kit';
import { useOrderStore } from '../../configuration/orderStore';
import { useBatchStore } from '../../configuration/batchStore';
import { useSchoolStore } from '../../configuration/schoolStore';
import { useInventoryStore } from '../../configuration/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { orders, fetchOrders } = useOrderStore();
  const { batches, fetchBatches } = useBatchStore();
  const { schools, fetchSchools } = useSchoolStore();
  const { uniforms, fetchUniforms } = useInventoryStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [inventoryData, setInventoryData] = useState([]);
  const [variantData, setVariantData] = useState([]);
  const [loading, setLoading] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    fetchOrders();
    fetchBatches();
    fetchSchools();
    fetchUniforms();
    fetchInventoryAnalytics();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchInventoryAnalytics = async () => {
    setLoading(true);
    try {
      const uniformsSnapshot = await getDocs(collection(db, 'uniforms'));
      let uniformsData = uniformsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Process inventory by type (matching web analytics)
      const typeCount = uniformsData.reduce((acc, item) => {
        const type = item.type || 'Uncategorized';
        let totalQuantity = 0;
        if (item.variants && item.variants.length > 0) {
          totalQuantity = item.variants.reduce((sum, variant) => {
            return sum + variant.sizes.reduce((s, size) => s + Number(size.quantity || 0), 0);
          }, 0);
        }
        acc[type] = (acc[type] || 0) + totalQuantity;
        return acc;
      }, {});

      // Process variants data
      const variantCount = uniformsData.reduce((acc, item) => {
        if (item.variants) {
          item.variants.forEach(variant => {
            const variantName = `${item.name} (${variant.variant})`;
            const variantQuantity = variant.sizes.reduce((s, size) => s + Number(size.quantity || 0), 0);
            if (variantQuantity > 0) {
              acc[variantName] = (acc[variantName] || 0) + variantQuantity;
            }
          });
        }
        return acc;
      }, {});

      const typeChartData = Object.keys(typeCount)
        .map(key => ({ name: key, count: typeCount[key] }))
        .filter(item => item.count > 0);

      const variantChartData = Object.keys(variantCount)
        .map(key => ({ name: key, count: variantCount[key] }))
        .filter(item => item.count > 0);
      
      setInventoryData(typeChartData);
      setVariantData(variantChartData);
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const periods = ['week', 'month', 'quarter', 'year'];
  const categories = [
    { id: 'overview', name: 'Overview', icon: 'analytics' },
    { id: 'inventory', name: 'Inventory', icon: 'cube' },
    { id: 'financials', name: 'Financials', icon: 'cash' },
    { id: 'schools', name: 'Schools', icon: 'school' }
  ];
  const years = [2022, 2023, 2024, 2025];

  // Generate sales data from real orders
  const getSalesData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    const salesByMonth = Array(6).fill(0);
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(monthNames[monthIndex]);
    }
    
    // Calculate sales from orders
    orders.forEach(order => {
      if (order.createdAt && order.totalAmount) {
        const orderDate = new Date(order.createdAt.seconds * 1000);
        const orderMonth = orderDate.getMonth();
        const monthsAgo = (currentMonth - orderMonth + 12) % 12;
        if (monthsAgo < 6) {
          const index = 5 - monthsAgo;
          salesByMonth[index] += order.totalAmount;
        }
      }
    });
    
    return {
      labels: last6Months,
      datasets: [{
        data: salesByMonth.length > 0 ? salesByMonth : [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 3
      }]
    };
  };

  // Size demand analytics (matching web)
  const getSizeDemandData = () => {
    const sizeData = {};
    
    batches.forEach(batch => {
      if (batch.items && Array.isArray(batch.items)) {
        batch.items.forEach(item => {
          if (item.sizes && Array.isArray(item.sizes)) {
            item.sizes.forEach(size => {
              const sizeKey = size.size;
              if (!sizeData[sizeKey]) {
                sizeData[sizeKey] = 0;
              }
              sizeData[sizeKey] += parseInt(size.quantity) || 0;
            });
          }
        });
      }
    });

    const sortedSizes = Object.entries(sizeData)
      .sort(([a], [b]) => {
        // Sort sizes numerically if possible
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      })
      .slice(0, 8); // Top 8 sizes

    return {
      labels: sortedSizes.map(([size]) => size),
      datasets: [{
        data: sortedSizes.map(([, quantity]) => quantity),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  // Inventory by school data
  const getInventoryBySchoolData = () => {
    const schoolInventory = {};
    
    schools.forEach(school => {
      schoolInventory[school.name] = {
        shirts: 0,
        trousers: 0,
        blazers: 0
      };
    });

    batches.forEach(batch => {
      if (batch.school && batch.items) {
        const schoolName = schools.find(s => s.id === batch.school)?.name || 'Unknown';
        if (schoolInventory[schoolName]) {
          batch.items.forEach(item => {
            const type = item.type?.toLowerCase() || 'other';
            const quantity = item.sizes?.reduce((sum, size) => sum + (parseInt(size.quantity) || 0), 0) || 0;
            
            if (type.includes('shirt') || type.includes('polo')) {
              schoolInventory[schoolName].shirts += quantity;
            } else if (type.includes('trouser') || type.includes('pant')) {
              schoolInventory[schoolName].trousers += quantity;
            } else if (type.includes('blazer') || type.includes('jacket')) {
              schoolInventory[schoolName].blazers += quantity;
            }
          });
        }
      }
    });

    const labels = Object.keys(schoolInventory).slice(0, 6);
    const shirtsData = labels.map(school => schoolInventory[school].shirts);
    const trousersData = labels.map(school => schoolInventory[school].trousers);
    const blazersData = labels.map(school => schoolInventory[school].blazers);

    return {
      labels,
      legend: ['Shirts', 'Trousers', 'Blazers'],
      data: [shirtsData, trousersData, blazersData],
      barColors: ['#6366f1', '#10b981', '#f59e0b']
    };
  };

  // Get inventory type data (matching web Reports.jsx)
  const getInventoryTypeData = () => {
    if (inventoryData.length === 0) return { labels: [], datasets: [{ data: [] }] };
    
    return {
      labels: inventoryData.map(item => item.name),
      datasets: [{
        data: inventoryData.map(item => item.count),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  // Get variant data for horizontal bar chart
  const getVariantBarData = () => {
    if (variantData.length === 0) return { labels: [], datasets: [{ data: [] }] };
    
    const topVariants = variantData.slice(0, 6); // Show top 6 variants
    return {
      labels: topVariants.map(item => item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name),
      datasets: [{
        data: topVariants.map(item => item.count),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const getOrderStatusData = () => {
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    
    return [
      {
        name: 'Completed',
        population: completed,
        color: '#10b981',
        legendFontColor: isDarkMode ? colors.foreground : '#374151',
        legendFontSize: 12,
      },
      {
        name: 'Pending',
        population: pending,
        color: '#f59e0b',
        legendFontColor: isDarkMode ? colors.foreground : '#374151',
        legendFontSize: 12,
      },
      {
        name: 'Processing',
        population: processing,
        color: '#ef4444',
        legendFontColor: isDarkMode ? colors.foreground : '#374151',
        legendFontSize: 12,
      }
    ];
  };

  const getTotalRevenue = () => {
    // Calculate total revenue from orders
    return orders.reduce((total, order) => total + (order.totalAmount || 0), 0);
  };

  const getLowStockItems = () => {
    // Calculate low stock items from batches
    const lowStockThreshold = 10;
    return batches.filter(batch => {
      if (batch.items && Array.isArray(batch.items)) {
        return batch.items.some(item => {
          if (item.sizes && Array.isArray(item.sizes)) {
            return item.sizes.some(size => (parseInt(size.quantity) || 0) < lowStockThreshold);
          }
          return false;
        });
      }
      return false;
    });
  };

  const getTopSellingProducts = () => {
    // Calculate from batches data
    const productSales = {};
    
    batches.forEach(batch => {
      if (batch.items && Array.isArray(batch.items)) {
        batch.items.forEach(item => {
          const name = item.name || batch.name;
          if (!productSales[name]) {
            productSales[name] = { name, totalQty: 0, totalValue: 0 };
          }
          
          if (item.sizes && Array.isArray(item.sizes)) {
            item.sizes.forEach(size => {
              const qty = parseInt(size.quantity) || 0;
              const price = parseFloat(size.price) || 0;
              productSales[name].totalQty += qty;
              productSales[name].totalValue += qty * price;
            });
          }
        });
      }
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        sales: item.totalQty,
        revenue: item.totalValue
      }));
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ef4444'
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 20, 
        paddingBottom: 20,
        backgroundColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: 'white',
              marginBottom: 2
            }}>
              Reports
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '400'
            }}>
              Business insights & analytics
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                padding: 8,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="download-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                padding: 8,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 24 }}>
        <View style={{ 
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4
        }}>
          <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground, marginBottom: 12 }}>📊 Analytics Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 20,
                    backgroundColor: selectedCategory === category.id ? colors.primary : colors.muted,
                    shadowColor: selectedCategory === category.id ? colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: selectedCategory === category.id ? 4 : 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    minWidth: 100
                  }}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={16} 
                    color={selectedCategory === category.id ? 'white' : colors.foreground} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{
                    fontWeight: '700',
                    fontSize: 14,
                    color: selectedCategory === category.id ? 'white' : colors.foreground
                  }}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Year Filter for certain categories */}
      {(selectedCategory === 'inventory' || selectedCategory === 'financials') && (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ 
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4
          }}>
            <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground, marginBottom: 12 }}>📅 Year Selection</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  onPress={() => setSelectedYear(year)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: selectedYear === year ? colors.primary : colors.muted,
                    shadowColor: selectedYear === year ? colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: selectedYear === year ? 4 : 0
                  }}
                >
                  <Text style={{
                    fontWeight: '700',
                    fontSize: 14,
                    color: selectedYear === year ? 'white' : colors.foreground
                  }}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Summary Cards */}
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View
              style={{ 
                backgroundColor: colors.card,
                borderRadius: 12, 
                padding: 16,
                minHeight: 110,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.05, 
                shadowRadius: 4, 
                elevation: 2
              }}
            >
              <Ionicons name="cash" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 2 }}>
                ${getTotalRevenue().toLocaleString()}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '500' }}>
                Revenue
              </Text>
            </View>
          </View>
          
          <View style={{ flex: 1, marginLeft: 8 }}>
            <View
              style={{ 
                backgroundColor: colors.card,
                borderRadius: 12, 
                padding: 16,
                minHeight: 110,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.05, 
                shadowRadius: 4, 
                elevation: 2
              }}
            >
              <Ionicons name="bag" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 2 }}>
                {orders.length}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '500' }}>
                Orders
              </Text>
            </View>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View
              style={{ 
                backgroundColor: colors.card,
                borderRadius: 12, 
                padding: 16,
                minHeight: 110,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.05, 
                shadowRadius: 4, 
                elevation: 2
              }}
            >
              <Ionicons name="cube" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 2 }}>
                {batches.length}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '500' }}>
                Products
              </Text>
            </View>
          </View>
          
          <View style={{ flex: 1, marginLeft: 8 }}>
            <View
              style={{ 
                backgroundColor: colors.card,
                borderRadius: 12, 
                padding: 16,
                minHeight: 110,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.05, 
                shadowRadius: 4, 
                elevation: 2
              }}
            >
              <Ionicons name="warning" size={24} color={colors.destructive} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 2 }}>
                {getLowStockItems().length}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '500' }}>
                Low Stock
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Dynamic Chart Content Based on Selected Category */}
      {selectedCategory === 'overview' && (
        <>
          {/* Sales Trend Chart */}
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4,
          overflow: 'hidden'
        }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground, marginBottom: 4 }}>Revenue Trend</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Last 6 months performance</Text>
          </View>
          <View style={{ padding: 16 }}>
            <LineChart
              data={getSalesData()}
              width={width - 72}
              height={200}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#6366f1'
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: colors.border,
                  strokeWidth: 1
                }
              }}
              bezier
              style={{ marginVertical: 8 }}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
            />
          </View>
          <View style={{ padding: 16, paddingTop: 0, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="trending-up" size={16} color="#10b981" />
            <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: isDarkMode ? '500' : '600', marginLeft: 6 }}>
              Based on real order data
            </Text>
          </View>
        </View>
      </Animated.View>

        {/* Order Status Distribution */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4,
          overflow: 'hidden'
        }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground, marginBottom: 4 }}>Order Distribution</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Current order status breakdown</Text>
          </View>
          <View style={{ padding: 16 }}>
            {getOrderStatusData().reduce((sum, item) => sum + item.population, 0) > 0 ? (
              <PieChart
                data={getOrderStatusData()}
                width={width - 72}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 40]}
                absolute
              />
            ) : (
              <View style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="pie-chart-outline" size={48} color="#d1d5db" />
                <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 14 }}>No order data available</Text>
              </View>
            )}
          </View>
          </View>
        </Animated.View>
        </>
      )}

      {/* Inventory Analytics */}
      {selectedCategory === 'inventory' && (
        <>
          {/* Inventory by Type Chart (matching web) */}
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 4,
              overflow: 'hidden'
            }}>
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground, marginBottom: 4 }}>Inventory by Type</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Current stock levels by uniform type</Text>
              </View>
              <View style={{ padding: 16 }}>
                {getInventoryTypeData().labels.length > 0 ? (
                  <BarChart
                    data={getInventoryTypeData()}
                    width={width - 72}
                    height={220}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: '#f3f4f6',
                        strokeWidth: 1
                      }
                    }}
                    style={{ marginVertical: 8 }}
                    showBarTops={false}
                    fromZero
                  />
                ) : (
                  <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                    <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 14 }}>No inventory data available</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Variant Distribution */}
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              overflow: 'hidden'
            }}>
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>Top Variants</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Inventory levels by product variants</Text>
              </View>
              <View style={{ padding: 16 }}>
                {getVariantBarData().labels.length > 0 ? (
                  <BarChart
                    data={getVariantBarData()}
                    width={width - 72}
                    height={220}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: '#f3f4f6',
                        strokeWidth: 1
                      }
                    }}
                    style={{ marginVertical: 8 }}
                    showBarTops={false}
                    fromZero
                  />
                ) : (
                  <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shirt-outline" size={48} color="#d1d5db" />
                    <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 14 }}>No variant data available</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Size Demand Pattern */}
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              overflow: 'hidden'
            }}>
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>Size Demand Pattern</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Most popular sizes in inventory</Text>
              </View>
              <View style={{ padding: 16 }}>
                <BarChart
                  data={getSizeDemandData()}
                  width={width - 72}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: '#f3f4f6',
                      strokeWidth: 1
                    }
                  }}
                  style={{ marginVertical: 8 }}
                  showBarTops={false}
                  fromZero
                />
              </View>
            </View>
          </Animated.View>
        </>
      )}

      {/* Financial Analytics */}
      {selectedCategory === 'financials' && (
        <>
          {/* Revenue Trend */}
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              overflow: 'hidden'
            }}>
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>Revenue Trend ({selectedYear})</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Monthly revenue performance</Text>
              </View>
              <View style={{ padding: 16 }}>
                <LineChart
                  data={getSalesData()}
                  width={width - 72}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: '#6366f1'
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: '#f3f4f6',
                      strokeWidth: 1
                    }
                  }}
                  bezier
                  style={{ marginVertical: 8 }}
                  withInnerLines={true}
                  withOuterLines={false}
                  withVerticalLines={false}
                />
              </View>
            </View>
          </Animated.View>

          {/* Top Products by Revenue */}
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          overflow: 'hidden'
        }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>Top Products</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Best selling items by revenue</Text>
          </View>
          <View style={{ padding: 16 }}>
            {getTopSellingProducts().length > 0 ? getTopSellingProducts().map((product, index) => (
              <View key={product.name} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                paddingVertical: 16, 
                borderBottomWidth: index < getTopSellingProducts().length - 1 ? 1 : 0, 
                borderBottomColor: '#f3f4f6' 
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      backgroundColor: colors.primary
                    }}
                  >
                    <Text style={{ color: colors.primaryForeground, fontWeight: '800', fontSize: 16 }}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 16, marginBottom: 2 }}>{product.name}</Text>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{product.sales} units sold</Text>
                  </View>
                </View>
                <Text style={{ fontWeight: '700', color: colors.foreground, fontSize: 15 }}>
                  ${product.revenue.toFixed(2)}
                </Text>
              </View>
            )) : (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 14 }}>No product data available</Text>
              </View>
            )}
          </View>
          </View>
        </Animated.View>
        </>
      )}

      {/* School Analytics */}
      {selectedCategory === 'schools' && (
        <>
          {/* Inventory by School */}
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              overflow: 'hidden'
            }}>
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>Inventory by School</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Stock distribution across schools</Text>
              </View>
              <View style={{ padding: 16 }}>
                {getInventoryBySchoolData().labels.length > 0 ? (
                  <StackedBarChart
                    data={getInventoryBySchoolData()}
                    width={width - 72}
                    height={220}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    }}
                    style={{ marginVertical: 8 }}
                  />
                ) : (
                  <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="school-outline" size={48} color="#d1d5db" />
                    <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 14 }}>No school inventory data</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* School Performance */}
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          overflow: 'hidden'
        }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>School Performance</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Revenue and order metrics by school</Text>
          </View>
          <View style={{ padding: 16 }}>
            {schools.length > 0 ? schools.map((school, index) => {
              const schoolOrders = orders.filter(o => o.schoolId === school.id);
              const totalValue = schoolOrders.reduce((sum, order) => sum + order.totalAmount, 0);
              
              return (
                <View key={school.id} style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  paddingVertical: 16, 
                  borderBottomWidth: index < schools.length - 1 ? 1 : 0, 
                  borderBottomColor: colors.border 
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 16, marginBottom: 4 }}>{school.name}</Text>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                      {schoolOrders.length} orders • {school.studentCount} students
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '800', color: colors.foreground, fontSize: 16, marginBottom: 4 }}>
                      ${totalValue.toFixed(2)}
                    </Text>
                    <View style={{ 
                      backgroundColor: colors.muted, 
                      borderRadius: 12, 
                      paddingHorizontal: 8, 
                      paddingVertical: 4 
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedForeground }}>
                        ${(totalValue / school.studentCount).toFixed(2)}/student
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }) : (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Ionicons name="school-outline" size={48} color="#d1d5db" />
                <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 14 }}>No school data available</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
        </>
      )}

      {/* Export Options - Show for all categories */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          overflow: 'hidden'
        }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>Export Reports</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Download data in various formats</Text>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e5e7eb'
              }}
            >
              <View style={{ 
                backgroundColor: '#6366f1',
                borderRadius: 10, 
                padding: 10, 
                marginRight: 14 
              }}>
                <Ionicons name="document-text" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 2 }}>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Report</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>PDF format</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e5e7eb'
              }}
            >
              <View style={{ 
                backgroundColor: '#10b981',
                borderRadius: 10, 
                padding: 10, 
                marginRight: 14 
              }}>
                <Ionicons name="list" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 2 }}>Inventory Report</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>CSV format</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e5e7eb'
              }}
            >
              <View style={{ 
                backgroundColor: '#f59e0b',
                borderRadius: 10, 
                padding: 10, 
                marginRight: 14 
              }}>
                <Ionicons name="school" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 2 }}>Financial Summary</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Excel format</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

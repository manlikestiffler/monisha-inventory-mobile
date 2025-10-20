import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart
} from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const chartWidth = width - 40; // Account for padding

const COLORS = {
  primary: ['#4ECDC4', '#45B7D1', '#96CEB4'],
  secondary: ['#FFD93D', '#FF6B6B', '#F38181'],
  accent: ['#6C63FF', '#8884d8', '#7158e2'],
  neutral: ['#4B4453', '#6D6875', '#8A817C']
};

const MobileAnalyticsHub = ({ products, orders, schools, batches, loading }) => {
  const [activeCategory, setActiveCategory] = useState('analytics');
  const [activeChart, setActiveChart] = useState('demand');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [chartData, setChartData] = useState({
    analytics: {
      demand: [],
      years: []
    },
    financials: {
      revenue: [],
      topProducts: []
    },
    schools: {
      inventoryPerSchool: [],
      ordersPerSchool: []
    }
  });

  // Chart configuration for mobile
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ef4444'
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(0,0,0,0.1)',
      strokeWidth: 1
    }
  };

  // Process data when props change
  useEffect(() => {
    if (loading) return;
    processData();
  }, [products, orders, schools, batches, loading]);

  const processData = () => {
    const newChartData = {
      analytics: { demand: [], years: [] },
      financials: { revenue: [], topProducts: [] },
      schools: { inventoryPerSchool: [], ordersPerSchool: [] }
    };

    processSizeDemandData(newChartData);
    processRevenueData(newChartData);
    processTopProductsData(newChartData);
    processInventoryBySchoolData(newChartData);
    processOrdersBySchoolData(newChartData);
    
    setChartData(newChartData);
  };

  const processSizeDemandData = (newChartData) => {
    // Get unique years from orders
    const years = [...new Set(orders.map(order => {
      const date = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt?.seconds * 1000);
      return date.getFullYear();
    }))].sort((a, b) => b - a);
    
    newChartData.analytics.years = years.map(year => year.toString());
    
    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      newChartData.analytics.years = [currentYear.toString()];
      years.push(currentYear);
    }
    
    if (!newChartData.analytics.years.includes(selectedYear)) {
      setSelectedYear(newChartData.analytics.years[0]);
    }
    
    // Process size demand for each year
    years.forEach(year => {
      const yearOrders = orders.filter(order => {
        const date = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt?.seconds * 1000);
        return date.getFullYear() === year;
      });
      
      const sizeCount = {};
      
      yearOrders.forEach(order => {
        order.items?.forEach(item => {
          if (item.size) {
            sizeCount[item.size] = (sizeCount[item.size] || 0) + (item.quantity || 1);
          }
        });
      });
      
      // Convert to chart format
      const sizeDemand = Object.entries(sizeCount).map(([size, totalSales]) => ({
        size,
        totalSales,
        color: totalSales > 150 ? '#4ECDC4' : totalSales > 75 ? '#FFD93D' : '#FF6B6B'
      }));
      
      const sizeOrder = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6 };
      sizeDemand.sort((a, b) => (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99));
      
      newChartData.analytics.demand[year] = sizeDemand;
    });
  };

  const processRevenueData = (newChartData) => {
    const monthlyRevenue = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => { monthlyRevenue[month] = 0; });
    
    const currentYear = new Date().getFullYear();
    
    orders.forEach(order => {
      const date = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt?.seconds * 1000);
      
      if (date.getFullYear() === currentYear) {
        const month = months[date.getMonth()];
        monthlyRevenue[month] += (order.totalAmount || 0);
      }
    });
    
    newChartData.financials.revenue = months.map(month => ({
      month,
      revenue: monthlyRevenue[month]
    }));
  };

  const processTopProductsData = (newChartData) => {
    const productSales = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        const productName = item.name || 'Unknown Product';
        productSales[productName] = (productSales[productName] || 0) + (item.quantity || 1);
      });
    });
    
    const topProducts = Object.entries(productSales)
      .map(([name, sales], index) => ({
        name,
        sales,
        color: COLORS.primary[index % COLORS.primary.length]
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    
    newChartData.financials.topProducts = topProducts;
  };

  const processInventoryBySchoolData = (newChartData) => {
    const schoolInventory = {};
    
    schools.forEach(school => {
      schoolInventory[school.id] = {
        name: school.name || 'Unknown School',
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      };
    });
    
    batches.forEach(batch => {
      if (!batch.schoolId || !schoolInventory[batch.schoolId]) return;
      
      batch.items?.forEach(item => {
        item.sizes?.forEach(size => {
          const quantity = size.quantity || 0;
          
          if (quantity === 0) {
            schoolInventory[batch.schoolId].outOfStock += 1;
          } else if (quantity < 10) {
            schoolInventory[batch.schoolId].lowStock += 1;
          } else {
            schoolInventory[batch.schoolId].inStock += 1;
          }
        });
      });
    });
    
    newChartData.schools.inventoryPerSchool = Object.values(schoolInventory)
      .filter(school => school.inStock > 0 || school.lowStock > 0 || school.outOfStock > 0)
      .sort((a, b) => {
        const totalA = a.inStock + a.lowStock + a.outOfStock;
        const totalB = b.inStock + b.lowStock + b.outOfStock;
        return totalB - totalA;
      })
      .slice(0, 5);
  };

  const processOrdersBySchoolData = (newChartData) => {
    const schoolOrders = {};
    
    schools.forEach(school => {
      schoolOrders[school.id] = {
        name: school.name || 'Unknown School',
        value: 0,
        color: COLORS.accent[0]
      };
    });
    
    orders.forEach(order => {
      if (order.schoolId && schoolOrders[order.schoolId]) {
        schoolOrders[order.schoolId].value += 1;
      }
    });
    
    newChartData.schools.ordersPerSchool = Object.values(schoolOrders)
      .filter(school => school.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((school, index) => ({
        ...school,
        color: COLORS.accent[index % COLORS.accent.length]
      }));
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    const newChartId = categoryConfig[category].charts[0].id;
    setActiveChart(newChartId);
  };

  const categoryConfig = {
    analytics: {
      name: 'Size Analytics',
      icon: 'bar-chart-outline',
      charts: [{ id: 'demand', name: 'Size Demand Pattern' }]
    },
    financials: {
      name: 'Financials',
      icon: 'trending-up-outline',
      charts: [
        { id: 'revenue', name: 'Revenue Trend' },
        { id: 'topProducts', name: 'Top Products' }
      ]
    },
    schools: {
      name: 'Schools',
      icon: 'school-outline',
      charts: [
        { id: 'inventoryPerSchool', name: 'Inventory by School' },
        { id: 'ordersPerSchool', name: 'Orders by School' }
      ]
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <Text style={{ fontSize: 24, color: '#ef4444' }}>⟳</Text>
          <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>Loading charts...</Text>
        </View>
      );
    }

    switch (activeChart) {
      case 'demand':
        const currentYearData = chartData.analytics.demand[selectedYear] || [];
        
        if (currentYearData.length === 0) {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>
                No size demand data available for {selectedYear}
              </Text>
            </View>
          );
        }

        const barData = {
          labels: currentYearData.map(item => item.size),
          datasets: [{
            data: currentYearData.map(item => item.totalSales)
          }]
        };

        return (
          <View style={{ alignItems: 'center' }}>
            <BarChart
              data={barData}
              width={chartWidth}
              height={240}
              chartConfig={chartConfig}
              style={{
                marginVertical: 0,
                borderRadius: 0,
              }}
              showValuesOnTopOfBars={true}
            />
          </View>
        );

      case 'revenue':
        const revenueData = chartData.financials.revenue;
        
        if (revenueData.length === 0 || revenueData.every(item => item.revenue === 0)) {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
                No revenue data available
              </Text>
            </View>
          );
        }

        const lineData = {
          labels: revenueData.map(item => item.month.substring(0, 3)),
          datasets: [{
            data: revenueData.map(item => item.revenue),
            color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
            strokeWidth: 3
          }]
        };

        return (
          <View style={{ alignItems: 'center' }}>
            <LineChart
              data={lineData}
              width={chartWidth}
              height={240}
              chartConfig={chartConfig}
              style={{
                marginVertical: 0,
                borderRadius: 0,
              }}
              bezier
            />
          </View>
        );

      case 'topProducts':
        const topProductsData = chartData.financials.topProducts;
        
        if (topProductsData.length === 0) {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
                No product sales data available
              </Text>
            </View>
          );
        }

        const productBarData = {
          labels: topProductsData.map(item => item.name.substring(0, 8) + '...'),
          datasets: [{
            data: topProductsData.map(item => item.sales)
          }]
        };

        return (
          <View style={{ alignItems: 'center' }}>
            <BarChart
              data={productBarData}
              width={chartWidth}
              height={240}
              chartConfig={chartConfig}
              style={{
                marginVertical: 0,
                borderRadius: 0,
              }}
              showValuesOnTopOfBars={true}
            />
          </View>
        );

      case 'ordersPerSchool':
        const ordersBySchoolData = chartData.schools.ordersPerSchool;
        
        if (ordersBySchoolData.length === 0) {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
                No orders by school data available
              </Text>
            </View>
          );
        }

        const pieData = ordersBySchoolData.map((item, index) => ({
          name: item.name,
          population: item.value,
          color: COLORS.accent[index % COLORS.accent.length],
          legendFontColor: '#374151',
          legendFontSize: 12,
        }));

        return (
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={pieData}
              width={chartWidth}
              height={240}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={{
                marginVertical: 0,
                borderRadius: 0,
              }}
            />
          </View>
        );

      case 'inventoryPerSchool':
        const inventoryBySchoolData = chartData.schools.inventoryPerSchool;
        
        if (inventoryBySchoolData.length === 0) {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
                No inventory by school data available
              </Text>
            </View>
          );
        }

        const stackedData = {
          labels: inventoryBySchoolData.map(item => item.name.substring(0, 8)),
          legend: ['In Stock', 'Low Stock', 'Out of Stock'],
          data: inventoryBySchoolData.map(item => [item.inStock, item.lowStock, item.outOfStock]),
          barColors: ['#4ECDC4', '#FFD93D', '#FF6B6B']
        };

        return (
          <View style={{ alignItems: 'center' }}>
            <StackedBarChart
              data={stackedData}
              width={chartWidth}
              height={240}
              chartConfig={chartConfig}
              style={{
                marginVertical: 0,
                borderRadius: 0,
              }}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Category Selector - Dropdown Style */}
      <View style={{ marginBottom: 20, paddingHorizontal: 4 }}>
        <TouchableOpacity
          onPress={() => {
            // Create a simple modal-like selection
            const categories = Object.keys(categoryConfig);
            const currentIndex = categories.indexOf(activeCategory);
            const nextIndex = (currentIndex + 1) % categories.length;
            handleCategoryChange(categories[nextIndex]);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#991b1b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={categoryConfig[activeCategory].icon} size={20} color="white" />
              <Text style={{
                color: 'white',
                fontWeight: '700',
                fontSize: 16
              }}>
                {categoryConfig[activeCategory].name}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Chart Selection - Grid Layout */}
      <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
        <View style={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          gap: 8,
          justifyContent: 'space-between'
        }}>
          {categoryConfig[activeCategory].charts.map((chart) => {
            const isActive = activeChart === chart.id;
            const chartCount = categoryConfig[activeCategory].charts.length;
            const buttonWidth = chartCount === 1 ? '100%' : '48%';
            
            return (
              <TouchableOpacity
                key={chart.id}
                onPress={() => setActiveChart(chart.id)}
                style={{
                  backgroundColor: isActive ? '#ef4444' : '#f3f4f6',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  shadowColor: isActive ? '#ef4444' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                  width: buttonWidth,
                  alignItems: 'center'
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: isActive ? 'white' : '#374151',
                  fontWeight: '600',
                  fontSize: 14,
                  textAlign: 'center'
                }}>
                  {chart.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Year Selector for Size Demand - Grid Layout */}
      {activeChart === 'demand' && activeCategory === 'analytics' && chartData.analytics.years.length > 0 && (
        <View style={{ paddingHorizontal: 4, marginBottom: 16 }}>
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: 8,
            justifyContent: 'center'
          }}>
            {chartData.analytics.years.map(year => {
              const isSelected = selectedYear === year;
              return (
                <TouchableOpacity
                  key={year}
                  onPress={() => setSelectedYear(year)}
                  style={{
                    backgroundColor: isSelected ? '#4facfe' : '#f3f4f6',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                    shadowColor: isSelected ? '#4facfe' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                    minWidth: 60,
                    alignItems: 'center'
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{
                    color: isSelected ? 'white' : '#374151',
                    fontWeight: '600',
                    fontSize: 14
                  }}>
                    {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Chart Container */}
      <View style={{
        backgroundColor: 'transparent',
        marginHorizontal: 0,
        borderRadius: 0,
        padding: 0,
        minHeight: 280
      }}>
        {renderChart()}
      </View>
    </View>
  );
};

export default MobileAnalyticsHub;

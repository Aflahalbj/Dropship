import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import BottomNavigation from "./components/BottomNavigation";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
} from "lucide-react-native";
import { getTransactions, getExpenses, getProducts } from "./utils/storage";
import { formatCurrency } from "./utils/helpers";

export default function ReportsScreen() {
  const [salesTotal, setSalesTotal] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [profit, setProfit] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Load transactions
    const transactions = await getTransactions();
    const completedTransactions = transactions.filter(
      (t) => t.status === "completed",
    );
    const totalSales = completedTransactions.reduce(
      (sum, t) => sum + t.total,
      0,
    );
    setSalesTotal(totalSales);

    // Load expenses
    const expenses = await getExpenses();
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    setExpensesTotal(totalExpenses);

    // Calculate profit
    setProfit(totalSales - totalExpenses);

    // Load products
    const products = await getProducts();
    setTotalProducts(products.length);
    setLowStockProducts(products.filter((p) => p.stock <= 5).length);

    setIsLoading(false);
  };

  const ReportCard = ({ title, value, icon, color }) => (
    <View className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${color}`}>
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-gray-500 text-sm">{title}</Text>
          <Text className="text-xl font-bold mt-1">{value}</Text>
        </View>
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${color.replace("border-", "bg-").replace("-500", "-100")}`}
        >
          {icon}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Screen
        options={{
          title: "Laporan",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      <ScrollView className="flex-1 p-4">
        {isLoading ? (
          <View className="items-center justify-center p-8">
            <Text className="text-gray-400">Memuat data laporan...</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View className="mb-6">
              <Text className="text-lg font-bold mb-3">Ringkasan Keuangan</Text>
              <View className="space-y-3">
                <ReportCard
                  title="Total Penjualan"
                  value={formatCurrency(salesTotal)}
                  icon={<TrendingUp size={20} color="#10B981" />}
                  color="border-green-500"
                />
                <ReportCard
                  title="Total Pengeluaran"
                  value={formatCurrency(expensesTotal)}
                  icon={<TrendingDown size={20} color="#EF4444" />}
                  color="border-red-500"
                />
                <ReportCard
                  title="Keuntungan"
                  value={formatCurrency(profit)}
                  icon={<DollarSign size={20} color="#3B82F6" />}
                  color="border-blue-500"
                />
              </View>
            </View>

            {/* Inventory Summary */}
            <View className="mb-6">
              <Text className="text-lg font-bold mb-3">
                Ringkasan Inventaris
              </Text>
              <View className="space-y-3">
                <ReportCard
                  title="Total Produk"
                  value={totalProducts.toString()}
                  icon={<Package size={20} color="#8B5CF6" />}
                  color="border-purple-500"
                />
                <ReportCard
                  title="Produk Stok Rendah"
                  value={lowStockProducts.toString()}
                  icon={<Package size={20} color="#F59E0B" />}
                  color="border-yellow-500"
                />
              </View>
            </View>

            {/* Chart Placeholder */}
            <View className="mb-6">
              <Text className="text-lg font-bold mb-3">Grafik Penjualan</Text>
              <View className="bg-white rounded-xl p-6 items-center justify-center h-60 shadow-sm">
                <BarChart3 size={48} color="#D1D5DB" />
                <Text className="text-gray-400 mt-4 text-center">
                  Grafik penjualan akan ditampilkan di sini
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeRoute="/reports" />
    </SafeAreaView>
  );
}

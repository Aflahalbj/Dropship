import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import BottomNavigation from "./components/BottomNavigation";
import {
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  DollarSign,
  Receipt,
} from "lucide-react-native";
import {
  getTransactions,
  getPurchases,
  getExpenses,
  Transaction,
  Purchase,
  Expense,
} from "./utils/storage";
import { formatCurrency, formatDateTime } from "./utils/helpers";

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "sales" | "purchases" | "expenses"
  >("sales");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    // Load sales transactions
    const salesData = await getTransactions();
    const sortedSalesData = [...salesData].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    setTransactions(sortedSalesData);

    // Load purchase transactions
    const purchasesData = await getPurchases();
    const sortedPurchasesData = [...purchasesData].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    setPurchases(sortedPurchasesData);

    // Load expense transactions
    const expensesData = await getExpenses();
    const sortedExpensesData = [...expensesData].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    setExpenses(sortedExpensesData);

    setIsLoading(false);
  };

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.customerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter purchases based on search query
  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      className="p-4 border-b border-gray-200 bg-white"
      onPress={() => router.push(`/receipt?transactionId=${item.id}`)}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="font-medium text-gray-800">{item.customerName}</Text>
          <Text className="text-gray-500 text-sm">
            {formatDateTime(item.date)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-bold text-gray-800">
            {formatCurrency(item.total)}
          </Text>
          <View className="flex-row items-center">
            <View
              className={`h-2 w-2 rounded-full mr-1 ${item.status === "completed" ? "bg-green-500" : item.status === "pending" ? "bg-yellow-500" : "bg-red-500"}`}
            />
            <Text
              className={`text-xs ${item.status === "completed" ? "text-green-500" : item.status === "pending" ? "text-yellow-500" : "text-red-500"}`}
            >
              {item.status === "completed"
                ? "Selesai"
                : item.status === "pending"
                  ? "Tertunda"
                  : "Dibatalkan"}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  // Render expense item
  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      className="p-4 border-b border-gray-200 bg-white"
      onPress={() => {}}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="font-medium text-gray-800">{item.category}</Text>
          <Text className="text-gray-500 text-sm">
            {formatDateTime(item.date)}
          </Text>
          <Text className="text-gray-600 text-sm">{item.description}</Text>
        </View>
        <View className="items-end">
          <Text className="font-bold text-red-500">
            -{formatCurrency(item.amount)}
          </Text>
        </View>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  // Render purchase item
  const renderPurchaseItem = ({ item }: { item: Purchase }) => (
    <TouchableOpacity
      className="p-4 border-b border-gray-200 bg-white"
      onPress={() => {}}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="font-medium text-gray-800">{item.supplierName}</Text>
          <Text className="text-gray-500 text-sm">
            {formatDateTime(item.date)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-bold text-red-500">
            -{formatCurrency(item.total)}
          </Text>
          <View className="flex-row items-center">
            <View
              className={`h-2 w-2 rounded-full mr-1 ${item.status === "completed" ? "bg-green-500" : item.status === "pending" ? "bg-yellow-500" : "bg-red-500"}`}
            />
            <Text
              className={`text-xs ${item.status === "completed" ? "text-green-500" : item.status === "pending" ? "text-yellow-500" : "text-red-500"}`}
            >
              {item.status === "completed"
                ? "Selesai"
                : item.status === "pending"
                  ? "Tertunda"
                  : "Dibatalkan"}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Screen
        options={{
          title: "Riwayat Transaksi",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      <View className="flex-1 p-4">
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 mb-4">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-2 px-3"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Buttons */}
        <View className="flex-row mb-4">
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center py-2 ${activeTab === "sales" ? "bg-blue-500" : "bg-gray-200"} rounded-l-lg`}
            onPress={() => setActiveTab("sales")}
          >
            <DollarSign
              size={16}
              color={activeTab === "sales" ? "#FFFFFF" : "#4B5563"}
            />
            <Text
              className={`ml-2 ${activeTab === "sales" ? "text-white font-medium" : "text-gray-700"}`}
            >
              Penjualan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center py-2 ${activeTab === "purchases" ? "bg-blue-500" : "bg-gray-200"}`}
            onPress={() => setActiveTab("purchases")}
          >
            <ShoppingCart
              size={16}
              color={activeTab === "purchases" ? "#FFFFFF" : "#4B5563"}
            />
            <Text
              className={`ml-2 ${activeTab === "purchases" ? "text-white font-medium" : "text-gray-700"}`}
            >
              Pembelian
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center py-2 ${activeTab === "expenses" ? "bg-blue-500" : "bg-gray-200"} rounded-r-lg`}
            onPress={() => setActiveTab("expenses")}
          >
            <Receipt
              size={16}
              color={activeTab === "expenses" ? "#FFFFFF" : "#4B5563"}
            />
            <Text
              className={`ml-2 ${activeTab === "expenses" ? "text-white font-medium" : "text-gray-700"}`}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Button */}
        <View className="flex-row mb-4">
          <TouchableOpacity className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mr-2">
            <Calendar size={16} color="#4B5563" />
            <Text className="ml-2 text-gray-700">Semua Tanggal</Text>
            <ChevronDown size={16} color="#4B5563" className="ml-1" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Text className="text-gray-700">Status: Semua</Text>
            <ChevronDown size={16} color="#4B5563" className="ml-1" />
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        {activeTab === "sales" ? (
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center p-8">
                <Text className="text-gray-400 mt-4 text-center">
                  {isLoading
                    ? "Memuat transaksi..."
                    : "Tidak ada transaksi penjualan ditemukan"}
                </Text>
              </View>
            }
          />
        ) : activeTab === "purchases" ? (
          <FlatList
            data={filteredPurchases}
            renderItem={renderPurchaseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center p-8">
                <Text className="text-gray-400 mt-4 text-center">
                  {isLoading
                    ? "Memuat transaksi..."
                    : "Tidak ada transaksi pembelian ditemukan"}
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredExpenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center p-8">
                <Text className="text-gray-400 mt-4 text-center">
                  {isLoading
                    ? "Memuat transaksi..."
                    : "Tidak ada pengeluaran ditemukan"}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeRoute="/transactions" />
    </SafeAreaView>
  );
}

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import BottomNavigation from "./components/BottomNavigation";
import { Search, Plus, X, Calendar } from "lucide-react-native";
import { getExpenses, addExpense, addCapital, Expense } from "./utils/storage";
import { formatCurrency, formatDate, generateId } from "./utils/helpers";

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState<Omit<Expense, "id">>({
    date: new Date().toISOString(),
    category: "",
    amount: 0,
    description: "",
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    const data = await getExpenses();
    setExpenses(data);
    setIsLoading(false);
  };

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleInputChange = (
    field: keyof Omit<Expense, "id">,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddExpense = async () => {
    if (!formData.category || formData.amount <= 0) {
      Alert.alert("Error", "Kategori dan jumlah pengeluaran harus diisi");
      return;
    }

    const newExpense: Expense = {
      id: generateId(),
      ...formData,
    };

    const success = await addExpense(newExpense);
    if (success) {
      // Record capital transaction (reduce capital for expense)
      await addCapital({
        id: generateId(),
        date: new Date().toISOString(),
        amount: newExpense.amount,
        type: "expense",
        description: `Pengeluaran: ${newExpense.category} - ${newExpense.description}`,
      });

      setExpenses([...expenses, newExpense]);
      setIsModalVisible(false);
      setFormData({
        date: new Date().toISOString(),
        category: "",
        amount: 0,
        description: "",
      });
    } else {
      Alert.alert("Error", "Gagal menyimpan pengeluaran");
    }
  };

  // Render expense item
  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View className="p-4 border-b border-gray-200 bg-white">
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="font-medium text-gray-800">{item.category}</Text>
          <Text className="text-gray-500 text-sm">{formatDate(item.date)}</Text>
          {item.description && (
            <Text className="text-gray-500 text-sm mt-1">
              {item.description}
            </Text>
          )}
        </View>
        <Text className="font-bold text-red-500">
          {formatCurrency(item.amount)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Screen
        options={{
          title: "Pengeluaran",
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => (
            <TouchableOpacity
              className="mr-4 p-2"
              onPress={() => setIsModalVisible(true)}
            >
              <Plus size={24} color="#3b82f6" />
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-1 p-4">
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 mb-4">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-2 px-3"
            placeholder="Cari pengeluaran..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Expenses List */}
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center p-8">
              <Text className="text-gray-400 mt-4 text-center">
                {isLoading
                  ? "Memuat pengeluaran..."
                  : "Tidak ada pengeluaran ditemukan"}
              </Text>
            </View>
          }
        />
      </View>

      {/* Add Expense Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 h-[60%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Tambah Pengeluaran</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="p-2"
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                {/* Kategori */}
                <View>
                  <Text className="text-gray-600 mb-1">Kategori*</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    placeholder="Masukkan kategori pengeluaran"
                    value={formData.category}
                    onChangeText={(text) => handleInputChange("category", text)}
                  />
                </View>

                {/* Jumlah */}
                <View>
                  <Text className="text-gray-600 mb-1">Jumlah*</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    placeholder="Masukkan jumlah pengeluaran"
                    keyboardType="numeric"
                    value={formData.amount.toString()}
                    onChangeText={(text) =>
                      handleInputChange("amount", parseInt(text) || 0)
                    }
                  />
                </View>

                {/* Tanggal */}
                <View>
                  <Text className="text-gray-600 mb-1">Tanggal</Text>
                  <TouchableOpacity className="border border-gray-300 rounded-lg p-3 bg-gray-50 flex-row items-center justify-between">
                    <Text>{formatDate(formData.date)}</Text>
                    <Calendar size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Deskripsi */}
                <View>
                  <Text className="text-gray-600 mb-1">
                    Deskripsi (opsional)
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    placeholder="Masukkan deskripsi pengeluaran"
                    multiline
                    numberOfLines={3}
                    value={formData.description}
                    onChangeText={(text) =>
                      handleInputChange("description", text)
                    }
                  />
                </View>
              </View>
            </ScrollView>

            {/* Tombol Simpan */}
            <TouchableOpacity
              className="py-4 rounded-lg bg-blue-500 mt-4"
              onPress={handleAddExpense}
            >
              <Text className="text-white text-center font-bold">
                Simpan Pengeluaran
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation activeRoute="/expenses" />
    </SafeAreaView>
  );
}

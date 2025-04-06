import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import BottomNavigation from "./components/BottomNavigation";
import { Search, Plus, Edit2, Trash2 } from "lucide-react-native";
import {
  getProducts,
  saveProducts,
  Product,
  addProduct,
  updateProduct,
  deleteProduct,
} from "./utils/storage";
import { formatCurrency } from "./utils/helpers";
import AddEditProductModal from "./components/AddEditProductModal";

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    const products = await getProducts();
    setInventory(products);
    setIsLoading(false);
  };

  // Filter inventory based on search query
  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier &&
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      "Hapus Produk",
      "Apakah Anda yakin ingin menghapus produk ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const success = await deleteProduct(productId);
            if (success) {
              setInventory(inventory.filter((item) => item.id !== productId));
            } else {
              Alert.alert("Error", "Gagal menghapus produk");
            }
          },
        },
      ],
    );
  };

  const handleSaveProduct = async (product: Product) => {
    let success;

    if (selectedProduct) {
      // Edit existing product
      success = await updateProduct(product);
      if (success) {
        setInventory(
          inventory.map((item) => (item.id === product.id ? product : item)),
        );
      }
    } else {
      // Add new product
      success = await addProduct(product);
      if (success) {
        setInventory([...inventory, product]);
      }
    }

    if (!success) {
      Alert.alert("Error", "Gagal menyimpan produk");
    }
  };

  // Render inventory item
  const renderInventoryItem = ({ item }: { item: Product }) => (
    <View className="flex-row items-center p-4 border-b border-gray-200">
      <View className="flex-1">
        <Text className="font-medium text-gray-800">{item.name}</Text>
        <Text className="text-gray-500 text-sm">{item.sku}</Text>
        <Text className="text-gray-500 text-sm">
          Supplier: {item.supplier || "-"}
        </Text>
        <Text className="text-gray-500 text-sm">
          Harga Supplier: {formatCurrency(item.supplierPrice || 0)}
        </Text>
      </View>
      <View className="items-end">
        <Text className="font-medium text-gray-800">
          {formatCurrency(item.price)}
        </Text>
        <Text
          className={`text-sm ${item.stock > 5 ? "text-green-600" : "text-red-600"}`}
        >
          Stok: {item.stock}
        </Text>
      </View>
      <View className="flex-row ml-4">
        <TouchableOpacity
          className="p-2 mr-2"
          onPress={() => handleEditProduct(item)}
        >
          <Edit2 size={18} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2"
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Screen
        options={{
          title: "Inventaris",
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => (
            <TouchableOpacity className="mr-4 p-2" onPress={handleAddProduct}>
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
            placeholder="Cari produk, SKU, atau supplier"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Inventory List */}
        <View className="flex-1 bg-white rounded-lg shadow-sm">
          <View className="flex-row justify-between items-center p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <Text className="font-medium text-gray-700">Produk</Text>
            <Text className="font-medium text-gray-700">Harga & Stok</Text>
            <Text className="font-medium text-gray-700 mr-4">Aksi</Text>
          </View>

          <FlatList
            data={filteredInventory}
            renderItem={renderInventoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center p-8">
                <Text className="text-gray-400 mt-4 text-center">
                  Tidak ada produk ditemukan
                </Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Add/Edit Product Modal */}
      <AddEditProductModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeRoute="/inventory" />
    </SafeAreaView>
  );
}

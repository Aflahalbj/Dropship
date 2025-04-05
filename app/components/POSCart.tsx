import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react-native";
import { CartItem } from "../utils/storage";
import { formatCurrency } from "../utils/helpers";

interface POSCartProps {
  items?: CartItem[];
  onUpdateQuantity?: (id: string, newQuantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onCheckout?: () => void;
  onClearCart?: () => void;
}

const POSCart = ({
  items = [],
  onUpdateQuantity = (id, newQuantity) =>
    console.log(`Update quantity: ${id} to ${newQuantity}`),
  onRemoveItem = (id) => console.log(`Remove item: ${id}`),
  onCheckout = () => console.log("Checkout"),
  onClearCart = () => console.log("Clear cart"),
}: POSCartProps) => {
  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleQuantityChange = (id: string, change: number) => {
    const item = items.find((item) => item.id === id);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity > 0 && newQuantity <= item.stock) {
      onUpdateQuantity(id, newQuantity);
    } else if (newQuantity <= 0) {
      Alert.alert(
        "Hapus Item",
        "Apakah Anda ingin menghapus item ini dari keranjang?",
        [
          { text: "Batal", style: "cancel" },
          { text: "Hapus", onPress: () => onRemoveItem(id) },
        ],
      );
    } else {
      Alert.alert("Batas Stok", `Hanya tersedia ${item.stock} item dalam stok`);
    }
  };

  return (
    <View className="bg-white rounded-xl shadow-md h-full">
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <ShoppingCart size={20} color="#4B5563" />
          <Text className="text-lg font-bold ml-2 text-gray-800">
            Keranjang ({items.length})
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClearCart}
          className="flex-row items-center py-1 px-3 bg-red-50 rounded-full"
        >
          <Trash2 size={16} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-1">Hapus</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View className="items-center justify-center p-8">
          <ShoppingCart size={48} color="#D1D5DB" />
          <Text className="text-gray-400 mt-4 text-center">
            Keranjang Anda kosong
          </Text>
          <Text className="text-gray-400 text-center">
            Tambahkan produk untuk memulai
          </Text>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1">
            {items.map((item) => (
              <View
                key={item.id}
                className="p-4 border-b border-gray-100 flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">{item.name}</Text>
                  <Text className="text-gray-500">
                    {formatCurrency(item.price)}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, -1)}
                    className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Minus size={16} color="#4B5563" />
                  </TouchableOpacity>

                  <TextInput
                    className="mx-3 min-w-8 text-center border-b border-gray-300"
                    value={item.quantity.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const newQuantity = parseInt(text);
                      if (!isNaN(newQuantity)) {
                        onUpdateQuantity(item.id, newQuantity);
                      }
                    }}
                  />

                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, 1)}
                    className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Plus size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>

                <Text className="ml-4 font-medium text-gray-800 min-w-20 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View className="p-4 border-t border-gray-200">
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="font-bold text-gray-800">
                {formatCurrency(subtotal)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onCheckout}
              className="bg-blue-600 py-3 rounded-lg items-center"
              accessibilityLabel="Bayar"
              accessibilityHint="Proses pembayaran untuk item di keranjang"
            >
              <Text className="text-white font-bold">Bayar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default POSCart;

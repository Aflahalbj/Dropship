import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import POSCart from "./components/POSCart";
import CheckoutModal from "./components/CheckoutModal";
import BottomNavigation from "./components/BottomNavigation";
import { CartItem } from "./utils/storage";

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] =
    React.useState(false);
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);

  // Parse cart items from params
  React.useEffect(() => {
    if (params.cartItems) {
      try {
        const items = JSON.parse(
          decodeURIComponent(params.cartItems as string),
        );
        setCartItems(items);
      } catch (error) {
        console.error("Error parsing cart items:", error);
      }
    }
  }, [params.cartItems]);

  // Update quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  // Remove item
  const removeItem = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Keranjang Kosong\nTambahkan produk ke keranjang terlebih dahulu");
      return;
    }
    setIsCheckoutModalVisible(true);
  };

  // Complete transaction
  const completeTransaction = (
    customerInfo,
    paymentMethod,
    paymentDetails,
    updatedItems,
  ) => {
    // Use updated items from checkout if available
    if (updatedItems) {
      setCartItems(updatedItems);
    }
    // Navigate back to home with transaction data
    router.push({
      pathname: "/",
      params: {
        completeTransaction: "true",
        customerInfo: JSON.stringify(customerInfo),
        paymentMethod,
        paymentDetails: JSON.stringify(paymentDetails || {}),
        cartItems: JSON.stringify(cartItems),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Screen
        options={{
          title: "Keranjang",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <TouchableOpacity
              className="ml-2 p-2"
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#3b82f6" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              className="mr-4 p-2"
              onPress={() => router.push("/")}
            >
              <Text className="text-blue-500 font-semibold">Hapus</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-1 p-4">
        <POSCart
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onCheckout={handleCheckout}
          onClearCart={clearCart}
        />
      </View>

      {/* Checkout Modal */}
      <CheckoutModal
        isVisible={isCheckoutModalVisible}
        cartItems={cartItems}
        activeRoute="/cart"
        onClose={() => setIsCheckoutModalVisible(false)}
        onConfirmPayment={completeTransaction}
        onPrint={(customerInfo, items, total, paymentMethod) => {
          // Handle print if needed
          console.log("Print requested");
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeRoute="/" />
    </SafeAreaView>
  );
}

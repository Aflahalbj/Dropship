import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import ProductSearch from "./components/ProductSearch";
import POSCart from "./components/POSCart";
import CheckoutModal from "./components/CheckoutModal";
import BottomNavigation from "./components/BottomNavigation";
import {
  getProducts,
  addTransaction,
  Product,
  CartItem,
  updateProduct,
  addCapital,
} from "./utils/storage";
import { generateId } from "./utils/helpers";

export default function POSScreen() {
  const router = useRouter();
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await getProducts();
    setProducts(data);
    setIsLoading(false);
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.id === product.id,
    );

    if (existingItemIndex !== -1) {
      // If product already exists in cart, update quantity
      const updatedCart = [...cartItems];
      const newQuantity = updatedCart[existingItemIndex].quantity + 1;

      // Check if we have enough stock
      if (newQuantity <= product.stock) {
        updatedCart[existingItemIndex].quantity = newQuantity;
        setCartItems(updatedCart);
      } else {
        Alert.alert(
          "Batas Stok",
          `Hanya tersedia ${product.stock} item dalam stok`,
        );
      }
    } else {
      // Add new product to cart
      if (product.stock > 0) {
        setCartItems([...cartItems, { ...product, quantity: 1 }]);
      } else {
        Alert.alert("Stok Habis", "Produk ini tidak tersedia dalam stok");
      }
    }
  };

  // Update product quantity in cart
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setCartItems(cartItems.filter((item) => item.id !== productId));
    } else {
      // Check if we have enough stock
      const product = products.find((p) => p.id === productId);
      if (product && newQuantity <= product.stock) {
        // Update quantity
        setCartItems(
          cartItems.map((item) =>
            item.id === productId ? { ...item, quantity: newQuantity } : item,
          ),
        );
      } else {
        Alert.alert(
          "Batas Stok",
          `Hanya tersedia ${product?.stock || 0} item dalam stok`,
        );
      }
    }
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert(
        "Keranjang Kosong",
        "Tambahkan produk ke keranjang terlebih dahulu",
      );
      return;
    }
    setIsCheckoutModalVisible(true);
  };

  // Complete transaction
  const completeTransaction = async (
    customerInfo,
    paymentMethod,
    paymentDetails,
  ) => {
    try {
      // Calculate total
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Create transaction object
      const transaction = {
        id: generateId(),
        date: new Date().toISOString(),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        items: cartItems,
        total,
        paymentMethod,
        status: "completed" as const,
        cashReceived: paymentDetails?.cashReceived || undefined,
        change: paymentDetails?.change || undefined,
      };

      // Save transaction to local storage
      const success = await addTransaction(transaction);

      if (success) {
        // Update product stock
        for (const item of cartItems) {
          const product = products.find((p) => p.id === item.id);
          if (product) {
            const updatedProduct = {
              ...product,
              stock: product.stock - item.quantity,
            };
            await updateProduct(updatedProduct);
          }
        }

        // Add to capital for all payment methods
        await addCapital({
          id: generateId(),
          date: new Date().toISOString(),
          amount: total,
          type: "sale",
          description: `Penjualan #${transaction.id} (${paymentMethod === "cash" ? "Tunai" : "Transfer"})`,
        });

        // Clear cart and close modal first
        clearCart();
        setIsCheckoutModalVisible(false);
        loadProducts(); // Reload products to get updated stock

        // Navigate to receipt screen
        router.push({
          pathname: "/receipt",
          params: { transactionId: transaction.id },
        });
      } else {
        Alert.alert("Error", "Gagal menyimpan transaksi");
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memproses transaksi");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Screen
        options={{
          title: "Sistem Kasir",
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => (
            <TouchableOpacity className="mr-4 p-2" onPress={clearCart}>
              <Text className="text-blue-500 font-semibold">Hapus</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-1 p-4">
        <View className="flex-1 flex-row">
          <View className={cartItems.length > 0 ? "flex-1 mr-2" : "flex-1"}>
            {/* Product Search Component */}
            <ProductSearch
              onProductSelect={addToCart}
              products={products}
              isLoading={isLoading}
            />
          </View>

          {cartItems.length > 0 && (
            <View className="w-[45%]">
              {/* Cart Component */}
              <POSCart
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={(id) => updateQuantity(id, 0)}
                onCheckout={handleCheckout}
                onClearCart={clearCart}
              />
            </View>
          )}
        </View>
      </View>

      {/* Checkout Modal */}
      <CheckoutModal
        isVisible={isCheckoutModalVisible}
        cartItems={cartItems}
        onClose={() => setIsCheckoutModalVisible(false)}
        onConfirmPayment={completeTransaction}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeRoute="/" />
    </SafeAreaView>
  );
}

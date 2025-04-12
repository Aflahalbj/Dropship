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
import { ShoppingCart } from "lucide-react-native";
import ProductSearch from "./components/ProductSearch";
import POSCart from "./components/POSCart";
import CheckoutModal from "./components/CheckoutModal";
import PrinterModal from "./components/PrinterModal";
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
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [printData, setPrintData] = useState<{
    customerInfo: any;
    items: CartItem[];
    total: number;
    paymentMethod: string;
  }>({ customerInfo: {}, items: [], total: 0, paymentMethod: "" });

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

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Complete transaction
  const completeTransaction = async (
    customerInfo,
    paymentMethod,
    paymentDetails,
    updatedItems,
  ) => {
    // Use updated items from checkout if available
    const itemsToUse = updatedItems || cartItems;
    // Calculate total based on updated items
    const total = itemsToUse.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    // Check if this is being called from a redirect
    const params = router.current?.params;
    if (params?.completeTransaction === "true") {
      try {
        // Use cart items from params
        const paramsCartItems = JSON.parse(params.cartItems as string);
        if (paramsCartItems && paramsCartItems.length > 0) {
          setCartItems(paramsCartItems);
        }

        // Use customer info from params
        if (params.customerInfo) {
          customerInfo = JSON.parse(params.customerInfo as string);
        }

        // Use payment details from params if available
        if (params.paymentDetails) {
          paymentDetails = JSON.parse(params.paymentDetails as string);
        }

        // Use payment method from params
        if (params.paymentMethod) {
          paymentMethod = params.paymentMethod;
        }
      } catch (error) {
        console.error("Error parsing transaction data from params:", error);
      }
    }
    try {
      // Total is already calculated above

      // Create transaction object
      const transaction = {
        id: generateId(),
        date: new Date().toISOString(),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        items: itemsToUse,
        total: itemsToUse.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        ), // Recalculate total with updated quantities
        paymentMethod,
        status: "completed" as const,
        cashReceived: paymentDetails?.cashReceived || undefined,
        change: paymentDetails?.change || undefined,
      };

      // Save transaction to local storage
      const success = await addTransaction(transaction);

      if (success) {
        // Update product stock with the correct quantity from updated cart items
        for (const item of transaction.items) {
          const product = products.find((p) => p.id === item.id);
          if (product) {
            const updatedProduct = {
              ...product,
              stock: Math.max(0, product.stock - item.quantity),
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
        <View className="flex-1">
          {/* Product Search Component */}
          <ProductSearch
            onProductSelect={addToCart}
            onCartIconPress={() => {
              if (cartItems.length === 0) {
                Alert.alert(
                  "Keranjang Kosong",
                  "Tambahkan produk ke keranjang terlebih dahulu",
                );
                return;
              }
              handleCheckout();
            }}
            products={products}
            isLoading={isLoading}
            cartItemCount={cartItems.length}
            activeRoute="/"
          />
        </View>
      </View>

      {/* Floating Cart Button removed */}

      {/* Checkout Modal */}
      <CheckoutModal
        isVisible={isCheckoutModalVisible}
        cartItems={cartItems}
        activeRoute="/"
        onClose={() => setIsCheckoutModalVisible(false)}
        onConfirmPayment={completeTransaction}
        onPrint={(customerInfo, items, total, paymentMethod) => {
          setIsPrintModalVisible(true);
          setPrintData({ customerInfo, items, total, paymentMethod });
        }}
      />

      {/* Printer Modal */}
      <PrinterModal
        isVisible={isPrintModalVisible}
        onClose={() => setIsPrintModalVisible(false)}
        customerInfo={printData.customerInfo}
        items={printData.items}
        total={printData.total}
        paymentMethod={printData.paymentMethod}
        isPurchase={false}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeRoute="/" />
    </SafeAreaView>
  );
}

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
import { ShoppingCart, Search, Plus, Printer } from "lucide-react-native";
import {
  getProducts,
  getPurchases,
  addPurchase,
  updateProduct,
  getCurrentCapital,
  addCapital,
  Product,
  Purchase,
  PurchaseItem,
  CartItem,
} from "./utils/storage";
import { generateId, formatCurrency } from "./utils/helpers";
import ProductSearch from "./components/ProductSearch";
import POSCart from "./components/POSCart";
import CheckoutModal from "./components/CheckoutModal";

export default function PurchasesScreen() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [currentCapital, setCurrentCapital] = useState(0);
  const [cartItems, setCartItems] = useState<PurchaseItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [printData, setPrintData] = useState<{
    customerInfo: any;
    items: CartItem[];
    total: number;
    paymentMethod: string;
  }>({ customerInfo: {}, items: [], total: 0, paymentMethod: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const purchasesData = await getPurchases();
    setPurchases(purchasesData);

    const productsData = await getProducts();
    setProducts(productsData);

    const capital = await getCurrentCapital();
    setCurrentCapital(capital);

    setIsLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Filter purchases based on search query
    // This will be implemented in the next phase
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.id === product.id,
    );

    if (existingItemIndex !== -1) {
      // If product already exists in cart, update quantity
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += 1;
      setCartItems(updatedCart);
    } else {
      // Add new product to cart
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.supplierPrice || product.price,
          quantity: 1,
          sku: product.sku,
          supplier: product.supplier || "",
        },
      ]);
    }
  };

  // Update product quantity in cart
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setCartItems(cartItems.filter((item) => item.id !== productId));
    } else {
      // Update quantity
      setCartItems(
        cartItems.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item,
        ),
      );
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

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Complete transaction
  const completePurchase = async (
    supplierInfo,
    paymentMethod,
    paymentDetails,
  ) => {
    try {
      const total = calculateTotal();

      // Check if there's enough capital
      if (total > currentCapital) {
        Alert.alert(
          "Modal Tidak Cukup",
          `Total pembelian (${formatCurrency(total)}) melebihi modal yang tersedia (${formatCurrency(currentCapital)})`,
        );
        return;
      }

      // Create purchase object
      const purchase: Purchase = {
        id: generateId(),
        date: new Date().toISOString(),
        supplierName: supplierInfo.name,
        items: cartItems,
        total,
        status: "completed",
      };

      // Add purchase to storage
      const success = await addPurchase(purchase);

      if (success) {
        // Update product stock
        for (const item of cartItems) {
          const product = products.find((p) => p.id === item.id);
          if (product) {
            const updatedProduct = {
              ...product,
              stock: product.stock + item.quantity,
            };
            await updateProduct(updatedProduct);
          }
        }

        // Record capital transaction (reduce capital for purchase)
        await addCapital({
          id: generateId(),
          date: new Date().toISOString(),
          amount: total,
          type: "purchase",
          description: `Pembelian dari ${supplierInfo.name}`,
        });

        // Reset form and reload data
        clearCart();
        setIsCheckoutModalVisible(false);
        loadData();

        Alert.alert("Sukses", "Pembelian berhasil ditambahkan");
      } else {
        Alert.alert("Error", "Gagal menambahkan pembelian");
      }
    } catch (error) {
      console.error("Error adding purchase:", error);
      Alert.alert("Error", "Terjadi kesalahan saat menambahkan pembelian");
    }
  };

  // Render purchase item
  const renderPurchaseItem = ({ item }: { item: Purchase }) => {
    return (
      <View className="bg-white p-4 rounded-lg shadow-sm mb-3 border border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="font-bold text-lg">{item.supplierName}</Text>
          <Text className="text-gray-500">
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>

        <View className="mt-2">
          <Text className="text-gray-600">
            {item.items.length} jenis produk | Total:{" "}
            {formatCurrency(item.total)}
          </Text>
        </View>

        <View className="mt-2 flex-row justify-between">
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-800">{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Screen
        options={{
          title: "Pembelian",
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => (
            <TouchableOpacity className="mr-4 p-2" onPress={clearCart}>
              <Text className="text-blue-500 font-semibold">Hapus</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Capital Info */}
      <View className="bg-white p-3 mx-4 mt-2 rounded-lg shadow-sm mb-2 border-l-4 border-blue-500">
        <Text className="text-gray-500 text-sm">Modal Tersedia</Text>
        <Text className="text-xl font-bold">
          {formatCurrency(currentCapital)}
        </Text>
      </View>

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
        activeRoute="/purchases"
        onClose={() => setIsCheckoutModalVisible(false)}
        onConfirmPayment={completePurchase}
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
        isPurchase={true}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeRoute="/purchases" />
    </SafeAreaView>
  );
}

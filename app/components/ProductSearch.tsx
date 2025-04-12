import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Search, X, ShoppingCart } from "lucide-react-native";
import { Product } from "../utils/storage";
import { formatCurrency } from "../utils/helpers";

interface ProductSearchProps {
  onProductSelect?: (product: Product) => void;
  onCartIconPress?: () => void;
  products?: Product[];
  isLoading?: boolean;
  cartItemCount?: number;
  activeRoute?: string;
}

const ProductSearch = ({
  onProductSelect = () => {},
  onCartIconPress = () => {},
  products = [],
  isLoading = false,
  cartItemCount = 0,
  activeRoute = "/",
}: ProductSearchProps) => {
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const floatingCartOpacity = new Animated.Value(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  useEffect(() => {
    setSearchResults(products);
  }, [products]);

  // Always show floating cart icon when cart has items
  useEffect(() => {
    if (cartItemCount > 0) {
      setShowFloatingCart(true);
      Animated.timing(floatingCartOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(floatingCartOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowFloatingCart(false));
    }
  }, [cartItemCount]);

  // Create custom event emitter for React Native
  useEffect(() => {
    const handleShowFloatingCart = () => {
      // Always show the FAB when this event is triggered, regardless of cart count
      showFloatingCartIcon();
    };

    const handleHideFloatingCart = () => {
      // When hiding the FAB, animate it out and then hide it completely
      Animated.timing(floatingCartOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowFloatingCart(false));
    };

    // Use React Native's DeviceEventEmitter instead of window events
    const { DeviceEventEmitter } = require("react-native");

    DeviceEventEmitter.addListener("showFloatingCart", handleShowFloatingCart);
    DeviceEventEmitter.addListener("hideFloatingCart", handleHideFloatingCart);

    return () => {
      DeviceEventEmitter.removeAllListeners("showFloatingCart");
      DeviceEventEmitter.removeAllListeners("hideFloatingCart");
    };
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setSearchResults(products);
    } else {
      const filteredResults = products.filter((product) =>
        product.name.toLowerCase().includes(text.toLowerCase()),
      );
      setSearchResults(filteredResults);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(products);
  };

  // Function to show floating cart icon
  const showFloatingCartIcon = () => {
    setShowFloatingCart(true);
    Animated.timing(floatingCartOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="w-[48%] mb-3 p-3 border border-gray-200 rounded-lg bg-white"
      onPress={() => {
        onProductSelect(item);
        // Always ensure FAB is fully visible
        if (cartItemCount > 0) {
          setShowFloatingCart(true);
          floatingCartOpacity.setValue(1);
        }
      }}
    >
      {item.image ? (
        <View className="aspect-square w-full rounded-md mb-2 overflow-hidden">
          <Image
            source={{ uri: item.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
      ) : (
        <View className="aspect-square w-full bg-gray-200 rounded-md mb-2 items-center justify-center">
          <Text className="text-gray-500 text-xs">Tidak ada gambar</Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="font-medium text-gray-800 mb-1">{item.name}</Text>
        <Text className="text-gray-500 text-xs mb-1">
          {item.sku} | Stok: {item.stock}
        </Text>
        <Text className="font-medium text-blue-600">
          {formatCurrency(
            activeRoute === "/purchases" ? item.supplierPrice || 0 : item.price,
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="bg-gray-50 w-full h-full">
      <View className="p-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Cari produk..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showFloatingCart && (
        <Animated.View
          style={{
            opacity: floatingCartOpacity,
            position: "absolute",
            bottom: 20,
            right: 20,
            zIndex: 100,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              // Navigate to cart page instead of checkout
              const { router } = require("expo-router");
              onCartIconPress();
            }}
            className="bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-md"
          >
            <ShoppingCart size={24} color="#FFFFFF" />
            {cartItemCount > 0 && (
              <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center p-5">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 text-center mt-2">
            Memuat produk...
          </Text>
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          className="flex-1 p-2"
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-5">
          <Text className="text-gray-500 text-center">
            Tidak ada produk ditemukan
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProductSearch;

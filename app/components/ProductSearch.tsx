import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { Product } from "../utils/storage";
import { formatCurrency } from "../utils/helpers";

interface ProductSearchProps {
  onProductSelect?: (product: Product) => void;
  products?: Product[];
  isLoading?: boolean;
}

const ProductSearch = ({
  onProductSelect = () => {},
  products = [],
  isLoading = false,
}: ProductSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  useEffect(() => {
    setSearchResults(products);
  }, [products]);

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

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="w-[48%] mb-3 p-3 border border-gray-200 rounded-lg bg-white"
      onPress={() => onProductSelect(item)}
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
          {formatCurrency(item.price)}
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

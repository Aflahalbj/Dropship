import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { X } from "lucide-react-native";
import { Product } from "../utils/storage";
import { generateId } from "../utils/helpers";

interface AddEditProductModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
}

const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isVisible,
  onClose,
  onSave,
  product = null,
}) => {
  const [formData, setFormData] = useState<Product>({
    id: "",
    name: "",
    sku: "",
    price: 0,
    stock: 0,
    supplier: "",
    image: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    sku?: string;
    price?: string;
    stock?: string;
  }>({});

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        id: generateId(),
        name: "",
        sku: "",
        price: 0,
        stock: 0,
        supplier: "",
        image: "",
      });
    }
  }, [product, isVisible]);

  const handleInputChange = (field: keyof Product, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      sku?: string;
      price?: string;
      stock?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama produk harus diisi";
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "SKU harus diisi";
    }

    if (formData.price <= 0) {
      newErrors.price = "Harga harus lebih dari 0";
    }

    if (formData.stock < 0) {
      newErrors.stock = "Stok tidak boleh negatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-5 h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">
              {product ? "Edit Produk" : "Tambah Produk"}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="space-y-4">
              {/* Nama Produk */}
              <View>
                <Text className="text-gray-600 mb-1">Nama Produk*</Text>
                <TextInput
                  className={`border rounded-lg p-3 bg-gray-50 ${errors.name ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Masukkan nama produk"
                  value={formData.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                />
                {errors.name && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.name}
                  </Text>
                )}
              </View>

              {/* SKU */}
              <View>
                <Text className="text-gray-600 mb-1">SKU*</Text>
                <TextInput
                  className={`border rounded-lg p-3 bg-gray-50 ${errors.sku ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Masukkan SKU produk"
                  value={formData.sku}
                  onChangeText={(text) => handleInputChange("sku", text)}
                />
                {errors.sku && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.sku}
                  </Text>
                )}
              </View>

              {/* Harga */}
              <View>
                <Text className="text-gray-600 mb-1">Harga*</Text>
                <TextInput
                  className={`border rounded-lg p-3 bg-gray-50 ${errors.price ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Masukkan harga produk"
                  keyboardType="numeric"
                  value={formData.price.toString()}
                  onChangeText={(text) =>
                    handleInputChange("price", parseInt(text) || 0)
                  }
                />
                {errors.price && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.price}
                  </Text>
                )}
              </View>

              {/* Stok */}
              <View>
                <Text className="text-gray-600 mb-1">Stok*</Text>
                <TextInput
                  className={`border rounded-lg p-3 bg-gray-50 ${errors.stock ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Masukkan jumlah stok"
                  keyboardType="numeric"
                  value={formData.stock.toString()}
                  onChangeText={(text) =>
                    handleInputChange("stock", parseInt(text) || 0)
                  }
                />
                {errors.stock && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.stock}
                  </Text>
                )}
              </View>

              {/* Supplier */}
              <View>
                <Text className="text-gray-600 mb-1">Supplier</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                  placeholder="Masukkan nama supplier"
                  value={formData.supplier}
                  onChangeText={(text) => handleInputChange("supplier", text)}
                />
              </View>

              {/* URL Gambar */}
              <View>
                <Text className="text-gray-600 mb-1">
                  URL Gambar (opsional)
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                  placeholder="Masukkan URL gambar produk"
                  value={formData.image}
                  onChangeText={(text) => handleInputChange("image", text)}
                />
              </View>
            </View>
          </ScrollView>

          {/* Tombol Simpan */}
          <TouchableOpacity
            className="py-4 rounded-lg bg-blue-500 mt-4"
            onPress={handleSave}
          >
            <Text className="text-white text-center font-bold">
              Simpan Produk
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AddEditProductModal;

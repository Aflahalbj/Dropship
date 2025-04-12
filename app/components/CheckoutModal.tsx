import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import {
  X,
  CreditCard,
  Wallet,
  DollarSign,
  Check,
  Plus,
  Minus,
} from "lucide-react-native";
import { CartItem, PurchaseItem } from "../utils/storage";
import { formatCurrency } from "../utils/helpers";

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

interface PaymentDetails {
  cashReceived?: number;
  change?: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface CheckoutModalProps {
  isVisible?: boolean;
  onClose?: () => void;
  cartItems?: CartItem[] | PurchaseItem[];
  activeRoute?: string;
  onConfirmPayment?: (
    customerInfo: CustomerInfo,
    paymentMethod: string,
    paymentDetails?: PaymentDetails,
    updatedItems?: CartItem[] | PurchaseItem[],
  ) => void;
  onPrint?: (
    customerInfo: CustomerInfo,
    items: CartItem[] | PurchaseItem[],
    total: number,
    paymentMethod: string,
  ) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isVisible = true,
  onClose = () => {},
  cartItems: initialCartItems = [],
  activeRoute = "/",
  onConfirmPayment = () => {},
  onPrint = () => {},
}) => {
  const [cartItems, setCartItems] = useState<CartItem[] | PurchaseItem[]>([]);

  // Initialize cart items when modal opens
  useEffect(() => {
    if (isVisible) {
      setCartItems([...initialCartItems]);
    }
  }, [isVisible, initialCartItems]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");

  const [cashReceived, setCashReceived] = useState<string>("");
  const [change, setChange] = useState<number>(0);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "cash",
      name: "Tunai",
      icon: <DollarSign size={20} color="#4CAF50" />,
    },
    {
      id: "transfer",
      name: "Transfer Bank",
      icon: <CreditCard size={20} color="#2196F3" />,
    },
  ];

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  // Handle quantity change for cart items
  const handleQuantityChange = (itemId: string, change: number) => {
    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + change;
          // Ensure quantity is at least 1
          if (
            activeRoute === "/" &&
            "stock" in item &&
            newQuantity > item.stock
          ) {
            Alert.alert(
              "Batas Stok",
              `Hanya tersedia ${item.stock} item dalam stok`,
            );
            return item;
          }
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      });
    });
  };

  const validateForm = () => {
    if (!customerInfo.name) {
      Alert.alert(
        "Error",
        activeRoute === "/purchases"
          ? "Nama supplier harus diisi"
          : "Nama pelanggan harus diisi",
      );
      return false;
    }

    if (!selectedPaymentMethod) {
      Alert.alert("Error", "Metode pembayaran harus dipilih");
      return false;
    }

    return true;
  };

  // Calculate change when cash received changes
  useEffect(() => {
    if (selectedPaymentMethod === "cash" && cashReceived) {
      const cashAmount = parseFloat(cashReceived);
      const total = calculateTotal();
      if (!isNaN(cashAmount) && cashAmount >= total) {
        setChange(cashAmount - total);
      } else {
        setChange(0);
      }
    } else {
      setChange(0);
    }
  }, [cashReceived, selectedPaymentMethod]);

  const handleConfirmPayment = () => {
    if (validateForm()) {
      try {
        // For cash payments, ensure sufficient cash is provided
        if (selectedPaymentMethod === "cash") {
          const cashAmount = parseFloat(cashReceived);
          const total = calculateTotal();

          if (isNaN(cashAmount)) {
            Alert.alert(
              "Error",
              "Jumlah uang yang diterima harus diisi dengan angka",
            );
            return;
          }

          if (cashAmount < total) {
            Alert.alert(
              "Error",
              "Jumlah uang yang diterima kurang dari total belanja",
            );
            return;
          }

          // Call the onConfirmPayment function with customer info, payment method, payment details, and updated cart items
          onConfirmPayment(
            customerInfo,
            selectedPaymentMethod,
            {
              cashReceived: cashAmount,
              change: change,
            },
            cartItems,
          );
        } else {
          // For non-cash payments, pass customer info, payment method, and updated cart items
          onConfirmPayment(
            customerInfo,
            selectedPaymentMethod,
            undefined,
            cartItems,
          );
        }

        // Reset form data after successful submission
        setCustomerInfo({
          name: "",
          phone: "",
          address: "",
        });
        setSelectedPaymentMethod("");
        setCashReceived("");
        setChange(0);
      } catch (error) {
        console.error("Error in handleConfirmPayment:", error);
        Alert.alert("Error", "Terjadi kesalahan saat memproses pembayaran");
      }
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-5 h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Pembayaran</Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  // Return to product screen with FAB visible
                  const { DeviceEventEmitter } = require("react-native");
                  DeviceEventEmitter.emit("showFloatingCart");
                }}
                className="p-2 mr-2"
              >
                <Text className="text-blue-500 font-medium">
                  Kembali ke Produk
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // Reset cart items to initial state first
                  setCartItems([]);
                  onClose();
                  // Hide FAB when closing with X button
                  const { DeviceEventEmitter } = require("react-native");
                  DeviceEventEmitter.emit("hideFloatingCart");
                }}
                className="p-2"
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Customer Information */}
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-3">
                {activeRoute === "/purchases"
                  ? "Informasi Supplier"
                  : "Informasi Pelanggan"}
              </Text>
              <View className="space-y-3">
                <View>
                  <Text className="text-gray-600 mb-1">Nama</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    placeholder={
                      activeRoute === "/purchases"
                        ? "Masukkan nama supplier"
                        : "Masukkan nama pelanggan"
                    }
                    value={customerInfo.name}
                    onChangeText={(text) => handleInputChange("name", text)}
                  />
                </View>
                <View>
                  <Text className="text-gray-600 mb-1">Telepon (Opsional)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    placeholder="Masukkan nomor telepon"
                    keyboardType="phone-pad"
                    value={customerInfo.phone}
                    onChangeText={(text) => handleInputChange("phone", text)}
                  />
                </View>
                <View>
                  <Text className="text-gray-600 mb-1">Alamat (Opsional)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    placeholder="Masukkan alamat"
                    multiline
                    numberOfLines={2}
                    value={customerInfo.address}
                    onChangeText={(text) => handleInputChange("address", text)}
                  />
                </View>
              </View>
            </View>

            {/* Payment Method */}
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-3">
                Metode Pembayaran
              </Text>
              <View className="space-y-2">
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    className={`flex-row items-center p-3 border rounded-lg ${selectedPaymentMethod === method.id ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                  >
                    <View className="mr-3">{method.icon}</View>
                    <Text className="flex-1">{method.name}</Text>
                    {selectedPaymentMethod === method.id && (
                      <Check size={20} color="#2196F3" />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Cash payment input field */}
                {selectedPaymentMethod === "cash" && (
                  <View className="mt-3 space-y-3">
                    <View>
                      <Text className="text-gray-600 mb-1">Uang Diterima</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                        placeholder="Masukkan jumlah uang"
                        keyboardType="numeric"
                        value={cashReceived}
                        onChangeText={setCashReceived}
                      />
                    </View>

                    {/* Quick amount buttons */}
                    <View className="flex-row flex-wrap justify-between">
                      <TouchableOpacity
                        className="bg-blue-100 rounded-lg py-2 px-3 mb-2 w-[48%]"
                        onPress={() => setCashReceived("1000000")}
                      >
                        <Text className="text-center text-blue-700">
                          Rp 1.000.000
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-blue-100 rounded-lg py-2 px-3 mb-2 w-[48%]"
                        onPress={() => setCashReceived("5000000")}
                      >
                        <Text className="text-center text-blue-700">
                          Rp 5.000.000
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-blue-100 rounded-lg py-2 px-3 mb-2 w-[48%]"
                        onPress={() => setCashReceived("10000000")}
                      >
                        <Text className="text-center text-blue-700">
                          Rp 10.000.000
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-blue-100 rounded-lg py-2 px-3 mb-2 w-[48%]"
                        onPress={() => setCashReceived("20000000")}
                      >
                        <Text className="text-center text-blue-700">
                          Rp 20.000.000
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-green-100 rounded-lg py-2 px-3 mb-2 w-full"
                        onPress={() =>
                          setCashReceived(calculateTotal().toString())
                        }
                      >
                        <Text className="text-center text-green-700">
                          Uang Pas
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {change > 0 && (
                      <View className="bg-green-50 p-3 rounded-lg">
                        <Text className="text-gray-600">Kembalian</Text>
                        <Text className="text-green-600 font-bold text-lg">
                          {formatCurrency(change)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Order Summary */}
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-3">
                Ringkasan Pesanan
              </Text>
              <View className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                {cartItems.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row justify-between py-2 border-b border-gray-200 items-center"
                  >
                    <View className="flex-1">
                      <Text className="font-medium">{item.name}</Text>
                      <Text className="text-gray-500 text-sm">
                        {formatCurrency(item.price)} per item
                      </Text>
                      {"stock" in item && (
                        <Text className="text-gray-500 text-sm">
                          Stok: {item.stock}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        // Remove item from cart
                        setCartItems(
                          cartItems.filter(
                            (cartItem) => cartItem.id !== item.id,
                          ),
                        );
                      }}
                      className="mr-2 bg-red-100 w-8 h-8 rounded-full items-center justify-center"
                    >
                      <X size={16} color="#EF4444" />
                    </TouchableOpacity>

                    <View className="flex-row items-center mr-3">
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(item.id, -1)}
                        className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center"
                      >
                        <Minus size={16} color="#4B5563" />
                      </TouchableOpacity>

                      <TextInput
                        className="mx-2 min-w-8 text-center border-b border-gray-300"
                        value={item.quantity.toString()}
                        keyboardType="numeric"
                        onChangeText={(text) => {
                          const newQuantity = parseInt(text);
                          if (!isNaN(newQuantity) && newQuantity > 0) {
                            if (
                              activeRoute === "/" &&
                              "stock" in item &&
                              newQuantity > item.stock
                            ) {
                              Alert.alert(
                                "Batas Stok",
                                `Hanya tersedia ${item.stock} item dalam stok`,
                              );
                              return;
                            }
                            // Directly set the new quantity instead of calculating a difference
                            setCartItems((prevItems) => {
                              return prevItems.map((prevItem) => {
                                if (prevItem.id === item.id) {
                                  return { ...prevItem, quantity: newQuantity };
                                }
                                return prevItem;
                              });
                            });
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

                    <Text className="font-medium text-gray-800 min-w-20 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
                <View className="flex-row justify-between py-3 mt-2">
                  <Text className="font-bold">Total</Text>
                  <Text className="font-bold">
                    {formatCurrency(calculateTotal())}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
          {/* Buttons */}
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className={`flex-1 py-4 rounded-lg ${!customerInfo.name || !selectedPaymentMethod ? "bg-gray-300" : "bg-blue-500"}`}
              disabled={!customerInfo.name || !selectedPaymentMethod}
              onPress={handleConfirmPayment}
              accessibilityLabel="Konfirmasi Pembayaran"
              accessibilityHint="Menyelesaikan proses pembayaran"
            >
              <Text className="text-white text-center font-bold">
                Konfirmasi Pembayaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 px-4 rounded-lg bg-green-500"
              onPress={() =>
                onPrint(
                  customerInfo,
                  cartItems,
                  calculateTotal(),
                  selectedPaymentMethod,
                )
              }
              disabled={!customerInfo.name}
              accessibilityLabel="Cetak Struk"
              accessibilityHint="Mencetak struk transaksi"
            >
              <Text className="text-white text-center font-bold">Cetak</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CheckoutModal;

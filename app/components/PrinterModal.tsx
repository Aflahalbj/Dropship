import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X, Printer, Bluetooth } from "lucide-react-native";
import { CartItem } from "../utils/storage";
import {
  requestBluetoothPermissions,
  scanForPrinters,
  printReceipt,
  PrinterDevice,
} from "../utils/printer";

interface PrinterModalProps {
  isVisible: boolean;
  onClose: () => void;
  customerInfo: any;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  isPurchase?: boolean;
}

const PrinterModal: React.FC<PrinterModalProps> = ({
  isVisible,
  onClose,
  customerInfo,
  items,
  total,
  paymentMethod,
  isPurchase = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterDevice | null>(
    null,
  );

  useEffect(() => {
    if (isVisible) {
      checkPermissionsAndScan();
    }
  }, [isVisible]);

  const checkPermissionsAndScan = async () => {
    const hasPermissions = await requestBluetoothPermissions();
    if (hasPermissions) {
      scanForDevices();
    } else {
      Alert.alert(
        "Izin Diperlukan",
        "Aplikasi memerlukan izin Bluetooth untuk menemukan printer.",
        [{ text: "OK", onPress: onClose }],
      );
    }
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    setPrinters([]);
    try {
      // For demo purposes, add some dummy printers
      setTimeout(() => {
        setPrinters([
          { id: "printer1", name: "Thermal Printer 58mm" },
          { id: "printer2", name: "POS Printer 80mm" },
          { id: "printer3", name: "Bluetooth Printer XP-380" },
        ]);
        setIsScanning(false);
      }, 2000);

      // Uncomment this when using real Bluetooth scanning
      // const devices = await scanForPrinters();
      // setPrinters(devices);
    } catch (error) {
      console.error("Error scanning for printers:", error);
      Alert.alert("Error", "Gagal memindai perangkat Bluetooth.");
      setIsScanning(false);
    }
  };

  const handlePrint = async (printer: PrinterDevice) => {
    setSelectedPrinter(printer);
    setIsPrinting(true);
    try {
      // Simulate printing delay
      setTimeout(async () => {
        const success = await printReceipt(
          printer.id,
          customerInfo,
          items,
          total,
          paymentMethod,
          isPurchase,
        );

        if (success) {
          Alert.alert("Sukses", "Struk berhasil dicetak.");
          onClose();
        } else {
          Alert.alert("Error", "Gagal mencetak struk. Silakan coba lagi.");
        }
        setIsPrinting(false);
        setSelectedPrinter(null);
      }, 2000);
    } catch (error) {
      console.error("Error printing:", error);
      Alert.alert("Error", "Terjadi kesalahan saat mencetak struk.");
      setIsPrinting(false);
      setSelectedPrinter(null);
    }
  };

  const renderPrinterItem = ({ item }: { item: PrinterDevice }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between p-4 border-b border-gray-200"
      onPress={() => handlePrint(item)}
      disabled={isPrinting}
    >
      <View className="flex-row items-center">
        <Printer size={20} color="#4B5563" />
        <Text className="ml-3 font-medium">{item.name}</Text>
      </View>
      {selectedPrinter?.id === item.id && isPrinting ? (
        <ActivityIndicator size="small" color="#3B82F6" />
      ) : (
        <Text className="text-blue-500">Pilih</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-5 h-[60%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Pilih Printer</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {isScanning ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-4 text-gray-600">Memindai printer...</Text>
            </View>
          ) : printers.length > 0 ? (
            <FlatList
              data={printers}
              renderItem={renderPrinterItem}
              keyExtractor={(item) => item.id}
              className="flex-1"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Bluetooth size={48} color="#D1D5DB" />
              <Text className="mt-4 text-gray-500 text-center">
                Tidak ada printer ditemukan
              </Text>
              <Text className="mt-2 text-gray-400 text-center px-4 mb-4">
                Pastikan printer Bluetooth Anda menyala dan dalam jangkauan
              </Text>
              <TouchableOpacity
                className="mt-2 bg-blue-500 py-2 px-4 rounded-lg"
                onPress={scanForDevices}
              >
                <Text className="text-white font-medium">Pindai Ulang</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PrinterModal;

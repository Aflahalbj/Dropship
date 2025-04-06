import { PermissionsAndroid, Platform } from "react-native";
import { CartItem } from "./storage";
import { formatCurrency, formatDateTime } from "./helpers";

// Create BleManager only when needed to avoid initialization errors
let bleManager: any = null;
const getBleManager = () => {
  if (!bleManager) {
    try {
      const { BleManager } = require("react-native-ble-plx");
      bleManager = new BleManager();
    } catch (error) {
      console.error("Failed to initialize BleManager:", error);
    }
  }
  return bleManager;
};

export interface PrinterDevice {
  id: string;
  name: string;
}

// Request Bluetooth permissions (Android only)
export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        granted["android.permission.BLUETOOTH_SCAN"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.BLUETOOTH_CONNECT"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.ACCESS_FINE_LOCATION"] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.error("Error requesting Bluetooth permissions:", err);
      return false;
    }
  }
  return true; // iOS doesn't need these permissions
};

// Scan for Bluetooth printers
export const scanForPrinters = async (): Promise<PrinterDevice[]> => {
  const devices: PrinterDevice[] = [];
  const manager = getBleManager();
  if (!manager) {
    return devices;
  }

  try {
    await manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Error scanning for devices:", error);
        manager.stopDeviceScan();
        return;
      }

      if (device && device.name) {
        // Filter for likely printer devices (you may need to adjust this filter)
        if (
          device.name.toLowerCase().includes("printer") ||
          device.name.toLowerCase().includes("pos") ||
          device.name.toLowerCase().includes("thermal")
        ) {
          devices.push({
            id: device.id,
            name: device.name,
          });
        }
      }
    });

    // Stop scan after 5 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
    }, 5000);

    return devices;
  } catch (error) {
    console.error("Error in scanForPrinters:", error);
    return [];
  }
};

// Connect to a printer and print receipt
export const printReceipt = async (
  deviceId: string,
  customerInfo: any,
  items: CartItem[],
  total: number,
  paymentMethod: string,
  isPurchase: boolean = false,
): Promise<boolean> => {
  // For demo purposes, simulate successful printing
  console.log("Printing receipt for:", customerInfo.name);
  console.log("Items:", items.length, "Total:", total);
  console.log("Payment method:", paymentMethod);
  console.log("Is purchase:", isPurchase);

  // Uncomment the code below when using a real printer
  /*
  const manager = getBleManager();
  if (!manager) {
    return false;
  }

  try {
    // Connect to the device
    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    // Find the right service and characteristic for printing
    // Note: These UUIDs may vary depending on the printer model
    const services = await device.services();
    let printCharacteristic = null;

    for (const service of services) {
      const characteristics = await service.characteristics();
      for (const characteristic of characteristics) {
        if (characteristic.isWritableWithoutResponse) {
          printCharacteristic = characteristic;
          break;
        }
      }
      if (printCharacteristic) break;
    }

    if (!printCharacteristic) {
      console.error("No writable characteristic found");
      await device.cancelConnection();
      return false;
    }

    // Generate receipt content
    const receiptContent = generateReceiptContent(
      customerInfo,
      items,
      total,
      paymentMethod,
      isPurchase,
    );

    // Send data to printer in chunks
    const chunks = chunkString(receiptContent, 20); // Split into 20-byte chunks
    for (const chunk of chunks) {
      await device.writeCharacteristicWithoutResponseForService(
        printCharacteristic.serviceUUID,
        printCharacteristic.uuid,
        Buffer.from(chunk).toString("base64"),
      );
    }

    // Disconnect from the device
    await device.cancelConnection();
    return true;
  } catch (error) {
    console.error("Error printing receipt:", error);
    return false;
  }
  */

  // For demo purposes, always return success
  return true;
};

// Helper function to generate receipt content
const generateReceiptContent = (
  customerInfo: any,
  items: CartItem[],
  total: number,
  paymentMethod: string,
  isPurchase: boolean,
): string => {
  let receipt = "\n";
  receipt += "      DROPSHIP POS SYSTEM      \n";
  receipt += "================================\n";
  receipt += `Tanggal: ${formatDateTime(new Date().toISOString())}\n`;
  receipt += `${isPurchase ? "Supplier" : "Pelanggan"}: ${customerInfo.name}\n`;
  if (customerInfo.phone) receipt += `Telepon: ${customerInfo.phone}\n`;
  if (customerInfo.address) receipt += `Alamat: ${customerInfo.address}\n`;
  receipt += "--------------------------------\n";
  receipt += "Item                       Jml\n";
  receipt += "--------------------------------\n";

  // Add items
  items.forEach((item) => {
    const itemName =
      item.name.length > 20 ? item.name.substring(0, 17) + "..." : item.name;
    const itemPrice = formatCurrency(item.price);
    const itemTotal = formatCurrency(item.price * item.quantity);
    receipt += `${itemName.padEnd(20)}\n`;
    receipt += `${itemPrice} x ${item.quantity.toString().padStart(2)}   ${itemTotal.padStart(10)}\n`;
  });

  receipt += "--------------------------------\n";
  receipt += `TOTAL:             ${formatCurrency(total).padStart(14)}\n`;
  receipt += `Metode Pembayaran: ${paymentMethod}\n`;
  receipt += "================================\n";
  receipt += "      Terima Kasih Telah      \n";
  receipt += `    ${isPurchase ? "Menjual Kepada Kami" : "Berbelanja Di Toko Kami"}    \n`;
  receipt += "================================\n\n\n";

  return receipt;
};

// Helper function to chunk string into smaller pieces
const chunkString = (str: string, length: number): string[] => {
  const chunks = [];
  for (let i = 0; i < str.length; i += length) {
    chunks.push(str.substring(i, i + length));
  }
  return chunks;
};

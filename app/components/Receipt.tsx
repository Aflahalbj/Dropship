import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Transaction } from "../utils/storage";
import { formatCurrency, formatDateTime } from "../utils/helpers";
import { Printer, Share2, Home } from "lucide-react-native";
import { WebView } from "react-native-webview";

interface ReceiptProps {
  transaction: Transaction;
}

const Receipt: React.FC<ReceiptProps> = ({ transaction }) => {
  const router = useRouter();
  const [isPrinting, setIsPrinting] = React.useState(false);

  // Generate HTML content for printing
  const generateReceiptHTML = () => {
    const itemsHTML = transaction.items
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${formatCurrency(item.price * item.quantity)}</td>
        </tr>
      `,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .receipt { max-width: 400px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .store-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .store-info { font-size: 14px; color: #666; margin-bottom: 3px; }
          .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 8px 4px; border-bottom: 1px solid #ddd; }
          td { padding: 8px 4px; border-bottom: 1px solid #eee; }
          .total-row { font-weight: bold; }
          .payment-info { margin-top: 20px; }
          .payment-method { margin-bottom: 10px; }
          .customer-info { margin-top: 20px; font-size: 14px; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="store-name">Toko Saya</div>
            <div class="store-info">Jl. Contoh No. 123, Jakarta</div>
            <div class="store-info">Telp: 021-1234567</div>
            <div class="store-info">${formatDateTime(transaction.date)}</div>
            <div class="store-info">No. Transaksi: ${transaction.id}</div>
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3">Total</td>
                <td>${formatCurrency(transaction.total)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="payment-info">
            <div class="payment-method">Metode Pembayaran: ${transaction.paymentMethod === "cash" ? "Tunai" : "Transfer Bank"}</div>
            ${
              transaction.paymentMethod === "cash"
                ? `
              <div>Tunai: ${formatCurrency(transaction.cashReceived || 0)}</div>
              <div>Kembalian: ${formatCurrency(transaction.change || 0)}</div>
            `
                : ""
            }
          </div>
          
          <div class="customer-info">
            <div>Pelanggan: ${transaction.customerName}</div>
            <div>Telepon: ${transaction.customerPhone}</div>
            ${transaction.customerAddress ? `<div>Alamat: ${transaction.customerAddress}</div>` : ""}
          </div>
          
          <div class="footer">
            <p>Terima kasih telah berbelanja di toko kami!</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('ready');
            }
          }
        </script>
      </body>
      </html>
    `;
  };

  // Share receipt as text
  const shareReceipt = async () => {
    try {
      const receiptText = `
        STRUK BELANJA
        Toko Saya
        ${formatDateTime(transaction.date)}
        No. Transaksi: ${transaction.id}
        
        ${transaction.items
          .map(
            (item) =>
              `${item.name} x${item.quantity} = ${formatCurrency(
                item.price * item.quantity,
              )}`,
          )
          .join("\n")}
        
        Total: ${formatCurrency(transaction.total)}
        
        Metode Pembayaran: ${transaction.paymentMethod === "cash" ? "Tunai" : "Transfer Bank"}
        ${transaction.paymentMethod === "cash" ? `Tunai: ${formatCurrency(transaction.cashReceived || 0)}\nKembalian: ${formatCurrency(transaction.change || 0)}` : ""}
        
        Pelanggan: ${transaction.customerName}
        Telepon: ${transaction.customerPhone}
        ${transaction.customerAddress ? `Alamat: ${transaction.customerAddress}` : ""}
        
        Terima kasih telah berbelanja di toko kami!
      `;

      await Share.share({
        message: receiptText,
        title: `Struk Belanja - ${transaction.id}`,
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
    }
  };

  // Handle print action
  const handlePrint = () => {
    setIsPrinting(true);
  };

  // Handle WebView message
  const handleWebViewMessage = (event) => {
    if (event.nativeEvent.data === "ready" && Platform.OS === "web") {
      // On web, we can use the browser's print functionality
      const webview = event.nativeEvent.target;
      if (webview && webview.contentWindow) {
        webview.contentWindow.print();
      }
    }
  };

  // Go back to home
  const goToHome = () => {
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-white">
      {isPrinting ? (
        <View className="flex-1">
          <WebView
            source={{ html: generateReceiptHTML() }}
            onMessage={handleWebViewMessage}
            onLoadEnd={() => {
              // On mobile, we can't directly print, but the WebView will show a printable version
              if (Platform.OS !== "web") {
                setTimeout(() => setIsPrinting(false), 1000);
              }
            }}
          />
        </View>
      ) : (
        <>
          <ScrollView className="flex-1 p-4">
            {/* Receipt Header */}
            <View className="items-center mb-6">
              <Text className="text-2xl font-bold mb-1">Toko Saya</Text>
              <Text className="text-gray-600 mb-1">
                Jl. Contoh No. 123, Jakarta
              </Text>
              <Text className="text-gray-600 mb-1">Telp: 021-1234567</Text>
              <Text className="text-gray-600 mb-1">
                {formatDateTime(transaction.date)}
              </Text>
              <Text className="text-gray-600">
                No. Transaksi: {transaction.id}
              </Text>
            </View>

            {/* Divider */}
            <View className="h-px bg-gray-200 my-4" />

            {/* Items */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2 pb-2 border-b border-gray-200">
                <Text className="font-semibold">Item</Text>
                <Text className="font-semibold">Qty</Text>
                <Text className="font-semibold">Harga</Text>
                <Text className="font-semibold">Subtotal</Text>
              </View>

              {transaction.items.map((item, index) => (
                <View
                  key={index}
                  className="flex-row justify-between py-2 border-b border-gray-100"
                >
                  <Text className="flex-1">{item.name}</Text>
                  <Text className="w-10 text-center">{item.quantity}</Text>
                  <Text className="w-24 text-right">
                    {formatCurrency(item.price)}
                  </Text>
                  <Text className="w-24 text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              ))}

              <View className="flex-row justify-between py-3 mt-2">
                <Text className="font-bold">Total</Text>
                <Text className="font-bold">
                  {formatCurrency(transaction.total)}
                </Text>
              </View>
            </View>

            {/* Payment Info */}
            <View className="mb-4 p-3 bg-gray-50 rounded-lg">
              <Text className="font-semibold mb-2">Informasi Pembayaran</Text>
              <Text>
                Metode Pembayaran:{" "}
                {transaction.paymentMethod === "cash"
                  ? "Tunai"
                  : "Transfer Bank"}
              </Text>
              {transaction.paymentMethod === "cash" && (
                <>
                  <Text>
                    Tunai: {formatCurrency(transaction.cashReceived || 0)}
                  </Text>
                  <Text>
                    Kembalian: {formatCurrency(transaction.change || 0)}
                  </Text>
                </>
              )}
            </View>

            {/* Customer Info */}
            <View className="mb-4 p-3 bg-gray-50 rounded-lg">
              <Text className="font-semibold mb-2">Informasi Pelanggan</Text>
              <Text>Nama: {transaction.customerName}</Text>
              <Text>Telepon: {transaction.customerPhone}</Text>
              {transaction.customerAddress && (
                <Text>Alamat: {transaction.customerAddress}</Text>
              )}
            </View>

            {/* Footer */}
            <View className="items-center my-6">
              <Text className="text-gray-500">
                Terima kasih telah berbelanja di toko kami!
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row justify-around p-4 border-t border-gray-200">
            <TouchableOpacity
              className="items-center"
              onPress={handlePrint}
              accessibilityLabel="Cetak Struk"
              accessibilityHint="Mencetak struk belanja"
            >
              <Printer size={24} color="#4B5563" />
              <Text className="mt-1 text-gray-600">Cetak</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center"
              onPress={shareReceipt}
              accessibilityLabel="Bagikan Struk"
              accessibilityHint="Membagikan struk belanja"
            >
              <Share2 size={24} color="#4B5563" />
              <Text className="mt-1 text-gray-600">Bagikan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center"
              onPress={goToHome}
              accessibilityLabel="Kembali ke Beranda"
              accessibilityHint="Kembali ke halaman beranda"
            >
              <Home size={24} color="#4B5563" />
              <Text className="mt-1 text-gray-600">Beranda</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default Receipt;

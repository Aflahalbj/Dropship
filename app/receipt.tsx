import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import Receipt from "./components/Receipt";
import { getTransactions, Transaction } from "./utils/storage";

export default function ReceiptScreen() {
  const params = useLocalSearchParams();
  const transactionId = params.transactionId as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransaction = async () => {
      if (!transactionId) return;

      setIsLoading(true);
      try {
        const transactions = await getTransactions();
        const foundTransaction = transactions.find(
          (t) => t.id === transactionId,
        );

        if (foundTransaction) {
          setTransaction(foundTransaction);
        }
      } catch (error) {
        console.error("Error loading transaction:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransaction();
  }, [transactionId]);

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: "Struk Belanja",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-2 text-gray-600">Memuat struk...</Text>
        </View>
      ) : transaction ? (
        <Receipt transaction={transaction} />
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-lg text-center text-gray-600">
            Transaksi tidak ditemukan atau telah dihapus.
          </Text>
        </View>
      )}
    </View>
  );
}

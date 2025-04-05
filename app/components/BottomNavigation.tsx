import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  Home,
  Package,
  BarChart3,
  DollarSign,
  ClipboardList,
  ShoppingCart,
} from "lucide-react-native";

interface BottomNavigationProps {
  activeRoute?: string;
}

export default function BottomNavigation({
  activeRoute = "/",
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentRoute = activeRoute || pathname;

  const navigationItems = [
    { name: "Kasir", icon: Home, route: "/" },
    { name: "Inventaris", icon: Package, route: "/inventory" },
    { name: "Transaksi", icon: ClipboardList, route: "/transactions" },
    { name: "Pembelian", icon: ShoppingCart, route: "/purchases" },
    { name: "Pengeluaran", icon: DollarSign, route: "/expenses" },
    { name: "Laporan", icon: BarChart3, route: "/reports" },
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <View className="bg-white border-t border-gray-200 h-[70px] flex-row justify-around items-center shadow-sm">
      {navigationItems.map((item) => {
        const isActive = currentRoute === item.route;
        return (
          <TouchableOpacity
            key={item.name}
            className={`items-center justify-center w-16 py-1 ${isActive ? "border-t-2 border-blue-500" : ""}`}
            onPress={() => handleNavigation(item.route)}
          >
            <item.icon
              size={24}
              color={isActive ? "#3b82f6" : "#6b7280"}
              strokeWidth={2}
            />
            <Text
              className={`text-xs mt-1 ${isActive ? "text-blue-500 font-medium" : "text-gray-500"}`}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

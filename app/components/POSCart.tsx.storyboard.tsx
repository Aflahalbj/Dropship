import POSCart from "../components/POSCart";
import { View } from "react-native";

export default function POSCartStoryboard() {
  const dummyItems = [
    {
      id: "1",
      name: "Kemeja Putih",
      price: 150000,
      quantity: 2,
      stock: 25,
      image:
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&q=80",
    },
    {
      id: "2",
      name: "Celana Jeans",
      price: 299000,
      quantity: 1,
      stock: 15,
      image:
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80",
    },
  ];

  return (
    <View className="bg-white p-4 flex-1">
      <POSCart
        items={dummyItems}
        onUpdateQuantity={(id, qty) => console.log(`Update ${id} to ${qty}`)}
        onRemoveItem={(id) => console.log(`Remove ${id}`)}
        onCheckout={() => console.log("Checkout")}
        onClearCart={() => console.log("Clear cart")}
      />
    </View>
  );
}

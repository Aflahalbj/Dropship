import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipe data untuk produk
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  supplier: string;
  image?: string;
}

// Tipe data untuk item keranjang
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
}

// Tipe data untuk transaksi
export interface Transaction {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  status: "completed" | "pending" | "cancelled";
  cashReceived?: number;
  change?: number;
}

// Tipe data untuk pengeluaran
export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

// Tipe data untuk pembelian
export interface Purchase {
  id: string;
  date: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  status: "completed" | "pending" | "cancelled";
}

// Tipe data untuk item pembelian
export interface PurchaseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  supplier: string;
}

// Tipe data untuk modal
export interface Capital {
  id: string;
  date: string;
  amount: number;
  type: "initial" | "addition" | "withdrawal" | "sale" | "purchase" | "expense";
  description: string;
}

// Kunci penyimpanan
const STORAGE_KEYS = {
  PRODUCTS: "pos_products",
  TRANSACTIONS: "pos_transactions",
  EXPENSES: "pos_expenses",
  PURCHASES: "pos_purchases",
  CAPITAL: "pos_capital",
};

// Fungsi untuk menyimpan data
const storeData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (e) {
    console.error("Error storing data:", e);
    return false;
  }
};

// Fungsi untuk mengambil data
const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Error retrieving data:", e);
    return null;
  }
};

// Produk
export const getProducts = async (): Promise<Product[]> => {
  const products = await getData(STORAGE_KEYS.PRODUCTS);
  return products || [];
};

export const saveProducts = async (products: Product[]): Promise<boolean> => {
  return storeData(STORAGE_KEYS.PRODUCTS, products);
};

export const addProduct = async (product: Product): Promise<boolean> => {
  const products = await getProducts();
  products.push(product);
  return saveProducts(products);
};

export const updateProduct = async (product: Product): Promise<boolean> => {
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index !== -1) {
    products[index] = product;
    return saveProducts(products);
  }
  return false;
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  const products = await getProducts();
  const filteredProducts = products.filter((p) => p.id !== productId);
  return saveProducts(filteredProducts);
};

// Transaksi
export const getTransactions = async (): Promise<Transaction[]> => {
  const transactions = await getData(STORAGE_KEYS.TRANSACTIONS);
  return transactions || [];
};

export const saveTransactions = async (
  transactions: Transaction[],
): Promise<boolean> => {
  return storeData(STORAGE_KEYS.TRANSACTIONS, transactions);
};

export const addTransaction = async (
  transaction: Transaction,
): Promise<boolean> => {
  const transactions = await getTransactions();
  transactions.push(transaction);
  return saveTransactions(transactions);
};

// Pengeluaran
export const getExpenses = async (): Promise<Expense[]> => {
  const expenses = await getData(STORAGE_KEYS.EXPENSES);
  return expenses || [];
};

export const saveExpenses = async (expenses: Expense[]): Promise<boolean> => {
  return storeData(STORAGE_KEYS.EXPENSES, expenses);
};

export const addExpense = async (expense: Expense): Promise<boolean> => {
  const expenses = await getExpenses();
  expenses.push(expense);
  return saveExpenses(expenses);
};

// Pembelian
export const getPurchases = async (): Promise<Purchase[]> => {
  const purchases = await getData(STORAGE_KEYS.PURCHASES);
  return purchases || [];
};

export const savePurchases = async (
  purchases: Purchase[],
): Promise<boolean> => {
  return storeData(STORAGE_KEYS.PURCHASES, purchases);
};

export const addPurchase = async (purchase: Purchase): Promise<boolean> => {
  const purchases = await getPurchases();
  purchases.push(purchase);
  return savePurchases(purchases);
};

// Modal
export const getCapital = async (): Promise<Capital[]> => {
  const capital = await getData(STORAGE_KEYS.CAPITAL);
  return capital || [];
};

export const saveCapital = async (capital: Capital[]): Promise<boolean> => {
  return storeData(STORAGE_KEYS.CAPITAL, capital);
};

export const addCapital = async (capital: Capital): Promise<boolean> => {
  const capitalList = await getCapital();
  capitalList.push(capital);
  return saveCapital(capitalList);
};

export const getCurrentCapital = async (): Promise<number> => {
  const capitalList = await getCapital();
  return capitalList.reduce((total, item) => {
    if (
      item.type === "initial" ||
      item.type === "addition" ||
      item.type === "sale"
    ) {
      return total + item.amount;
    } else if (
      item.type === "withdrawal" ||
      item.type === "purchase" ||
      item.type === "expense"
    ) {
      return total - item.amount;
    }
    return total;
  }, 0);
};

// Inisialisasi data dummy jika belum ada data
export const initializeData = async () => {
  const products = await getProducts();
  if (products.length === 0) {
    // Tambahkan produk dummy
    await saveProducts([
      {
        id: "1",
        name: "Kemeja Putih",
        sku: "SKU001",
        price: 150000,
        stock: 25,
        supplier: "Supplier A",
        image:
          "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=200&q=80",
      },
      {
        id: "2",
        name: "Celana Jeans",
        sku: "SKU002",
        price: 299000,
        stock: 15,
        supplier: "Supplier B",
        image:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80",
      },
      {
        id: "3",
        name: "Sepatu Sneakers",
        sku: "SKU003",
        price: 450000,
        stock: 10,
        supplier: "Supplier C",
        image:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&q=80",
      },
      {
        id: "4",
        name: "Hoodie Hitam",
        sku: "SKU004",
        price: 350000,
        stock: 20,
        supplier: "Supplier A",
        image:
          "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&q=80",
      },
      {
        id: "5",
        name: "Topi Baseball",
        sku: "SKU005",
        price: 75000,
        stock: 30,
        supplier: "Supplier B",
        image:
          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200&q=80",
      },
    ]);
  }

  // Initialize capital if empty
  const capital = await getCapital();
  if (capital.length === 0) {
    // Add initial capital
    await addCapital({
      id: "1",
      date: new Date().toISOString(),
      amount: 5000000, // 5 juta rupiah sebagai modal awal
      type: "initial",
      description: "Modal awal",
    });
  }
};

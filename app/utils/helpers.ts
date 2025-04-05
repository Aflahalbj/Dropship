// Format currency to Indonesian Rupiah
export const formatCurrency = (amount: number): string => {
  return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Format date to Indonesian format
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Format time
export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format date and time
export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)}, ${formatTime(date)}`;
};

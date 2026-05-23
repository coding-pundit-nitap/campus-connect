export function formatCurrency(value: number | string): string {
  const numValue = typeof value === "string" ? Number(value) : value;
  if (isNaN(numValue)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(numValue);
}

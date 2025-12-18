import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    backgroundColor: "#f5f5f5",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: "#666",
  },
  value: {
    flex: 1,
    color: "#333",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#333",
    color: "#fff",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 8,
  },
  tableCell: {
    flex: 1,
  },
  tableCellName: {
    flex: 3,
  },
  tableCellQty: {
    flex: 1,
    textAlign: "center",
  },
  tableCellPrice: {
    flex: 1,
    textAlign: "right",
  },
  totals: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#333",
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  totalLabel: {
    width: 100,
    textAlign: "right",
    marginRight: 20,
    color: "#666",
  },
  totalValue: {
    width: 80,
    textAlign: "right",
    color: "#333",
  },
  grandTotal: {
    fontWeight: "bold",
    fontSize: 14,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#999",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  notes: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  notesText: {
    fontStyle: "italic",
    color: "#666",
  },
});

export type OrderReceiptData = {
  displayId: string;
  createdAt: string;
  customer: {
    name: string;
    phone?: string;
  };
  shop: {
    name: string;
    location: string;
  };
  deliveryAddress: string;
  requestedDeliveryTime?: string;
  paymentMethod: string;
  upiTransactionId?: string;
  customerNotes?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    discount: number;
  }>;
  subtotal: number;
  total: number;
};

export function OrderReceiptPDF({ data }: { data: OrderReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Order Receipt</Text>
          <Text style={styles.subtitle}>Order #{data.displayId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Order Date:</Text>
            <Text style={styles.value}>{data.createdAt}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{data.customer.name}</Text>
          </View>
          {data.customer.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{data.customer.phone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Shop:</Text>
            <Text style={styles.value}>{data.shop.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Address:</Text>
            <Text style={styles.value}>{data.deliveryAddress}</Text>
          </View>
          {data.requestedDeliveryTime && (
            <View style={styles.row}>
              <Text style={styles.label}>Requested Delivery:</Text>
              <Text style={styles.value}>{data.requestedDeliveryTime}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>{data.paymentMethod}</Text>
          </View>
          {data.upiTransactionId && (
            <View style={styles.row}>
              <Text style={styles.label}>UPI Transaction ID:</Text>
              <Text style={styles.value}>{data.upiTransactionId}</Text>
            </View>
          )}
        </View>

        {/* Customer Notes */}
        {data.customerNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Notes</Text>
            <View style={styles.notes}>
              <Text style={styles.notesText}>"{data.customerNotes}"</Text>
            </View>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellName}>Item</Text>
              <Text style={styles.tableCellQty}>Qty</Text>
              <Text style={styles.tableCellPrice}>Price</Text>
              <Text style={styles.tableCellPrice}>Total</Text>
            </View>
            {data.items.map((item, index) => {
              const discountedPrice =
                item.price - (item.price * item.discount) / 100;
              const itemTotal = discountedPrice * item.quantity;
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCellName}>
                    {item.name}
                    {item.discount > 0 && ` (${item.discount}% off)`}
                  </Text>
                  <Text style={styles.tableCellQty}>{item.quantity}</Text>
                  <Text style={styles.tableCellPrice}>
                    ₹{discountedPrice.toFixed(2)}
                  </Text>
                  <Text style={styles.tableCellPrice}>
                    ₹{itemTotal.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>₹{data.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery:</Text>
            <Text style={styles.totalValue}>₹0.00</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              ₹{data.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your order! | Campus Connect | Generated on{" "}
          {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
}

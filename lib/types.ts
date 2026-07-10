export type Route = "India → USA" | "USA → India";
export type Currency = "USD" | "INR";

export type Lead = {
  _row: number;
  id: string;
  date: string;
  customerName: string;
  phone: string;
  email: string;
  route: string;
  status: "New" | "Contacted" | "Quoted" | "Converted" | "Lost" | string;
  notes: string;
  fromAddress: string;
  shipToAddress: string;
  shipToContactName: string;
  shipToContactPhone: string;
};

export type Package = {
  _row: number;
  id: string;
  leadId: string;
  customerName: string;
  originAddress: string;
  destinationAddress: string;
  route: string;
  weightKg: string;
  status:
    | "Pending Pickup"
    | "In Transit"
    | "Customs"
    | "Delivered"
    | string;
  shippedDate: string;
  expectedDelivery: string;
  carrier: string;
  trackingNumber: string;
  notes: string;
  amountDue: string;
  currency: string;
};

export type Payment = {
  _row: number;
  id: string;
  packageId: string;
  customerName: string;
  amount: string;
  currency: string;
  method: string;
  status: "Pending" | "Paid" | "Partial" | "Refunded" | string;
  date: string;
  notes: string;
};

export type CourierPayment = {
  _row: number;
  id: string;
  packageId: string;
  customerName: string;
  paidContactName: string;
  paidContactNumber: string;
  paidBy: string;
  total: string;
  currency: string;
  paymentSource: string;
  customerPaymentStatus: "Pending" | "Paid" | "Partial" | string;
  date: string;
  notes: string;
};

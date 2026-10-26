import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  Order_ID: string;
  Order_Date: string;
  Customer_Name: string;
  Product_Name: string;
  Quantity: number;
  Total_Amount: number;
  Payment_Method: string;
  Order_Status: string;
  Is_Anomaly: number;
  [key: string]: any;
}

const TransactionSchema: Schema = new Schema(
  {
    Order_ID: { type: String, required: true },
    Order_Date: { type: String, required: true },
    Customer_Name: { type: String, required: true },
    Product_Name: { type: String, required: true },
    Quantity: { type: Number, required: true },
    Total_Amount: { type: Number, required: true },
    Payment_Method: { type: String, required: true },
    Order_Status: { type: String, required: true },
    Is_Anomaly: { type: Number, default: 0 },
  },
  { 
    strict: false, 
    timestamps: true,
    collection: 'transactions' 
  }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
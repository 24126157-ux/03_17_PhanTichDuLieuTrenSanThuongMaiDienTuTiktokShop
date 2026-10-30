import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  Order_ID: string;
  Order_Date: string;
  Customer_ID?: string;
  Customer_Name: string;
  Customer_Age?: number;
  Customer_Gender?: string;
  Shipping_City?: string;
  Device_Type?: string;
  Product_ID?: string;
  Product_Name: string;
  Main_Category?: string;
  Sub_Category?: string;
  Unit_Price?: number;
  Quantity: number;
  Discount_Amount?: number;
  Shipping_Fee?: number;
  Total_Amount: number;
  Payment_Method: string;
  Order_Status: string;
  Product_Rating?: number;
  Review_Count?: number;
  Shop_ID?: string;
  Shop_Name?: string;
  Traffic_Source?: string;
  Creator_Name?: string;
  Video_Views?: number;
  Is_Anomaly: number;
  [key: string]: any;
}

const TransactionSchema: Schema = new Schema(
  {
    Order_ID: { type: String, required: true },
    Order_Date: { type: String, required: true },
    Customer_ID: { type: String, default: '' },
    Customer_Name: { type: String, required: true },
    Customer_Age: { type: Number, default: 0 },
    Customer_Gender: { type: String, default: 'Khác' },
    Shipping_City: { type: String, default: '' },
    Device_Type: { type: String, default: 'Mobile' },
    Product_ID: { type: String, default: '' },
    Product_Name: { type: String, required: true },
    Main_Category: { type: String, default: '' },
    Sub_Category: { type: String, default: '' },
    Unit_Price: { type: Number, default: 0 },
    Quantity: { type: Number, required: true },
    Discount_Amount: { type: Number, default: 0 },
    Shipping_Fee: { type: Number, default: 0 },
    Total_Amount: { type: Number, required: true },
    Payment_Method: { type: String, required: true },
    Order_Status: { type: String, required: true },
    Product_Rating: { type: Number, default: 0 },
    Review_Count: { type: Number, default: 0 },
    Shop_ID: { type: String, default: '' },
    Shop_Name: { type: String, default: '' },
    Traffic_Source: { type: String, default: '' },
    Creator_Name: { type: String, default: '' },
    Video_Views: { type: Number, default: 0 },
    Is_Anomaly: { type: Number, default: 0 },
  },
  { 
    strict: false, 
    timestamps: true,
    collection: 'transactions' 
  }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
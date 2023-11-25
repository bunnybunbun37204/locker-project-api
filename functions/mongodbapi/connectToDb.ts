import mongoose from "mongoose";
import { URI } from "../lib/constants";

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB 🚀");
  } catch (error) {
    console.error("💀 Error connecting to MongoDB:", error);
  }
};

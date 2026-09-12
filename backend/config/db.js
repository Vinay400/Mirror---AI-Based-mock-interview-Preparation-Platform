import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing in process.env");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Connected Successfully!");
  } catch (error) {
    console.error("Database Connection Error:", error.message || error);
  }
};

export default connectDB;


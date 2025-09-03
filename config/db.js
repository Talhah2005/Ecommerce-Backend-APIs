import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config(); // i load .env file here

// function to connect with MongoDB
const connectDB = async () => {
  // i am just checking if uri exists (i don't print full uri for safety)
  if (!process.env.MONGO_URI) {
    console.log("DB: MONGO_URI is missing in .env file");
  } else {
    console.log("DB: got MONGO_URI from .env (not showing it)");
  }

  try {
    console.log("DB: trying to connect to MongoDB now...");
    // connect to mongo using the url saved in .env file
    await mongoose.connect(process.env.MONGO_URI, {
      authSource: "admin", // keep only if your DB user is inside admin db
    });
    console.log("DB: MongoDB Connected ✅");
  } catch (err) {
    // if error in connecting then show message
    console.error("DB: MongoDB Connection Error:", err.message);
    console.log("DB: i will stop the app because db did not connect");
    process.exit(1); // stop the app if database not connected
  }
};

export default connectDB;

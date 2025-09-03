import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";

dotenv.config(); // load .env variables
const app = express();

await connectDB(); // connect to mongodb

app.use(express.json()); // parse json data from request body

// use auth routes (signup, login, me)
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/post";
import userRoutes from "./routes/user";
import commentRoutes from "./routes/comment";
import { setupSwagger } from "./swagger";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger API documentation
setupSwagger(app);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);

app.get("/", (_req, res) => {
  res.send("BiteShare API is running");
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log(process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Failed to connect to MongoDB, running without DB");
    console.error(err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Only start the server when this file is run directly (not imported by tests)
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;

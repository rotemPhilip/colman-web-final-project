import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import https from "https";
import fs from "fs";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/post";
import userRoutes from "./routes/user";
import commentRoutes from "./routes/comment";
import { setupSwagger } from "./swagger";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
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

// Serve React client static files
const clientPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientPath));

// React Router fallback - return index.html for non-API routes
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log(process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI as string, {authSource: "admin"});
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Failed to connect to MongoDB, running without DB");
    console.error(err);
  }

  if (process.env.NODE_ENV === "production") {
    const sslOptions = {
      key: fs.readFileSync(path.join(__dirname, "../../client-key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "../../client-cert.pem")),
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Server running on HTTPS port ${PORT}`);
    });
  } else {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
};

// Only start the server when this file is run directly (not imported by tests)
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;

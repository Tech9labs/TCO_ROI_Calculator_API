import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";

import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health";
import calculatorRouter from "./routes/calculator";
import authRouter from "./routes/auth";
import savedRouter from "./routes/savedCalculations";
import adminRouter from "./routes/admin";

const app = express();

// Security & observability (CSP disabled — React SPA uses inline styles for PDF print view)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(requestLogger);

// Body parsing
app.use(express.json());

// API Routes
app.use("/api/health", healthRouter);
app.use("/api/v1", calculatorRouter);
app.use("/api/auth", authRouter);
app.use("/api/saved", savedRouter);
app.use("/api/admin", adminRouter);

// Serve React frontend static build
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

// Return JSON 404 for unmatched /api/* routes (prevents React HTML from confusing clients)
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Catch-all: return index.html for client-side routing (React Router)
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Global error handler — must be last
app.use(errorHandler);

export default app;

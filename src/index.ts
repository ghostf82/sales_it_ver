import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { spec } from "./docs/swagger.js";
import { router as healthRouter } from "./routes/health.js";
import { router as repsRouter } from "./routes/representatives.js";
import { router as companiesRouter } from "./routes/companies.js";
import { router as salesRouter } from "./routes/sales.js";
import { router as collectionsRouter } from "./routes/collections.js";
import { router as rulesRouter } from "./routes/commission_rules.js";
import { router as reportsRouter } from "./routes/reports.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/health", healthRouter);
app.use("/api/representatives", repsRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/sales", salesRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/commission-rules", rulesRouter);
app.use("/api/reports", reportsRouter);

// Swagger documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec, {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Commission API Documentation"
}));

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "endpoint_not_found"
  });
});

// Global error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`🚀 Commission API running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
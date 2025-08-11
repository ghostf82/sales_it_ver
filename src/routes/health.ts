import { Router } from "express";
import { ok } from "../utils/http.js";

export const router = Router();

router.get("/", (req, res) => {
  res.json(ok({
    message: "Commission API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  }));
});
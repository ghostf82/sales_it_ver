import { Router } from "express";
import Joi from "joi";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, fail } from "../utils/http.js";
import { parsePagination } from "../utils/pagination.js";

export const router = Router();
router.use(authMiddleware);

const companySchema = Joi.object({
  name: Joi.string().min(2).max(100).required()
});

// GET /api/companies
router.get("/", async (req, res, next) => {
  try {
    const { from, to } = parsePagination(req.query);
    
    const { data, error, count } = await supabase
      .from("companies")
      .select("*", { count: "exact" })
      .range(from, to)
      .order("name", { ascending: true });

    if (error) throw error;

    res.json(ok({
      items: data || [],
      total: count || 0,
      page: Math.floor(from / (to - from + 1)) + 1,
      page_size: to - from + 1
    }));
  } catch (error) {
    next(error);
  }
});

// GET /api/companies/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json(fail("company_not_found"));
      }
      throw error;
    }

    res.json(ok(data));
  } catch (error) {
    next(error);
  }
});

// POST /api/companies
router.post("/", async (req, res, next) => {
  try {
    const { error: validationError, value } = companySchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(fail(validationError.message));
    }

    const { data, error } = await supabase
      .from("companies")
      .insert([value])
      .select("*")
      .single();

    if (error) throw error;

    res.status(201).json(ok(data));
  } catch (error) {
    next(error);
  }
});

// PUT /api/companies/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { error: validationError, value } = companySchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(fail(validationError.message));
    }

    const { data, error } = await supabase
      .from("companies")
      .update(value)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json(fail("company_not_found"));
      }
      throw error;
    }

    res.json(ok(data));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/companies/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json(ok({ deleted: true }));
  } catch (error) {
    next(error);
  }
});
import { Router } from "express";
import Joi from "joi";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, fail } from "../utils/http.js";
import { parsePagination } from "../utils/pagination.js";

export const router = Router();
router.use(authMiddleware);

const saleSchema = Joi.object({
  representative_id: Joi.string().uuid().required(),
  company_id: Joi.string().uuid().required(),
  category: Joi.string().min(1).max(100).required(),
  sales: Joi.number().min(0).required(),
  target: Joi.number().min(0).required(),
  year: Joi.number().integer().min(2020).max(2030).required(),
  month: Joi.number().integer().min(1).max(12).required()
});

// GET /api/sales
router.get("/", async (req, res, next) => {
  try {
    const { from, to } = parsePagination(req.query);
    
    let query = supabase
      .from("representative_data")
      .select(`
        id,
        representative_id,
        representative:representative_id(id, name),
        company_id,
        company:company_id(id, name),
        category,
        sales,
        target,
        year,
        month,
        created_at
      `, { count: "exact" });

    // Apply filters
    if (req.query.year) query = query.eq("year", req.query.year);
    if (req.query.month) query = query.eq("month", req.query.month);
    if (req.query.representative_id) query = query.eq("representative_id", req.query.representative_id);
    if (req.query.company_id) query = query.eq("company_id", req.query.company_id);
    if (req.query.category) query = query.eq("category", req.query.category);

    const { data, error, count } = await query
      .range(from, to)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) throw error;

    const processedData = (data || []).map(sale => ({
      id: sale.id,
      representative_id: sale.representative_id,
      representative_name: sale.representative?.name,
      company_id: sale.company_id,
      company_name: sale.company?.name,
      category: sale.category,
      sales: parseFloat(sale.sales),
      target: parseFloat(sale.target),
      achievement_percentage: sale.target > 0 ? (sale.sales / sale.target) * 100 : 0,
      year: sale.year,
      month: sale.month,
      created_at: sale.created_at
    }));

    res.json(ok({
      items: processedData,
      total: count || 0,
      page: Math.floor(from / (to - from + 1)) + 1,
      page_size: to - from + 1
    }));
  } catch (error) {
    next(error);
  }
});

// GET /api/sales/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("representative_data")
      .select(`
        id,
        representative_id,
        representative:representative_id(id, name),
        company_id,
        company:company_id(id, name),
        category,
        sales,
        target,
        year,
        month,
        created_at
      `)
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json(fail("sale_not_found"));
      }
      throw error;
    }

    const processedData = {
      id: data.id,
      representative_id: data.representative_id,
      representative_name: data.representative?.name,
      company_id: data.company_id,
      company_name: data.company?.name,
      category: data.category,
      sales: parseFloat(data.sales),
      target: parseFloat(data.target),
      achievement_percentage: data.target > 0 ? (data.sales / data.target) * 100 : 0,
      year: data.year,
      month: data.month,
      created_at: data.created_at
    };

    res.json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// POST /api/sales
router.post("/", async (req, res, next) => {
  try {
    const { error: validationError, value } = saleSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(fail(validationError.message));
    }

    const { data, error } = await supabase
      .from("representative_data")
      .insert([value])
      .select(`
        id,
        representative_id,
        representative:representative_id(id, name),
        company_id,
        company:company_id(id, name),
        category,
        sales,
        target,
        year,
        month,
        created_at
      `)
      .single();

    if (error) throw error;

    const processedData = {
      id: data.id,
      representative_id: data.representative_id,
      representative_name: data.representative?.name,
      company_id: data.company_id,
      company_name: data.company?.name,
      category: data.category,
      sales: parseFloat(data.sales),
      target: parseFloat(data.target),
      achievement_percentage: data.target > 0 ? (data.sales / data.target) * 100 : 0,
      year: data.year,
      month: data.month,
      created_at: data.created_at
    };

    res.status(201).json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// PUT /api/sales/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { error: validationError, value } = saleSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(fail(validationError.message));
    }

    const { data, error } = await supabase
      .from("representative_data")
      .update(value)
      .eq("id", req.params.id)
      .select(`
        id,
        representative_id,
        representative:representative_id(id, name),
        company_id,
        company:company_id(id, name),
        category,
        sales,
        target,
        year,
        month,
        created_at
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json(fail("sale_not_found"));
      }
      throw error;
    }

    const processedData = {
      id: data.id,
      representative_id: data.representative_id,
      representative_name: data.representative?.name,
      company_id: data.company_id,
      company_name: data.company?.name,
      category: data.category,
      sales: parseFloat(data.sales),
      target: parseFloat(data.target),
      achievement_percentage: data.target > 0 ? (data.sales / data.target) * 100 : 0,
      year: data.year,
      month: data.month,
      created_at: data.created_at
    };

    res.json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sales/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("representative_data")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json(ok({ deleted: true }));
  } catch (error) {
    next(error);
  }
});
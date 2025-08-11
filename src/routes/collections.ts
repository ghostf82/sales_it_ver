import { Router } from "express";
import Joi from "joi";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, fail } from "../utils/http.js";
import { parsePagination } from "../utils/pagination.js";

export const router = Router();
router.use(authMiddleware);

const collectionSchema = Joi.object({
  representative_id: Joi.string().uuid().required(),
  company_id: Joi.string().uuid().required(),
  year: Joi.number().integer().min(2020).max(2030).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  amount: Joi.number().min(0).required()
});

// GET /api/collections
router.get("/", async (req, res, next) => {
  try {
    const { from, to } = parsePagination(req.query);
    
    let query = supabase
      .from("collection_records")
      .select(`
        id,
        representative_id,
        representative:representative_id(id, name),
        company_id,
        company:company_id(id, name),
        year,
        month,
        amount,
        created_at,
        updated_at
      `, { count: "exact" });

    // Apply filters
    if (req.query.year) query = query.eq("year", req.query.year);
    if (req.query.month) query = query.eq("month", req.query.month);
    if (req.query.representative_id) query = query.eq("representative_id", req.query.representative_id);
    if (req.query.company_id) query = query.eq("company_id", req.query.company_id);

    const { data, error, count } = await query
      .range(from, to)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) throw error;

    const processedData = (data || []).map(record => ({
      id: record.id,
      representative_id: record.representative_id,
      representative_name: record.representative?.name,
      company_id: record.company_id,
      company_name: record.company?.name,
      year: record.year,
      month: record.month,
      amount: parseFloat(record.amount),
      created_at: record.created_at,
      updated_at: record.updated_at
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

// GET /api/collections/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("collection_records")
      .select(`
        id,
        representative_id,
        representative:representative_id(id, name),
        company_id,
        company:company_id(id, name),
        year,
        month,
        amount,
        created_at,
        updated_at
      `)
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json(fail("collection_not_found"));
      }
      throw error;
    }

    const processedData = {
      id: data.id,
      representative_id: data.representative_id,
      representative_name: data.representative?.name,
      company_id: data.company_id,
      company_name: data.company?.name,
      year: data.year,
      month: data.month,
      amount: parseFloat(data.amount),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    res.json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// POST /api/collections
router.post("/", async (req, res, next) => {
  try {
    const { error: validationError, value } = collectionSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(fail(validationError.message));
    }

    const { data, error } = await supabase
      .from("collection_records")
      .insert([value])
      .select(`
        id,
        representative_id,
        representative:representative_id(id, name),
        company_id,
        company:company_id(id, name),
        year,
        month,
        amount,
        created_at,
        updated_at
      `)
      .single();

    if (error) throw error;

    const processedData = {
      id: data.id,
      representative_id: data.representative_id,
      representative_name: data.representative?.name,
      company_id: data.company_id,
      company_name: data.company?.name,
      year: data.year,
      month: data.month,
      amount: parseFloat(data.amount),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    res.status(201).json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// PUT /api/collections/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { error: validationError, value } = collectionSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(fail(validationError.message));
    }

    const { data, error } = await supabase
      .from("collection_records")
      .update(value)
      .eq("id", req.params.id)
      .select(`
        id,
        representative_id,
        representative:representative_id(id, name),
        company_id,
        company:company_id(id, name),
        year,
        month,
        amount,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json(fail("collection_not_found"));
      }
      throw error;
    }

    const processedData = {
      id: data.id,
      representative_id: data.representative_id,
      representative_name: data.representative?.name,
      company_id: data.company_id,
      company_name: data.company?.name,
      year: data.year,
      month: data.month,
      amount: parseFloat(data.amount),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    res.json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/collections/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("collection_records")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json(ok({ deleted: true }));
  } catch (error) {
    next(error);
  }
});
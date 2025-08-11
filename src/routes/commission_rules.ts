import { Router } from "express";
import Joi from "joi";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, fail } from "../utils/http.js";

export const router = Router();
router.use(authMiddleware);

const commissionRuleSchema = Joi.object({
  category: Joi.string().min(1).max(100).required(),
  tier1_from: Joi.number().min(0).max(100).required(),
  tier1_to: Joi.number().min(0).max(100).required(),
  tier1_rate: Joi.number().min(0).max(1).required(),
  tier2_from: Joi.number().min(0).max(100).required(),
  tier2_to: Joi.number().min(0).max(100).required(),
  tier2_rate: Joi.number().min(0).max(1).required(),
  tier3_from: Joi.number().min(0).max(100).required(),
  tier3_rate: Joi.number().min(0).max(1).required()
});

// GET /api/commission-rules
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("commission_rules")
      .select("*")
      .order("category", { ascending: true });

    if (error) throw error;

    const processedData = (data || []).map(rule => ({
      id: rule.id,
      category: rule.category,
      tier1_from: parseFloat(rule.tier1_from),
      tier1_to: parseFloat(rule.tier1_to),
      tier1_rate: parseFloat(rule.tier1_rate),
      tier2_from: parseFloat(rule.tier2_from),
      tier2_to: parseFloat(rule.tier2_to),
      tier2_rate: parseFloat(rule.tier2_rate),
      tier3_from: parseFloat(rule.tier3_from),
      tier3_rate: parseFloat(rule.tier3_rate),
      created_at: rule.created_at,
      updated_at: rule.updated_at
    }));

    res.json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// GET /api/commission-rules/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("commission_rules")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json(fail("commission_rule_not_found"));
      }
      throw error;
    }

    const processedData = {
      id: data.id,
      category: data.category,
      tier1_from: parseFloat(data.tier1_from),
      tier1_to: parseFloat(data.tier1_to),
      tier1_rate: parseFloat(data.tier1_rate),
      tier2_from: parseFloat(data.tier2_from),
      tier2_to: parseFloat(data.tier2_to),
      tier2_rate: parseFloat(data.tier2_rate),
      tier3_from: parseFloat(data.tier3_from),
      tier3_rate: parseFloat(data.tier3_rate),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    res.json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// POST /api/commission-rules
router.post("/", async (req, res, next) => {
  try {
    const { error: validationError, value } = commissionRuleSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(fail(validationError.message));
    }

    const { data, error } = await supabase
      .from("commission_rules")
      .insert([value])
      .select("*")
      .single();

    if (error) throw error;

    const processedData = {
      id: data.id,
      category: data.category,
      tier1_from: parseFloat(data.tier1_from),
      tier1_to: parseFloat(data.tier1_to),
      tier1_rate: parseFloat(data.tier1_rate),
      tier2_from: parseFloat(data.tier2_from),
      tier2_to: parseFloat(data.tier2_to),
      tier2_rate: parseFloat(data.tier2_rate),
      tier3_from: parseFloat(data.tier3_from),
      tier3_rate: parseFloat(data.tier3_rate),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    res.status(201).json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// PUT /api/commission-rules/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { error: validationError, value } = commissionRuleSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(fail(validationError.message));
    }

    const { data, error } = await supabase
      .from("commission_rules")
      .update(value)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json(fail("commission_rule_not_found"));
      }
      throw error;
    }

    const processedData = {
      id: data.id,
      category: data.category,
      tier1_from: parseFloat(data.tier1_from),
      tier1_to: parseFloat(data.tier1_to),
      tier1_rate: parseFloat(data.tier1_rate),
      tier2_from: parseFloat(data.tier2_from),
      tier2_to: parseFloat(data.tier2_to),
      tier2_rate: parseFloat(data.tier2_rate),
      tier3_from: parseFloat(data.tier3_from),
      tier3_rate: parseFloat(data.tier3_rate),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    res.json(ok(processedData));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/commission-rules/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("commission_rules")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json(ok({ deleted: true }));
  } catch (error) {
    next(error);
  }
});
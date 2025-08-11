const { supabase } = require('../config/supabase');

/**
 * Get all commission rules
 */
const getAllCommissionRules = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('commission_rules')
      .select('*')
      .order('category');

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(rule => ({
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
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get commission rule by ID
 */
const getCommissionRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Commission rule not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new commission rule
 */
const createCommissionRule = async (req, res, next) => {
  try {
    const {
      category,
      tier1_from,
      tier1_to,
      tier1_rate,
      tier2_from,
      tier2_to,
      tier2_rate,
      tier3_from,
      tier3_rate
    } = req.body;

    const { data, error } = await supabase
      .from('commission_rules')
      .insert([{
        category,
        tier1_from,
        tier1_to,
        tier1_rate,
        tier2_from,
        tier2_to,
        tier2_rate,
        tier3_from,
        tier3_rate
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update commission rule
 */
const updateCommissionRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      category,
      tier1_from,
      tier1_to,
      tier1_rate,
      tier2_from,
      tier2_to,
      tier2_rate,
      tier3_from,
      tier3_rate
    } = req.body;

    const { data, error } = await supabase
      .from('commission_rules')
      .update({
        category,
        tier1_from,
        tier1_to,
        tier1_rate,
        tier2_from,
        tier2_to,
        tier2_rate,
        tier3_from,
        tier3_rate
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Commission rule not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete commission rule
 */
const deleteCommissionRule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('commission_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        message: 'Commission rule deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCommissionRules,
  getCommissionRuleById,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule
};
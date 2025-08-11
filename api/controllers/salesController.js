const { supabase } = require('../config/supabase');

/**
 * Get all sales data
 */
const getAllSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, year, month, representative_id, company_id } = req.query;
    
    let query = supabase
      .from('representative_data')
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
      .order('created_at', { ascending: false });

    // Apply filters
    if (year) query = query.eq('year', year);
    if (month) query = query.eq('month', month);
    if (representative_id) query = query.eq('representative_id', representative_id);
    if (company_id) query = query.eq('company_id', company_id);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(sale => ({
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
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: data.length === parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sale by ID
 */
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('representative_data')
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Sale not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new sale
 */
const createSale = async (req, res, next) => {
  try {
    const { representative_id, company_id, category, sales, target, year, month } = req.body;

    const { data, error } = await supabase
      .from('representative_data')
      .insert([{
        representative_id,
        company_id,
        category,
        sales,
        target,
        year,
        month
      }])
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

    res.status(201).json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update sale
 */
const updateSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { representative_id, company_id, category, sales, target, year, month } = req.body;

    const { data, error } = await supabase
      .from('representative_data')
      .update({
        representative_id,
        company_id,
        category,
        sales,
        target,
        year,
        month
      })
      .eq('id', id)
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
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Sale not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete sale
 */
const deleteSale = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('representative_data')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        message: 'Sale deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale
};
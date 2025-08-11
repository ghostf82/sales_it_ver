const { supabase } = require('../config/supabase');

/**
 * Get all collection records
 */
const getAllCollections = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, year, month, representative_id } = req.query;
    
    let query = supabase
      .from('collection_records')
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
      .order('created_at', { ascending: false });

    // Apply filters
    if (year) query = query.eq('year', year);
    if (month) query = query.eq('month', month);
    if (representative_id) query = query.eq('representative_id', representative_id);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(record => ({
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
 * Get collection record by ID
 */
const getCollectionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('collection_records')
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Collection record not found'
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
        year: data.year,
        month: data.month,
        amount: parseFloat(data.amount),
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new collection record
 */
const createCollection = async (req, res, next) => {
  try {
    const { representative_id, company_id, year, month, amount } = req.body;

    const { data, error } = await supabase
      .from('collection_records')
      .insert([{
        representative_id,
        company_id,
        year,
        month,
        amount
      }])
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

    res.status(201).json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update collection record
 */
const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { representative_id, company_id, year, month, amount } = req.body;

    const { data, error } = await supabase
      .from('collection_records')
      .update({
        representative_id,
        company_id,
        year,
        month,
        amount
      })
      .eq('id', id)
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
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Collection record not found'
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
        year: data.year,
        month: data.month,
        amount: parseFloat(data.amount),
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete collection record
 */
const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('collection_records')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        message: 'Collection record deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection
};
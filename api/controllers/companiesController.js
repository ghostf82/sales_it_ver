const { supabase } = require('../config/supabase');

/**
 * Get all companies
 */
const getAllCompanies = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(company => ({
        id: company.id,
        name: company.name,
        created_at: company.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get company by ID
 */
const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Company not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        created_at: data.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new company
 */
const createCompany = async (req, res, next) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabase
      .from('companies')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        created_at: data.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update company
 */
const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const { data, error } = await supabase
      .from('companies')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Company not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        created_at: data.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete company
 */
const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        message: 'Company deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
};
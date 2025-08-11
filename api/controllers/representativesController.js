const { supabase } = require('../config/supabase');

/**
 * Get all representatives
 */
const getAllRepresentatives = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('representatives')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(rep => ({
        id: rep.id,
        name: rep.name,
        created_at: rep.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get representative by ID
 */
const getRepresentativeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('representatives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Representative not found'
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
 * Create new representative
 */
const createRepresentative = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    const { data, error } = await supabase
      .from('representatives')
      .insert([{ name, email, phone }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        created_at: data.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update representative
 */
const updateRepresentative = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const { data, error } = await supabase
      .from('representatives')
      .update({ name, email, phone })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Representative not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        created_at: data.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete representative
 */
const deleteRepresentative = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('representatives')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        message: 'Representative deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRepresentatives,
  getRepresentativeById,
  createRepresentative,
  updateRepresentative,
  deleteRepresentative
};
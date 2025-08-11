const { supabase } = require('../config/supabase');

/**
 * Calculate commission based on sales, target, and commission rules
 */
const calculateCommission = (sales, target, rule) => {
  if (!rule || target === 0) return { tier1: 0, tier2: 0, tier3: 0, total: 0 };

  const achievementPercent = (sales / target) * 100;
  let tier1 = 0, tier2 = 0, tier3 = 0;

  // Tier 1: Always 70% of target
  tier1 = target * 0.7 * rule.tier1_rate;

  // Tier 2: 30% of target if achievement >= 71%
  if (achievementPercent >= 71) {
    tier2 = target * 0.3 * rule.tier2_rate;
  }

  // Tier 3: Amount exceeding target if achievement > 100%
  if (achievementPercent > 100) {
    tier3 = (sales - target) * rule.tier3_rate;
  }

  const total = tier1 + tier2 + tier3;

  return {
    tier1: parseFloat(tier1.toFixed(2)),
    tier2: parseFloat(tier2.toFixed(2)),
    tier3: parseFloat(tier3.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

/**
 * Get commission report for specific representative
 */
const getRepresentativeReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;

    // Build query
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
      .eq('representative_id', id);

    if (year) query = query.eq('year', year);
    if (month) query = query.eq('month', month);

    const { data: salesData, error: salesError } = await query.order('year', { ascending: false })
      .order('month', { ascending: false });

    if (salesError) throw salesError;

    // Get commission rules
    const { data: commissionRules, error: rulesError } = await supabase
      .from('commission_rules')
      .select('*');

    if (rulesError) throw rulesError;

    // Get collection data
    let collectionQuery = supabase
      .from('collection_records')
      .select('*')
      .eq('representative_id', id);

    if (year) collectionQuery = collectionQuery.eq('year', year);
    if (month) collectionQuery = collectionQuery.eq('month', month);

    const { data: collectionData, error: collectionError } = await collectionQuery;

    if (collectionError) throw collectionError;

    // Process data and calculate commissions
    const processedData = salesData.map(sale => {
      const rule = commissionRules.find(r => r.category === sale.category);
      const commission = calculateCommission(sale.sales, sale.target, rule);
      
      return {
        id: sale.id,
        representative_id: sale.representative_id,
        representative_name: sale.representative?.name,
        company_id: sale.company_id,
        company_name: sale.company?.name,
        category: sale.category,
        sales: parseFloat(sale.sales),
        target: parseFloat(sale.target),
        achievement_percentage: sale.target > 0 ? (sale.sales / sale.target) * 100 : 0,
        commission: commission,
        year: sale.year,
        month: sale.month,
        created_at: sale.created_at
      };
    });

    // Calculate totals
    const totals = processedData.reduce((acc, sale) => {
      acc.total_sales += sale.sales;
      acc.total_target += sale.target;
      acc.total_commission += sale.commission.total;
      return acc;
    }, { total_sales: 0, total_target: 0, total_commission: 0 });

    // Calculate total collection
    const totalCollection = collectionData.reduce((sum, record) => sum + parseFloat(record.amount), 0);

    res.json({
      success: true,
      data: {
        representative_id: id,
        representative_name: salesData[0]?.representative?.name || null,
        period: { year: year || null, month: month || null },
        summary: {
          total_sales: parseFloat(totals.total_sales.toFixed(2)),
          total_target: parseFloat(totals.total_target.toFixed(2)),
          total_collection: parseFloat(totalCollection.toFixed(2)),
          total_commission: parseFloat(totals.total_commission.toFixed(2)),
          achievement_percentage: totals.total_target > 0 ? (totals.total_sales / totals.total_target) * 100 : 0
        },
        sales_details: processedData,
        collection_records: collectionData.map(record => ({
          id: record.id,
          amount: parseFloat(record.amount),
          year: record.year,
          month: record.month,
          created_at: record.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full commission report for all representatives
 */
const getFullReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    // Build query for sales data
    let salesQuery = supabase
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
      `);

    if (year) salesQuery = salesQuery.eq('year', year);
    if (month) salesQuery = salesQuery.eq('month', month);

    const { data: salesData, error: salesError } = await salesQuery
      .order('representative_id')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (salesError) throw salesError;

    // Get commission rules
    const { data: commissionRules, error: rulesError } = await supabase
      .from('commission_rules')
      .select('*');

    if (rulesError) throw rulesError;

    // Get collection data
    let collectionQuery = supabase
      .from('collection_records')
      .select('*');

    if (year) collectionQuery = collectionQuery.eq('year', year);
    if (month) collectionQuery = collectionQuery.eq('month', month);

    const { data: collectionData, error: collectionError } = await collectionQuery;

    if (collectionError) throw collectionError;

    // Group data by representative
    const representativeGroups = {};
    
    salesData.forEach(sale => {
      const repId = sale.representative_id;
      if (!representativeGroups[repId]) {
        representativeGroups[repId] = {
          representative_id: repId,
          representative_name: sale.representative?.name,
          sales: [],
          totals: { sales: 0, target: 0, commission: 0 }
        };
      }

      const rule = commissionRules.find(r => r.category === sale.category);
      const commission = calculateCommission(sale.sales, sale.target, rule);

      const processedSale = {
        id: sale.id,
        company_id: sale.company_id,
        company_name: sale.company?.name,
        category: sale.category,
        sales: parseFloat(sale.sales),
        target: parseFloat(sale.target),
        achievement_percentage: sale.target > 0 ? (sale.sales / sale.target) * 100 : 0,
        commission: commission,
        year: sale.year,
        month: sale.month,
        created_at: sale.created_at
      };

      representativeGroups[repId].sales.push(processedSale);
      representativeGroups[repId].totals.sales += processedSale.sales;
      representativeGroups[repId].totals.target += processedSale.target;
      representativeGroups[repId].totals.commission += commission.total;
    });

    // Add collection data to each representative
    Object.keys(representativeGroups).forEach(repId => {
      const repCollections = collectionData.filter(c => c.representative_id === repId);
      const totalCollection = repCollections.reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      representativeGroups[repId].totals.collection = parseFloat(totalCollection.toFixed(2));
      representativeGroups[repId].collection_records = repCollections.map(record => ({
        id: record.id,
        amount: parseFloat(record.amount),
        year: record.year,
        month: record.month,
        created_at: record.created_at
      }));
    });

    // Calculate overall totals
    const overallTotals = Object.values(representativeGroups).reduce((acc, rep) => {
      acc.total_sales += rep.totals.sales;
      acc.total_target += rep.totals.target;
      acc.total_collection += rep.totals.collection || 0;
      acc.total_commission += rep.totals.commission;
      return acc;
    }, { total_sales: 0, total_target: 0, total_collection: 0, total_commission: 0 });

    res.json({
      success: true,
      data: {
        period: { year: year || null, month: month || null },
        summary: {
          total_sales: parseFloat(overallTotals.total_sales.toFixed(2)),
          total_target: parseFloat(overallTotals.total_target.toFixed(2)),
          total_collection: parseFloat(overallTotals.total_collection.toFixed(2)),
          total_commission: parseFloat(overallTotals.total_commission.toFixed(2)),
          achievement_percentage: overallTotals.total_target > 0 ? (overallTotals.total_sales / overallTotals.total_target) * 100 : 0,
          representatives_count: Object.keys(representativeGroups).length
        },
        representatives: Object.values(representativeGroups).map(rep => ({
          ...rep,
          totals: {
            sales: parseFloat(rep.totals.sales.toFixed(2)),
            target: parseFloat(rep.totals.target.toFixed(2)),
            collection: parseFloat((rep.totals.collection || 0).toFixed(2)),
            commission: parseFloat(rep.totals.commission.toFixed(2)),
            achievement_percentage: rep.totals.target > 0 ? (rep.totals.sales / rep.totals.target) * 100 : 0
          }
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRepresentativeReport,
  getFullReport
};
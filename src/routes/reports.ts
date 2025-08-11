import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, fail } from "../utils/http.js";
import { calculateCommission, type CommissionRule } from "../services/commission_calc.js";

export const router = Router();
router.use(authMiddleware);

// GET /api/reports?year=2025&month=1
router.get("/", async (req, res, next) => {
  try {
    const { year, month } = req.query as any;
    
    // Build query for representative data
    let salesQuery = supabase
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
        month
      `);

    // Apply date filters
    if (year) salesQuery = salesQuery.eq("year", parseInt(year));
    if (month) salesQuery = salesQuery.eq("month", parseInt(month));

    const { data: salesData, error: salesError } = await salesQuery
      .order("representative_id")
      .order("category");

    if (salesError) throw salesError;

    // Get commission rules
    const { data: commissionRules, error: rulesError } = await supabase
      .from("commission_rules")
      .select("*");

    if (rulesError) throw rulesError;

    // Get collection data
    let collectionQuery = supabase
      .from("collection_records")
      .select("*");

    if (year) collectionQuery = collectionQuery.eq("year", parseInt(year));
    if (month) collectionQuery = collectionQuery.eq("month", parseInt(month));

    const { data: collectionData, error: collectionError } = await collectionQuery;

    if (collectionError) throw collectionError;

    // Group data by representative
    const representativeGroups: Record<string, any> = {};
    
    (salesData || []).forEach(sale => {
      const repId = sale.representative_id;
      if (!representativeGroups[repId]) {
        representativeGroups[repId] = {
          representative_id: repId,
          representative_name: sale.representative?.name,
          sales_details: [],
          totals: { sales: 0, target: 0, commission: 0, collection: 0 }
        };
      }

      // Find commission rule for this category
      const rule = (commissionRules || []).find((r: any) => r.category === sale.category);
      let commission = { total_commission: 0 };
      
      if (rule) {
        commission = calculateCommission(sale.sales, sale.target, rule as CommissionRule);
      }

      const saleDetail = {
        id: sale.id,
        company_id: sale.company_id,
        company_name: sale.company?.name,
        category: sale.category,
        sales: parseFloat(sale.sales),
        target: parseFloat(sale.target),
        achievement_percentage: sale.target > 0 ? (sale.sales / sale.target) * 100 : 0,
        commission: commission,
        year: sale.year,
        month: sale.month
      };

      representativeGroups[repId].sales_details.push(saleDetail);
      representativeGroups[repId].totals.sales += saleDetail.sales;
      representativeGroups[repId].totals.target += saleDetail.target;
      representativeGroups[repId].totals.commission += commission.total_commission;
    });

    // Add collection data
    (collectionData || []).forEach(collection => {
      const repId = collection.representative_id;
      if (representativeGroups[repId]) {
        representativeGroups[repId].totals.collection += parseFloat(collection.amount);
      }
    });

    // Calculate overall totals
    const overallTotals = Object.values(representativeGroups).reduce((acc: any, rep: any) => {
      acc.total_sales += rep.totals.sales;
      acc.total_target += rep.totals.target;
      acc.total_collection += rep.totals.collection;
      acc.total_commission += rep.totals.commission;
      return acc;
    }, { total_sales: 0, total_target: 0, total_collection: 0, total_commission: 0 });

    res.json(ok({
      period: { 
        year: year ? parseInt(year) : null, 
        month: month ? parseInt(month) : null 
      },
      summary: {
        total_sales: parseFloat(overallTotals.total_sales.toFixed(2)),
        total_target: parseFloat(overallTotals.total_target.toFixed(2)),
        total_collection: parseFloat(overallTotals.total_collection.toFixed(2)),
        total_commission: parseFloat(overallTotals.total_commission.toFixed(2)),
        achievement_percentage: overallTotals.total_target > 0 
          ? (overallTotals.total_sales / overallTotals.total_target) * 100 
          : 0,
        representatives_count: Object.keys(representativeGroups).length
      },
      representatives: Object.values(representativeGroups).map((rep: any) => ({
        ...rep,
        totals: {
          sales: parseFloat(rep.totals.sales.toFixed(2)),
          target: parseFloat(rep.totals.target.toFixed(2)),
          collection: parseFloat(rep.totals.collection.toFixed(2)),
          commission: parseFloat(rep.totals.commission.toFixed(2)),
          achievement_percentage: rep.totals.target > 0 
            ? (rep.totals.sales / rep.totals.target) * 100 
            : 0
        }
      }))
    }));
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/representative/:id?year=2025&month=1
router.get("/representative/:id", async (req, res, next) => {
  try {
    const representativeId = req.params.id;
    const { year, month } = req.query as any;

    // Build query for representative data
    let salesQuery = supabase
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
      .eq("representative_id", representativeId);

    if (year) salesQuery = salesQuery.eq("year", parseInt(year));
    if (month) salesQuery = salesQuery.eq("month", parseInt(month));

    const { data: salesData, error: salesError } = await salesQuery
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (salesError) throw salesError;

    // Get commission rules
    const { data: commissionRules, error: rulesError } = await supabase
      .from("commission_rules")
      .select("*");

    if (rulesError) throw rulesError;

    // Get collection data
    let collectionQuery = supabase
      .from("collection_records")
      .select("*")
      .eq("representative_id", representativeId);

    if (year) collectionQuery = collectionQuery.eq("year", parseInt(year));
    if (month) collectionQuery = collectionQuery.eq("month", parseInt(month));

    const { data: collectionData, error: collectionError } = await collectionQuery;

    if (collectionError) throw collectionError;

    // Process sales data and calculate commissions
    const processedSales = (salesData || []).map(sale => {
      const rule = (commissionRules || []).find((r: any) => r.category === sale.category);
      let commission = { total_commission: 0 };
      
      if (rule) {
        commission = calculateCommission(sale.sales, sale.target, rule as CommissionRule);
      }

      return {
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
    });

    // Calculate totals
    const totals = processedSales.reduce((acc, sale) => {
      acc.total_sales += sale.sales;
      acc.total_target += sale.target;
      acc.total_commission += sale.commission.total_commission;
      return acc;
    }, { total_sales: 0, total_target: 0, total_commission: 0 });

    // Calculate total collection
    const totalCollection = (collectionData || []).reduce((sum, record) => 
      sum + parseFloat(record.amount), 0);

    res.json(ok({
      representative_id: representativeId,
      representative_name: salesData?.[0]?.representative?.name || null,
      period: { 
        year: year ? parseInt(year) : null, 
        month: month ? parseInt(month) : null 
      },
      summary: {
        total_sales: parseFloat(totals.total_sales.toFixed(2)),
        total_target: parseFloat(totals.total_target.toFixed(2)),
        total_collection: parseFloat(totalCollection.toFixed(2)),
        total_commission: parseFloat(totals.total_commission.toFixed(2)),
        achievement_percentage: totals.total_target > 0 
          ? (totals.total_sales / totals.total_target) * 100 
          : 0
      },
      sales_details: processedSales,
      collection_records: (collectionData || []).map(record => ({
        id: record.id,
        amount: parseFloat(record.amount),
        year: record.year,
        month: record.month,
        created_at: record.created_at
      }))
    }));
  } catch (error) {
    next(error);
  }
});
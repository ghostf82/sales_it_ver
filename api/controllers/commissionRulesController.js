// api/controllers/commissionRulesController.js
'use strict';

const crypto = require('crypto');

// ---- stub data always enabled ----
const STUB_DEFAULT = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    category: 'اسمنتي',
    tier1_from: 50, tier1_to: 70, tier1_rate: 0.0025,
    tier2_from: 71, tier2_to: 100, tier2_rate: 0.003,
    tier3_from: 101, tier3_rate: 0.004,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    category: 'خرسانة',
    tier1_from: 0, tier1_to: 60, tier1_rate: 0.002,
    tier2_from: 61, tier2_to: 100, tier2_rate: 0.0025,
    tier3_from: 101, tier3_rate: 0.0035,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  }
];
let stubData = [...STUB_DEFAULT];

const nowIso = () => new Date().toISOString();
const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    })
  );

function toOut(rule) {
  return {
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
  };
}

/** Get all commission rules */
const getAllCommissionRules = async (_req, res) => {
  const data = [...stubData]
    .sort((a, b) => String(a.category).localeCompare(String(b.category)))
    .map(toOut);
  return res.json({ success: true, source: 'stub', data });
};

/** Get commission rule by ID */
const getCommissionRuleById = async (req, res) => {
  const { id } = req.params;
  const item = stubData.find(r => r.id === id);
  if (!item) return res.status(404).json({ success: false, error: 'Commission rule not found' });
  return res.json({ success: true, source: 'stub', data: toOut(item) });
};

/** Create new commission rule */
const createCommissionRule = async (req, res) => {
  const {
    category,
    tier1_from, tier1_to, tier1_rate,
    tier2_from, tier2_to, tier2_rate,
    tier3_from, tier3_rate
  } = req.body || {};

  const item = {
    id: uuid(),
    category,
    tier1_from, tier1_to, tier1_rate,
    tier2_from, tier2_to, tier2_rate,
    tier3_from, tier3_rate,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  stubData.push(item);
  return res.status(201).json({ success: true, source: 'stub', data: toOut(item) });
};

/** Update commission rule */
const updateCommissionRule = async (req, res) => {
  const { id } = req.params;
  const {
    category,
    tier1_from, tier1_to, tier1_rate,
    tier2_from, tier2_to, tier2_rate,
    tier3_from, tier3_rate
  } = req.body || {};

  const i = stubData.findIndex(r => r.id === id);
  if (i === -1) return res.status(404).json({ success: false, error: 'Commission rule not found' });
  stubData[i] = { ...stubData[i], category, tier1_from, tier1_to, tier1_rate, tier2_from, tier2_to, tier2_rate, tier3_from, tier3_rate, updated_at: nowIso() };
  return res.json({ success: true, source: 'stub', data: toOut(stubData[i]) });
};

/** Delete commission rule */
const deleteCommissionRule = async (req, res) => {
  const { id } = req.params;
  const before = stubData.length;
  stubData = stubData.filter(r => r.id !== id);
  if (stubData.length === before) {
    return res.status(404).json({ success: false, error: 'Commission rule not found' });
  }
  return res.json({ success: true, source: 'stub', data: { id } });
};

module.exports = {
  getAllCommissionRules,
  getCommissionRuleById,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule
};

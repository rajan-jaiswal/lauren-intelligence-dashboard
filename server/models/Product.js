const mongoose = require('mongoose');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const OverviewSchema = new mongoose.Schema({
  logo: String,
  name: String,
  category: String,
  deployment: String,
  targetUsers: String,
  productLaunch: String,
  marketPosition: String,
  gartnerMQ: String,
  description: String,
}, { _id: false });

const KeyFeatureSchema = new mongoose.Schema({
  icon: String,
  name: String,
  description: String,
}, { _id: false });

const CaseStudySchema = new mongoose.Schema({
  icon: String,
  customer: String,
  type: String,
  challenge: String,
  result: String,
}, { _id: false });

const KeyCustomerSchema = new mongoose.Schema({
  logo: String,
  name: String,
  industry: String,
  color: String,
}, { _id: false });

const CompetitorSummarySchema = new mongoose.Schema({
  name: String,
  logo: String,
  color: String,
  marketPosition: String,
  overview: String,
  strengths: [String],
  weaknesses: [String],
  pricingSummary: String,
  bestFit: String,          // AWS competitive snapshot
}, { _id: false });

const FeatureMatrixRowSchema = new mongoose.Schema({
  feature: String,
  product: mongoose.Schema.Types.Mixed,  // true/false/string
  comp1: mongoose.Schema.Types.Mixed,
  comp2: mongoose.Schema.Types.Mixed,
  comp3: mongoose.Schema.Types.Mixed,
}, { _id: false });

const FeatureMatrixSchema = new mongoose.Schema({
  labels: {
    product: String,
    comp1: String,
    comp2: String,
    comp3: String,
  },
  rows: [FeatureMatrixRowSchema],
}, { _id: false });

const TcoRowSchema = new mongoose.Schema({
  component: String,
  product: mongoose.Schema.Types.Mixed,  // can be "$250K" string or number
  comp1: mongoose.Schema.Types.Mixed,
  comp2: mongoose.Schema.Types.Mixed,
  comp3: mongoose.Schema.Types.Mixed,
}, { _id: false });

const TcoDataSchema = new mongoose.Schema({
  labels: {
    product: String,
    comp1: String,
    comp2: String,
    comp3: String,
  },
  maxValue: Number,
  totals: {
    product: mongoose.Schema.Types.Mixed,
    comp1: mongoose.Schema.Types.Mixed,
    comp2: mongoose.Schema.Types.Mixed,
    comp3: mongoose.Schema.Types.Mixed,
  },
  rows: [TcoRowSchema],
}, { _id: false });

const ObjectionSchema = new mongoose.Schema({
  objection: String,
  response: String,
}, { _id: false });

const WinLossCompetitorSchema = new mongoose.Schema({
  label: String,
  wins: Number,
  pct: Number,
  color: String,
}, { _id: false });

const WinLossSchema = new mongoose.Schema({
  total: Number,
  won: Number,
  lost: Number,
  winRate: Number,
  competitors: [WinLossCompetitorSchema],
  topMessages: [String],
  topWinReasons: [String],  // AWS win/loss
  topLossReasons: [String], // AWS win/loss
}, { _id: false });

const AiCoachSchema = new mongoose.Schema({
  customerSays: String,
  suggestedResponse: String,
  recommendedCaseStudy: String,
  winProbability: mongoose.Schema.Types.Mixed,  // can be "HIGH" / "MEDIUM" / "LOW" or a number
  kvps: [String],
  // AWS AI Coach extras
  customerProfile: String,
  painPoints: [String],
  recommendedServices: [String],
  laurenServices: [String],
}, { _id: false });

const PricingTierSchema = new mongoose.Schema({
  tier: String,           // "Free" | "Starter" | "Professional" | "Enterprise"
  monthlyPrice: String,   // "$75/host/mo" or "Custom"
  annualPrice: String,
  features: [String],
}, { _id: false });

// ─── Industry Use Cases (AWS-specific) ────────────────────────────────────────
const IndustryUseCaseSchema = new mongoose.Schema({
  industry: String,
  icon: String,
  challenge: String,
  awsSolution: String,
  laurenServices: String,
  outcome: String,
}, { _id: false });

const ExecutiveMessagingSchema = new mongoose.Schema({
  role: String,
  color: String,
  points: [String],
}, { _id: false });

// ─── Main Product Schema ───────────────────────────────────────────────────────
const ProductSchema = new mongoose.Schema(
  {
    practice: { type: String, required: true, index: true },
    product: { type: String, required: true, index: true },
    competitors: { type: String, default: '' },

    overview: OverviewSchema,
    keyFeatures: [KeyFeatureSchema],
    discoveryQuestions: [String],
    recommendedResponses: [String],
    strengths: [String],
    weaknesses: [String],
    caseStudies: [CaseStudySchema],
    keyCustomers: [KeyCustomerSchema],
    competitorSummary: [CompetitorSummarySchema],
    featureMatrix: FeatureMatrixSchema,
    tcoData: TcoDataSchema,
    objectionHandling: [ObjectionSchema],
    winLoss: WinLossSchema,
    aiCoach: AiCoachSchema,

    // Pricing enrichment
    pricingTiers: [PricingTierSchema],

    // AWS-specific fields
    industryUseCases: [IndustryUseCaseSchema],
    executiveMessaging: [ExecutiveMessagingSchema],

    // Meta fields
    rawInputData: { type: mongoose.Schema.Types.Mixed, default: null },
    aiGenerated: { type: Boolean, default: false },
    aiGeneratedAt: { type: Date, default: null },
  },
  {
    timestamps: true,          // adds createdAt, updatedAt automatically
    minimize: false,           // preserve empty objects
  }
);

// Compound unique index — one document per practice+product pair
ProductSchema.index({ practice: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);

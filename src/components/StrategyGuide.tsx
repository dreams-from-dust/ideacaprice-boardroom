import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StrategyReport } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Milestone,
  CheckCircle,
  HelpCircle,
  Globe,
  Printer,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Percent,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  FlameKindling,
  XCircle
} from 'lucide-react';

interface StrategyGuideProps {
  idea: string;
  report: StrategyReport;
  onReset: () => void;
  onIntervene?: (defenseText: string) => void;
  isIntervening?: boolean;
  onPdfToast?: (msg: string) => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD', rate: 1 },
  { code: 'PKR', symbol: '₨', label: 'PKR', rate: 278 },
  { code: 'EUR', symbol: '€', label: 'EUR', rate: 0.92 },
  { code: 'GBP', symbol: '£', label: 'GBP', rate: 0.79 },
  { code: 'INR', symbol: '₹', label: 'INR', rate: 83 },
  { code: 'AED', symbol: 'د.إ', label: 'AED', rate: 3.67 },
  { code: 'SAR', symbol: '﷼', label: 'SAR', rate: 3.75 },
  { code: 'BDT', symbol: '৳', label: 'BDT', rate: 110 },
  { code: 'NGN', symbol: '₦', label: 'NGN', rate: 1580 },
  { code: 'BRL', symbol: 'R$', label: 'BRL', rate: 4.97 },
];

export default function StrategyGuide({ idea, report, onReset, onIntervene, isIntervening, onPdfToast }: StrategyGuideProps) {
  const {
    strengths = [],
    risks = [],
    mitigations = [],
    executionPlan = [],
    verdict,
    overallScore,
    subMetrics,
    marketOpportunity,
    suggestedPrice,
    suggestedUnitCost,
    suggestedMonthlyUnits,
    primaryMetricLabel,
    secondaryMetricLabel,
    projectedVolumeLabel,
    businessModelType,
  } = report as any;

  // Rejection gate: score below 20 = impossible/rejected idea
  const isRejected = overallScore < 20;

  const [defenseText, setDefenseText] = useState('');
  const [defenseError, setDefenseError] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  // Convert USD value → selected currency for display
  const toLocal = (usdVal: number) => Math.round(usdVal * selectedCurrency.rate);
  const fmt = (usdVal: number) => `${selectedCurrency.symbol}${toLocal(usdVal).toLocaleString()}`;
  // Convert local slider value back to USD for internal math
  const toUSD = (localVal: number) => localVal / selectedCurrency.rate;

  React.useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Sliders store values in SELECTED CURRENCY. All math converts back to USD first.
  // When currency changes, re-seed sliders in new currency units.
  const [estimatedPrice, setEstimatedPrice] = useState(suggestedPrice ?? 0);
  const [unitCost, setUnitCost] = useState(suggestedUnitCost ?? 0);
  const [monthlyUnits, setMonthlyUnits] = useState(suggestedMonthlyUnits ?? 0);

  // Re-seed sliders whenever currency changes (convert existing slider value to new currency)
  const prevCurrencyRef = React.useRef(CURRENCIES[0]);
  React.useEffect(() => {
    const prevRate = prevCurrencyRef.current.rate;
    const newRate = selectedCurrency.rate;
    if (prevRate !== newRate) {
      setEstimatedPrice(v => Math.round(v / prevRate * newRate));
      setUnitCost(v => Math.round(v / prevRate * newRate));
      prevCurrencyRef.current = selectedCurrency;
    }
  }, [selectedCurrency]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [report]);

  React.useEffect(() => {
    if (suggestedPrice !== undefined) setEstimatedPrice(suggestedPrice);
    if (suggestedUnitCost !== undefined) setUnitCost(suggestedUnitCost);
    if (suggestedMonthlyUnits !== undefined) setMonthlyUnits(suggestedMonthlyUnits);
  }, [suggestedPrice, suggestedUnitCost, suggestedMonthlyUnits]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return { text: 'text-peach', border: 'border-peach-medium/40', bg: 'bg-peach-medium/10', glow: 'shadow-peach-medium/10' };
    if (score >= 50) return { text: 'text-peach-medium', border: 'border-peach-medium/20', bg: 'bg-charcoal-light/60', glow: 'shadow-peach/5' };
    if (score >= 20) return { text: 'text-peach-dark', border: 'border-peach-dark/30', bg: 'bg-peach-dark/5', glow: 'shadow-peach-dark/5' };
    // Rejected
    return { text: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-900/10', glow: 'shadow-red-500/10' };
  };

  const scoreTheme = getScoreColor(overallScore);

  const resolvedSubMetrics = subMetrics || {
    marketMoat: Math.min(100, Math.round(overallScore * 0.92)),
    executionEase: Math.min(100, Math.round(overallScore * 0.85)),
    adoptionFeasibility: Math.min(100, Math.round(overallScore * 1.04)),
    financialViability: Math.min(100, Math.round(overallScore * 0.98)),
  };

  const handleExportPdf = () => {
    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const scoreColorHex = 'var(--color-peach-dark)';
    const statusText = overallScore >= 75 ? 'Approved' : overallScore >= 50 ? 'Conditional' : overallScore >= 20 ? 'High Risk' : 'Rejected';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IdeaCaprice Boardroom Report: ${idea.substring(0, 30).replace(/[-/()]/g, ' ')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; color: #111827; background-color: #ffffff; margin: 0; padding: 40px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid ${scoreColorHex}; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .header-logo { font-size: 22px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: -0.5px; }
    .header-logo span { color: ${scoreColorHex}; }
    .header-tag { font-size: 11px; font-family: monospace; color: #4b5563; letter-spacing: 1px; }
    .title { font-size: 28px; font-weight: 800; margin: 0 0 8px 0; color: #111827; }
    .meta { font-size: 12px; color: #4b5563; margin-bottom: 24px; }
    .idea-box { background: #f2f4f9; border-left: 4px solid ${scoreColorHex}; padding: 16px; border-radius: 4px; margin-bottom: 24px; font-size: 15px; color: #374151; font-style: italic; }
    .score-section { display: flex; gap: 24px; margin-bottom: 32px; align-items: center; padding: 20px 0; border-bottom: 1.5px solid var(--color-cream-dim); }
    .score-circle { width: 100px; height: 100px; border-radius: 50%; background: #fff; border: 5px solid ${scoreColorHex}; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-number { font-size: 32px; font-weight: 900; color: #111827; line-height: 1; }
    .score-label { font-size: 9px; color: #4b5563; font-weight: bold; margin-top: 2px; }
    .verdict-box { flex: 1; }
    .verdict-title { font-size: 11px; color: ${scoreColorHex}; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .verdict-text { font-size: 14.5px; font-weight: 600; margin: 0; color: #1f2937; }
    .section-title { font-size: 14px; color: ${scoreColorHex}; border-bottom: 1.5px solid var(--color-cream-dim); padding-bottom: 6px; margin-bottom: 12px; margin-top: 32px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
    ul { padding-left: 20px; margin: 0 0 16px 0; }
    li { margin-bottom: 8px; font-size: 13.5px; color: #1f2937; }
    .roadmap-item { display: flex; gap: 12px; margin-bottom: 12px; }
    .roadmap-num { width: 22px; height: 22px; border-radius: 4px; background: ${scoreColorHex}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; margin-top: 2px; flex-shrink: 0; }
    .roadmap-text { font-size: 13.5px; color: #1f2937; flex: 1; }
    .submetrics-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .submetric-card { background: transparent; padding: 8px 0; border-bottom: 1px solid var(--color-cream-dim); }
    .submetric-title { font-size: 11.5px; font-weight: bold; color: #374151; display: flex; justify-content: space-between; }
    .submetric-bar { height: 6px; background: #f2f4f9; border-radius: 3px; margin-top: 6px; overflow: hidden; }
    .submetric-fill { height: 100%; background: ${scoreColorHex}; border-radius: 3px; }
    .rejected-notice { background: #fef2f2; border: 2px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .rejected-notice h3 { color: #dc2626; font-size: 16px; margin: 0 0 8px 0; }
    .rejected-notice p { color: #374151; font-size: 13px; margin: 0; }
    .footer { border-top: 1.5px solid var(--color-cream-dim); margin-top: 40px; padding-top: 16px; font-size: 10px; color: #4b5563; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; background: #fff; } .container { border: none; box-shadow: none; padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="header-logo">IdeaCaprice <span>Boardroom</span></span>
      <span class="header-tag">Viability Archive Log</span>
    </div>
    <h1 class="title">Venture Strategy Guide</h1>
    <div class="meta">Convened via IdeaCaprice Boardroom Dynamic Helper • Date: ${todayStr} • Currency: ${selectedCurrency.code} (${selectedCurrency.symbol})</div>
    <div class="idea-box">"${idea.replace(/"/g, ' ')}"</div>
    <div class="score-section">
      <div class="score-circle">
        <span class="score-number">${overallScore}%</span>
        <span class="score-label">${statusText}</span>
      </div>
      <div class="verdict-box">
        <div class="verdict-title">Executive Verdict</div>
        <p class="verdict-text">${verdict.replace(/"/g, ' ')}</p>
      </div>
    </div>

    ${isRejected ? `
    <div class="rejected-notice">
      <h3>Proposal Rejected by Advisory Board</h3>
      <p>This idea has been assessed as fundamentally unfeasible or commercially non-viable. The board has determined that no standard business planning framework applies. Please review the executive verdict above for a full explanation.</p>
    </div>
    ` : `
    <div class="section-title">Safety and Success Breakdown</div>
    <div class="submetrics-grid">
      <div class="submetric-card">
        <div class="submetric-title"><span>Barriers to Replication (Moat)</span><span>${resolvedSubMetrics.marketMoat}%</span></div>
        <div class="submetric-bar"><div class="submetric-fill" style="width: ${resolvedSubMetrics.marketMoat}%"></div></div>
      </div>
      <div class="submetric-card">
        <div class="submetric-title"><span>Execution Ease</span><span>${resolvedSubMetrics.executionEase}%</span></div>
        <div class="submetric-bar"><div class="submetric-fill" style="width: ${resolvedSubMetrics.executionEase}%"></div></div>
      </div>
      <div class="submetric-card">
        <div class="submetric-title"><span>Adoption Feasibility</span><span>${resolvedSubMetrics.adoptionFeasibility}%</span></div>
        <div class="submetric-bar"><div class="submetric-fill" style="width: ${resolvedSubMetrics.adoptionFeasibility}%"></div></div>
      </div>
      <div class="submetric-card">
        <div class="submetric-title"><span>Financial Viability</span><span>${resolvedSubMetrics.financialViability}%</span></div>
        <div class="submetric-bar"><div class="submetric-fill" style="width: ${resolvedSubMetrics.financialViability}%"></div></div>
      </div>
    </div>

    <div class="section-title">Venture Profit and Revenue Estimator (Unit Economics)</div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px; color: #111827;">
      <thead><tr style="border-bottom: 1.5px solid var(--color-cream-dim); text-align: left;"><th style="padding: 8px 0; font-weight: bold;">Metric Component</th><th style="padding: 8px 0; text-align: right; font-weight: bold;">Value</th></tr></thead>
      <tbody>
        <tr style="border-bottom: 1px solid var(--color-cream-dim);"><td style="padding: 8px 0;">${primaryMetricLabel || 'Customer Selling Price'}</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${selectedCurrency.symbol}${estimatedPrice.toLocaleString()}</td></tr>
        <tr style="border-bottom: 1px solid var(--color-cream-dim);"><td style="padding: 8px 0;">${secondaryMetricLabel || 'Unit Cost (COGS)'}</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${selectedCurrency.symbol}${unitCost.toLocaleString()}</td></tr>
        <tr style="border-bottom: 1px solid var(--color-cream-dim);"><td style="padding: 8px 0;">${projectedVolumeLabel || 'Target Monthly Volume'}</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${monthlyUnits}</td></tr>
        <tr style="border-bottom: 1px solid var(--color-cream-dim); background-color: #f2f4f9;"><td style="padding: 8px 4px; font-weight: bold;">Gross Profit Margin</td><td style="padding: 8px 4px; text-align: right; font-weight: bold; color: var(--color-peach-dark);">${estimatedPrice > 0 ? Math.round(((estimatedPrice - unitCost) / estimatedPrice) * 100) : 0}%</td></tr>
        <tr style="border-bottom: 1px solid var(--color-cream-dim); background-color: #f2f4f9;"><td style="padding: 8px 4px; font-weight: bold;">Monthly Projected Revenues</td><td style="padding: 8px 4px; text-align: right; font-weight: bold;">${selectedCurrency.symbol}${(estimatedPrice * monthlyUnits).toLocaleString()}</td></tr>
        <tr style="background-color: #f2f4f9;"><td style="padding: 8px 4px; font-weight: bold; color: var(--color-peach-dark);">Monthly Net Profit</td><td style="padding: 8px 4px; text-align: right; font-weight: bold; color: var(--color-peach-dark);">${selectedCurrency.symbol}${((estimatedPrice - unitCost) * monthlyUnits).toLocaleString()}</td></tr>
      </tbody>
    </table>

    <div class="section-title">Main Strengths</div>
    <ul>${strengths.map((s: string) => `<li>${s.replace(/&/g, ' and ').replace(/</g, ' ')}</li>`).join('')}</ul>
    <div class="section-title">Main Risks</div>
    <ul>${risks.map((r: string) => `<li>${r.replace(/&/g, ' and ').replace(/</g, ' ')}</li>`).join('')}</ul>
    <div class="section-title">Ideas to Fix the Risks</div>
    <ul>${mitigations.map((m: string) => `<li>${m.replace(/&/g, ' and ').replace(/</g, ' ')}</li>`).join('')}</ul>
    <div class="section-title">Step by Step Launch Plan</div>
    <div>${executionPlan.map((step: string, idx: number) => `<div class="roadmap-item"><div class="roadmap-num">${idx + 1}</div><div class="roadmap-text">${step.replace(/&/g, ' and ').replace(/</g, ' ')}</div></div>`).join('')}</div>
    <div class="section-title">Market Size and Potential Customer Profile</div>
    <p style="font-size: 13.5px; color: #1f2937; line-height: 1.6;">${marketOpportunity.replace(/&/g, ' and ').replace(/</g, ' ')}</p>
    `}

    <div class="footer"><span>Official Dynamic Board Cache</span><span>IdeaCaprice AI Session Archive</span></div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 600); };</script>
</body>
</html>`;

    const triggerSaveProcedures = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const checkPerms = await Filesystem.checkPermissions();
          if (checkPerms.publicStorage !== 'granted') await Filesystem.requestPermissions();
          await Filesystem.writeFile({ path: `IdeaCaprice_boardroom_report_${Date.now()}.html`, data: htmlContent, directory: Directory.Documents, encoding: Encoding.UTF8 });
          if (onPdfToast) onPdfToast("Download completed");
          return;
        } catch (capErr) { console.error("Capacitor save failed:", capErr); }
      }

      let ok = false;
      try {
        const form = document.createElement('form');
        form.method = 'POST'; form.action = '/api/download-report'; form.target = '_blank'; form.style.display = 'none';
        const h = document.createElement('input'); h.type = 'hidden'; h.name = 'html'; h.value = htmlContent;
        const f = document.createElement('input'); f.type = 'hidden'; f.name = 'filename'; f.value = `IdeaCaprice_boardroom_report_${Date.now()}.html`;
        form.appendChild(h); form.appendChild(f); document.body.appendChild(form); form.submit(); document.body.removeChild(form);
        ok = true; if (onPdfToast) onPdfToast("Download completed");
      } catch { }

      if (!ok) {
        try {
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `IdeaCaprice_boardroom_report_${Date.now()}.html`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
          if (onPdfToast) onPdfToast("Download completed");
        } catch { }
      }
    };

    triggerSaveProcedures();
  };

  const handleDefenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defenseText.trim()) { setDefenseError('Please provide a defensive answer containing strategic mitigation details'); return; }
    if (defenseText.trim().length < 25) { setDefenseError('Your strategic defense must be at least twenty five letters to give the board adequate details'); return; }
    setDefenseError('');
    if (onIntervene) onIntervene(defenseText.trim());
  };

  const subMetricDescriptions = [
    { key: 'marketMoat', label: 'How hard to copy', value: resolvedSubMetrics.marketMoat, color: 'bg-peach', icon: ShieldCheck, comment: 'How hard it is for other companies to copy your idea.' },
    { key: 'executionEase', label: 'Ease of launch', value: resolvedSubMetrics.executionEase, color: 'bg-peach-medium', icon: Zap, comment: 'How easy and fast it is to build and launch your first version.' },
    { key: 'adoptionFeasibility', label: 'Ease of getting customers', value: resolvedSubMetrics.adoptionFeasibility, color: 'bg-peach', icon: Target, comment: 'How easily customers will find and pick your solution.' },
    { key: 'financialViability', label: 'Money and pricing potential', value: resolvedSubMetrics.financialViability, color: 'bg-peach-dark', icon: BarChart3, comment: 'Venture profit margins and revenue potential.' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 font-sans relative" id="strategy-guide-container">
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] bg-peach border-2 border-peach-medium text-ink font-sans font-extrabold text-xs sm:text-sm px-7 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 select-none w-max max-w-[90vw] whitespace-nowrap">
            <Printer className="w-4 h-4 shrink-0 animate-bounce" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 print:hidden text-sans" id="dashboard-navbar">
          <button onClick={onReset} id="back-to-boardroom-btn" className="flex items-center gap-2 text-xs font-sans text-cream-dim hover:text-peach transition-colors cursor-pointer self-start font-bold">
            <ChevronLeft className="w-4 h-4 text-peach-medium" />
            <span>Back to Boardroom</span>
          </button>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={handleExportPdf} id="print-pdf-report-btn" className="flex items-center gap-2 bg-charcoal hover:bg-charcoal-light border border-charcoal text-cream-dim hover:text-white px-4 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all">
              <Printer className="w-4 h-4 text-peach-medium" />
              <span>Export and Save PDF</span>
            </button>
            <button onClick={onReset} id="test-new-idea-btn" className="flex items-center gap-2 bg-peach hover:bg-peach-medium text-ink px-5 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all">
              <span>Retest Concept</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-charcoal/40 border-2 border-charcoal p-6 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md relative overflow-hidden print:bg-white print:text-stone-950 print:border-none print:shadow-none print:p-0">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-peach-dark via-peach-medium to-peach print:hidden" />

          {/* Idea Banner */}
          <div className="bg-charcoal border-2 border-charcoal-light p-5 md:p-6 rounded-2xl mb-8">
            <span className="text-xs font-bold text-peach-medium font-sans tracking-wide block mb-1.5">Input Venture Idea</span>
            <p className="text-cream text-base font-semibold leading-relaxed font-sans">"{idea}"</p>
          </div>

          {/* Score + Verdict */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 pb-8 border-b-2 border-charcoal">
            <div className={`md:col-span-1 rounded-2xl border-2 p-4 sm:p-6 flex flex-col items-center justify-center text-center ${scoreTheme.border} ${scoreTheme.bg} ${scoreTheme.glow}`}>
              <span className="text-xs font-bold text-cream-dim/60 font-sans tracking-wide mb-2">Venture Viability</span>
              <div className="relative w-32 h-32 flex items-center justify-center print:hidden select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: overallScore }, { value: 100 - overallScore }]} cx="50%" cy="50%" innerRadius={36} outerRadius={46} startAngle={90} endAngle={-270} dataKey="value" stroke="none" isAnimationActive animationDuration={1000}>
                      <Cell fill={isRejected ? '#ef4444' : overallScore >= 75 ? 'var(--color-peach-medium)' : 'var(--color-peach-dark)'} />
                      <Cell fill="var(--color-charcoal-soft)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-sans">
                  <span className={`text-3xl font-extrabold tracking-tighter leading-none ${scoreTheme.text}`}>{overallScore}%</span>
                  <span className="text-sm font-bold text-cream-dim/40 tracking-wide leading-none mt-1">Score</span>
                </div>
              </div>
              <div className="mt-4 px-3 py-1.5 rounded-xl text-xs font-bold font-sans bg-charcoal border border-charcoal-light text-peach flex items-center justify-center gap-1.5 w-full">
                <span className={`w-1.5 h-1.5 rounded-full ${isRejected ? 'bg-red-400 animate-pulse' : overallScore >= 75 ? 'bg-peach' : overallScore >= 50 ? 'bg-peach-medium' : 'bg-peach-dark animate-pulse'}`} />
                <span>{isRejected ? 'Rejected' : overallScore >= 75 ? 'Approved' : overallScore >= 50 ? 'Conditional' : 'High Risk'}</span>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                {isRejected ? <XCircle className="w-5 h-5 text-red-400" /> : <ShieldCheck className="w-5 h-5 text-peach-medium" />}
                <h3 className="text-xs font-bold text-cream-dim font-sans">Executive Verdict Summary</h3>
              </div>
              <p className="text-cream text-base md:text-lg leading-relaxed font-sans font-semibold">{verdict}</p>
              <p className="text-cream-dim/40 text-xs mt-3 font-sans">Compiled on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. This report was evaluated and dynamically rated.</p>
            </div>
          </div>

          {/* REJECTION GATE: show only verdict block above when rejected */}
          {isRejected ? (
            <div className="mb-10 bg-red-900/10 border-2 border-red-500/30 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-base font-extrabold text-red-300 mb-3 font-sans">Proposal Rejected by Advisory Board</h3>
              <p className="text-cream-dim/70 text-sm leading-relaxed max-w-2xl mx-auto font-sans">
                This idea has been assessed as fundamentally unfeasible by the board. The advisory committee has determined that no viable commercial framework applies to this proposal in its current form. Please review the executive verdict above for the full explanation, then submit a revised or alternative idea below.
              </p>
              <button onClick={onReset} className="mt-6 inline-flex items-center gap-2 bg-peach hover:bg-peach-medium text-ink font-bold px-8 py-3.5 rounded-2xl text-xs cursor-pointer transition-all shadow-lg">
                <span>Submit a New Idea</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Submetrics */}
              <div className="mb-10 bg-charcoal border border-charcoal-light p-4 sm:p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4.5 h-4.5 text-peach-medium" />
                  <h3 className="text-xs font-bold text-cream-dim tracking-wide font-sans">Viability Submetrics Breakdown</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subMetricDescriptions.map((metric) => {
                    const MetricIcon = metric.icon;
                    return (
                      <div key={metric.key} className="flex flex-col gap-1.5 font-sans">
                        <div className="flex items-center justify-between text-xs text-cream-dim">
                          <span className="flex items-center gap-2 font-bold text-cream-dim/90"><MetricIcon className="w-3.5 h-3.5 text-peach-medium" />{metric.label}</span>
                          <span className="font-bold text-cream font-sans">{metric.value}%</span>
                        </div>
                        <div className="w-full bg-charcoal-dark rounded-full h-2 border border-charcoal overflow-hidden p-[1px]">
                          <div className={`h-full ${metric.color} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(Math.max(metric.value, 4), 100)}%` }} />
                        </div>
                        <span className="text-xs text-cream-dim/50 font-normal">{metric.comment}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bento Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-8">
                  {strengths.length > 0 && (
                    <div className="bg-gradient-to-br from-charcoal/90 to-charcoal-light/40 border-2 border-peach-medium/30 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:border-peach hover:shadow-2xl hover:shadow-peach-medium/5 hover:translate-y-[-2px] transition-all duration-350 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-peach-medium/5 rounded-full blur-xl pointer-events-none group-hover:bg-peach-medium/10 transition-colors" />
                      <div className="flex items-center gap-3.5 border-b border-charcoal pb-4 mb-5">
                        <span className="p-2.5 rounded-2xl bg-peach-medium/15 border border-peach-medium/30 text-peach group-hover:scale-110 transition-transform"><TrendingUp className="w-5 h-5 shadow-sm" /></span>
                        <div>
                          <h4 className="font-extrabold text-peach text-sm sm:text-base font-sans">Strategic Strengths Advocated</h4>
                          <p className="text-xs text-cream-dim/40 font-sans tracking-wide mt-0.5">Foundational venture advantages</p>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        {strengths.map((str: string, index: number) => (
                          <li key={index} className="flex gap-3 text-cream-dim hover:text-cream text-sm leading-relaxed transition-colors duration-200">
                            <CheckCircle className="w-5.5 h-5.5 shrink-0 text-peach mt-0.5" />
                            <span className="font-sans font-normal">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {mitigations.length > 0 && (
                    <div className="bg-gradient-to-br from-charcoal/90 to-charcoal-light/40 border border-charcoal p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:border-peach-medium hover:shadow-2xl hover:shadow-peach/5 hover:translate-y-[-2px] transition-all duration-350 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-peach/5 rounded-full blur-xl pointer-events-none group-hover:bg-peach/10 transition-colors" />
                      <div className="flex items-center gap-3.5 border-b border-charcoal pb-4 mb-5">
                        <span className="p-2.5 rounded-2xl bg-peach/10 border border-peach/20 text-peach-medium group-hover:scale-110 transition-transform"><Lightbulb className="w-5 h-5" /></span>
                        <div>
                          <h4 className="font-extrabold text-peach-medium text-sm sm:text-base font-sans">Systemic Mitigations Offsets</h4>
                          <p className="text-xs text-cream-dim/40 font-sans tracking-wide mt-0.5">Tactical risk hedge mechanisms</p>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        {mitigations.map((mit: string, index: number) => (
                          <li key={index} className="flex gap-3 text-cream-dim hover:text-cream text-sm leading-relaxed transition-colors duration-200">
                            <span className="w-6.5 h-6.5 flex items-center justify-center rounded-xl bg-peach-medium/15 border border-peach-medium/40 text-peach text-xs font-bold font-mono shrink-0 shadow-inner">m{index + 1}</span>
                            <span className="pt-0.5 font-sans font-normal">{mit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {risks.length > 0 && (
                    <div className="bg-gradient-to-br from-charcoal/95 to-peach-dark/10 border-2 border-peach-dark/30 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:border-peach-dark hover:shadow-2xl hover:shadow-peach-dark/5 hover:translate-y-[-2px] transition-all duration-350 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-peach-dark/5 rounded-full blur-xl pointer-events-none group-hover:bg-peach-dark/10 transition-colors" />
                      <div className="flex items-center gap-3.5 border-b border-charcoal pb-4 mb-5">
                        <span className="p-2.5 rounded-xl bg-peach-dark/15 border border-peach-dark/30 text-peach-dark group-hover:scale-110 transition-transform"><AlertTriangle className="w-5 h-5" /></span>
                        <div>
                          <h4 className="font-extrabold text-[#ff9e9e] text-sm sm:text-base font-sans">Critical Risks Challenged</h4>
                          <p className="text-xs text-peach-dark/60 font-sans tracking-wide mt-0.5">Top level operational barriers</p>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        {risks.map((risk: string, index: number) => (
                          <li key={index} className="flex gap-3 text-cream-dim hover:text-cream text-sm leading-relaxed transition-colors duration-200">
                            <div className="w-2.5 h-2.5 rounded-full bg-peach-dark shrink-0 mt-2 shadow-md" />
                            <span className="font-sans font-normal">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {executionPlan.length > 0 && (
                    <div className="bg-gradient-to-br from-charcoal/90 to-charcoal-light/40 border border-charcoal p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:border-peach-medium hover:shadow-2xl hover:shadow-peach/5 hover:translate-y-[-2px] transition-all duration-350 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-peach-medium/5 rounded-full blur-xl pointer-events-none group-hover:bg-peach-medium/10 transition-colors" />
                      <div className="flex items-center gap-3.5 border-b border-charcoal pb-4 mb-5">
                        <span className="p-2.5 rounded-2xl bg-peach-medium/10 border border-peach-medium/20 text-peach group-hover:scale-110 transition-transform"><Milestone className="w-5 h-5" /></span>
                        <div>
                          <h4 className="font-extrabold text-peach text-sm sm:text-base font-sans">Launch Roadmap Milestones</h4>
                          <p className="text-xs text-cream-dim/40 font-sans tracking-wide mt-0.5">Execution track timetable</p>
                        </div>
                      </div>
                      <div className="space-y-5">
                        {executionPlan.map((step: string, index: number) => (
                          <div key={index} className="flex gap-4 items-start pb-1 rounded-xl transition-colors">
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-8 h-8 rounded-xl bg-charcoal border-2 border-charcoal-light text-peach text-sm flex items-center justify-center font-bold font-sans">{index + 1}</div>
                              {index < executionPlan.length - 1 && <div className="w-[1.5px] h-9 bg-charcoal mt-2" />}
                            </div>
                            <div className="text-cream-dim text-sm leading-relaxed pt-1.5 font-sans font-normal hover:text-cream transition-colors">{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Market Opportunity */}
              <div className="bg-gradient-to-r from-charcoal/95 via-charcoal-light/50 to-charcoal/95 border-2 border-charcoal p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] mb-12 relative overflow-hidden group hover:border-peach-medium/40 transition-all duration-300">
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-peach-medium/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-3.5 border-b border-charcoal pb-4 mb-5">
                  <span className="p-2.5 rounded-2xl bg-peach-medium/10 border border-peach-medium/20 text-peach group-hover:scale-110 transition-transform"><Globe className="w-5 h-5" /></span>
                  <div>
                    <h4 className="font-extrabold text-peach text-sm sm:text-base font-sans">Market Sizing and Audience Landscape</h4>
                    <p className="text-xs text-cream-dim/40 font-sans tracking-wide mt-0.5">Evaluation and target customer depth</p>
                  </div>
                </div>
                <p className="text-cream-dim text-sm leading-relaxed font-sans font-normal whitespace-pre-line group-hover:text-cream transition-colors">{marketOpportunity}</p>
              </div>

              {/* Unit Economics Sandbox — only shown when LLM provided real numbers */}
              {estimatedPrice > 0 && (
                <div className="mb-12 bg-gradient-to-b from-charcoal to-charcoal-dark border-2 border-charcoal-light p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden" id="economics-projector">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-peach-medium/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-charcoal pb-5 mb-8">
                    <div className="flex items-center gap-3.5 font-sans">
                      <span className="p-3 rounded-2xl bg-peach-medium/15 border border-peach-medium/30 text-peach animate-pulse"><Percent className="w-5.5 h-5.5" /></span>
                      <div>
                        <h4 className="font-extrabold text-cream text-base tracking-wide">Venture Profit and Revenue Estimator</h4>
                        {businessModelType && <p className="text-xs text-peach-medium/70 font-sans mt-0.5">{businessModelType}</p>}
                        <p className="text-xs text-peach-medium font-sans tracking-wider mt-1 flex items-center gap-1.5 font-bold"><Sparkles className="w-3.5 h-3.5" /> Unit Economics Sandbox</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-cream-dim/60 font-sans max-w-sm sm:text-right leading-relaxed">Drag sliders to preview real-time margin changes.</div>
                      {/* Currency picker */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCurrencyMenu(v => !v)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal border-2 border-charcoal-light hover:border-peach-medium/50 text-xs font-bold text-cream cursor-pointer transition-all"
                        >
                          <span className="text-peach-medium">{selectedCurrency.symbol}</span>
                          <span>{selectedCurrency.code}</span>
                          <span className="text-cream-dim/40 text-xs">▾</span>
                        </button>
                        {showCurrencyMenu && (
                          <div className="absolute right-0 mt-1 w-44 bg-charcoal-dark border-2 border-charcoal-light rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="px-3 py-2 border-b border-charcoal text-xs text-cream-dim/50 font-bold tracking-wide">Select currency</div>
                            {CURRENCIES.map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => { setSelectedCurrency(c); setShowCurrencyMenu(false); }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${selectedCurrency.code === c.code ? 'bg-peach/15 text-peach font-bold' : 'text-cream-dim hover:bg-charcoal hover:text-cream'}`}
                              >
                                <span className="font-mono w-6 text-peach-medium">{c.symbol}</span>
                                <span className="flex-1 text-left ml-1">{c.code}</span>
                                {selectedCurrency.code === c.code && <span className="text-peach text-xs">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
                      <div className="bg-charcoal-dark/30 border border-charcoal-light/60 p-4.5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-sans font-bold text-peach">Step A: {primaryMetricLabel || 'Selling Price'}</span>
                            <h5 className="text-xs font-bold text-cream font-sans mt-0.5">What customers pay you</h5>
                          </div>
                          <span className="text-xl font-bold font-sans text-peach">{selectedCurrency.symbol}{estimatedPrice.toLocaleString()}</span>
                        </div>
                        <input type="range" min="1" max={Math.round(1000 * selectedCurrency.rate)} value={estimatedPrice} onChange={(e) => { const val = Number(e.target.value); setEstimatedPrice(val); if (val < unitCost) setUnitCost(Math.max(0, val - 1)); }} className="w-full h-1.5 bg-charcoal rounded-lg appearance-none cursor-pointer accent-peach" />
                        <p className="text-xs leading-relaxed text-cream-dim/60 font-sans">The retail price or recurring fee charged to a single customer for one transaction.</p>
                      </div>

                      <div className="bg-charcoal-dark/30 border border-charcoal-light/60 p-4.5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-sans font-bold text-peach-medium">Step B: {secondaryMetricLabel || 'Unit Cost (COGS)'}</span>
                            <h5 className="text-xs font-bold text-cream font-sans mt-0.5">Direct cost to deliver</h5>
                          </div>
                          <span className="text-xl font-bold font-sans text-peach-medium">{selectedCurrency.symbol}{unitCost.toLocaleString()}</span>
                        </div>
                        <input type="range" min="0" max={Math.max(Math.round(10 * selectedCurrency.rate), estimatedPrice - 1)} value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} className="w-full h-1.5 bg-charcoal rounded-lg appearance-none cursor-pointer accent-peach-medium" />
                        <p className="text-xs leading-relaxed text-cream-dim/60 font-sans">What you must spend to create or deliver each unit including materials, fulfillment, and platform fees.</p>
                      </div>

                      <div className="bg-charcoal-dark/30 border border-charcoal-light/60 p-4.5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-sans font-bold text-cream-dim/65">Step C: {projectedVolumeLabel || 'Monthly Volume'}</span>
                            <h5 className="text-xs font-bold text-cream font-sans mt-0.5">Target monthly customers</h5>
                          </div>
                          <span className="text-xl font-bold font-sans text-cream">{monthlyUnits} <span className="text-xs font-semibold text-cream-dim/50">units</span></span>
                        </div>
                        <input type="range" min="1" max="5000" step="10" value={monthlyUnits} onChange={(e) => setMonthlyUnits(Number(e.target.value))} className="w-full h-1.5 bg-charcoal rounded-lg appearance-none cursor-pointer accent-peach-light" />
                        <p className="text-xs leading-relaxed text-cream-dim/60 font-sans">The estimated number of transactions or active subscribers you target per month.</p>
                      </div>
                    </div>

                    {/* Change the layout wrapper to let text handle smaller widths better */}
<div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
  
  {/* Card 1: Gross Profit Margin */}
  <div className="bg-charcoal-dark/50 border border-charcoal-light p-5 rounded-2xl flex flex-col justify-between text-left min-w-0">
    <div>
      <span className="text-xs font-bold text-peach-medium/80 font-sans uppercase block">Profit Percentage Share</span>
      <h4 className="text-xs font-bold text-cream mt-0.5 font-sans leading-none">Gross Profit Margin</h4>
    </div>
    <div className="my-4">
      {/* Added tracking-tight */}
      <div className="text-3xl font-black font-sans text-peach leading-none tracking-tight">
        {estimatedPrice > 0 ? Math.round(((estimatedPrice - unitCost) / estimatedPrice) * 100) : 0}%
      </div>
    </div>
    <div className="space-y-1.5 pt-2 border-t border-charcoal">
      <p className="text-xs leading-relaxed text-cream-dim/60">Price minus cost divided by price.</p>
    </div>
  </div>

  {/* Card 2: Monthly Revenues */}
  {/* Note the addition of min-w-0 on the card container to prevent grid flex blowout */}
  <div className="bg-charcoal-dark/50 border border-charcoal-light p-5 rounded-2xl flex flex-col justify-between text-left min-w-0">
    <div>
      <span className="text-xs font-bold text-cream-dim/60 font-sans uppercase block">Total Store Sales</span>
      <h4 className="text-xs font-bold text-cream mt-0.5 font-sans leading-none">Monthly Revenues</h4>
    </div>
    <div className="my-4">
      {/* Changed text-3xl to text-2xl sm:text-3xl and added break-words tracking-tight */}
      <div className="text-2xl sm:text-3xl font-black font-sans text-cream leading-none tracking-tight break-words">
        {selectedCurrency.symbol}{(estimatedPrice * monthlyUnits).toLocaleString()}
      </div>
    </div>
    <div className="space-y-1.5 pt-2 border-t border-charcoal">
      <p className="text-xs leading-relaxed text-cream-dim/60">Price multiplied by monthly customers.</p>
    </div>
  </div>

  {/* Card 3: Monthly Net Profit */}
  <div className="bg-charcoal-dark/50 border border-charcoal-light p-5 rounded-2xl flex flex-col justify-between text-left min-w-0">
    <div>
      <span className="text-xs font-bold text-peach-medium font-sans uppercase block">Actual Earnings</span>
      <h4 className="text-xs font-bold text-cream mt-0.5 font-sans leading-none">Monthly Net Profit</h4>
    </div>
    <div className="my-4">
      {/* Changed text-3xl to text-2xl sm:text-3xl and added break-words tracking-tight */}
      <div className="text-2xl sm:text-3xl font-black font-sans text-peach-medium leading-none tracking-tight break-words">
        {selectedCurrency.symbol}{((estimatedPrice - unitCost) * monthlyUnits).toLocaleString()}
      </div>
    </div>
    <div className="space-y-1.5 pt-2 border-t border-charcoal">
      <p className="text-xs leading-relaxed text-cream-dim/60">Price minus cost multiplied by customers.</p>
    </div>
  </div>

  {/* Card 4: Board Margin Security */}
  <div className="bg-charcoal-dark/50 border border-charcoal-light p-5 rounded-2xl flex flex-col justify-between text-left min-w-0">
    {/* Keep this card as is, but min-w-0 ensures layout calculations stay stable */}
    <div>
      <span className="text-xs font-bold text-cream-dim/65 font-sans uppercase block">Board Margin Security</span>
      <h4 className="text-xs font-bold text-cream mt-0.5 font-sans leading-none">Estimated Margin Health</h4>
    </div>
    <div className="my-4 animate-pulse">
      <div className={`text-xs font-extrabold tracking-wide uppercase ${((estimatedPrice - unitCost) / estimatedPrice) >= 0.6 ? 'text-peach' : ((estimatedPrice - unitCost) / estimatedPrice) >= 0.35 ? 'text-peach-medium' : 'text-peach-dark'}`}>
        {((estimatedPrice - unitCost) / estimatedPrice) >= 0.6 ? 'High safety margin' : ((estimatedPrice - unitCost) / estimatedPrice) >= 0.35 ? 'Steady healthy profile' : 'Low margin warning'}
      </div>
    </div>
    <div className="space-y-1.5 pt-2 border-t border-charcoal">
      <p className="text-xs leading-relaxed text-cream-dim/70">
        {((estimatedPrice - unitCost) / estimatedPrice) >= 0.6 ? 'Excellent safety buffer.' : ((estimatedPrice - unitCost) / estimatedPrice) >= 0.35 ? 'Solid baseline framework.' : 'Warning: High risk layout constraint.'}
      </p>
    </div>
  </div>

</div>
                  </div>
                </div>
              )}

              {/* Strategic Intervention */}
              {onIntervene && (
                <div className="bg-gradient-to-r from-charcoal/95 via-[var(--color-charcoal-light)] to-charcoal/95 border-2 border-dashed border-peach-medium/40 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] print:hidden relative overflow-hidden mb-8 shadow-2xl" id="boardroom-strategic-intervention">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-peach/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-peach-medium/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-charcoal">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 rounded-xl bg-peach-medium/15 text-peach-medium border border-peach-medium/30 animate-pulse"><FlameKindling className="w-5 h-5" /></span>
                      <div>
                        <h3 className="font-extrabold text-xs sm:text-sm text-cream tracking-wide font-sans">Directors Strategic Counter Defense Measure</h3>
                        <p className="text-xs text-peach-medium font-sans uppercase tracking-widest font-bold mt-0.5">Active intervention node enabled</p>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto text-xs bg-peach-medium/20 border border-peach-medium/40 text-peach px-2.5 py-1 rounded-lg uppercase font-mono tracking-widest font-black">Interactive Re Pitch Code</span>
                  </div>
                  <p className="text-cream-dim/80 text-xs sm:text-sm leading-relaxed mb-6 max-w-4xl font-sans">Does the advisory boardroom verdict pose unexpected adoption or revenue hurdles? Analyze the critical risks compiled above. Take command, formulate a firm defensive strategy or tactical mitigation counter response like direct distribution channels, regulatory moats, custom APIs, or corporate partners, and submit it below to update the directors dynamic scoring.</p>
                  <form onSubmit={handleDefenseSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <textarea value={defenseText} onChange={(e) => { setDefenseText(e.target.value); if (e.target.value.length >= 25) setDefenseError(''); }} disabled={isIntervening} rows={4} placeholder="We mitigate customer acquisition resistance by launching local partner runs to bypass offline ads." className="w-full bg-charcoal-dark border-2 border-charcoal-light hover:border-peach-medium/50 text-cream rounded-[1.5rem] p-5 text-sm sm:text-base placeholder-cream-dim/20 focus:outline-none focus:ring-2 focus:ring-peach transition-all resize-none font-sans leading-relaxed shadow-inner" />
                      <div className="flex justify-end p-1"><span className="text-xs text-cream-dim/40 font-mono tracking-widest font-black uppercase bg-charcoal-dark px-2.5 py-1 rounded-md border border-charcoal-light">{defenseText.length} CHARACTERS</span></div>
                    </div>
                    {defenseError && <div className="text-peach text-xs font-sans font-bold flex items-center gap-2 pl-2"><AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" /><span>{defenseError}</span></div>}
                    <button type="submit" disabled={isIntervening} className="w-full sm:w-auto self-end flex items-center justify-center gap-2.5 bg-peach hover:bg-peach-medium text-ink font-extrabold px-8 py-4 rounded-[1.25rem] transition-all hover:scale-[1.02] shadow-lg disabled:opacity-50 cursor-pointer text-xs">
                      {isIntervening ? (<><div className="w-4 h-4 border-2 border-ink border-t-cream rounded-full animate-spin" /><span>Transmitting Defense Thesis to Board...</span></>) : (<><Sparkles className="w-4 h-4" /><span>Convene Defense Thesis and Re-Score Proposal</span></>)}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
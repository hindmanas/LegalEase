import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, FileText, MessageSquareText, RefreshCw, ShieldAlert, DollarSign, HelpCircle, Info, Sparkles, MessageSquare, Scale, CheckCircle2, User, AlertOctagon, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useTranslation } from 'react-i18next';

function RiskBadge({ level }) {
  const { t } = useTranslation();
  const color = level === 'high' ? 'bg-clay/10 text-clay' : level === 'medium' ? 'bg-brass/15 text-[#8a5c1d]' : 'bg-fern/10 text-fern';
  const labelMap = {
    high: t('common.high', 'High'),
    medium: t('common.medium', 'Medium'),
    low: t('common.low', 'Low')
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${color}`}>{labelMap[level] || labelMap.low}</span>;
}

export default function AnalysisPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  async function load() {
    const data = await api.getDocument(id);
    setDocument(data.document);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  async function rerunAnalysis() {
    setAnalyzing(true);
    setError('');
    try {
      const data = await api.analyzeDocument(id);
      setDocument(data.document);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  const analysis = document?.analysis;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-fern">{t('analysis.tag')}</p>
            <h1 className="mt-2 max-w-4xl font-display text-3xl font-bold sm:text-4xl">{document?.originalName}</h1>
            <p className="mt-2 text-slate-600">{t('analysis.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to={`/app/chat/${id}`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                <MessageSquareText size={17} />
                {t('analysis.btnChat')}
              </Button>
            </Link>
            <a href={api.downloadReport(id)} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Download size={17} />
                {t('analysis.btnReport')}
              </Button>
            </a>
            <Button onClick={rerunAnalysis} disabled={analyzing} className="w-full sm:w-auto">
              <RefreshCw size={17} className={analyzing ? 'animate-spin' : ''} />
              {t('analysis.btnReanalyze')}
            </Button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-clay/10 px-4 py-3 text-sm font-semibold text-clay">{error}</p>}

        {!analysis ? (
          <Card className="p-8 text-center">
            <FileText size={34} className="mx-auto text-sage" />
            <h2 className="mt-4 font-display text-xl font-bold">{t('analysis.noAnalysisTitle')}</h2>
            <p className="mt-2 text-sm text-slate-600">{t('analysis.noAnalysisDesc')}</p>
            <Button onClick={rerunAnalysis} className="mt-5">{t('analysis.btnGenerate')}</Button>
          </Card>
        ) : (
          <>
            {/* Hero Metrics Row */}
            <div className="grid gap-5 sm:grid-cols-3">
              <Card className="p-5 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
                <div className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('analysis.documentTypeLabel', 'Document Type')}</p>
                  <p className="mt-1 font-display text-lg font-bold text-slate-800 capitalize">
                    {analysis.documentType || 'Legal Document'}
                  </p>
                </div>
              </Card>

              <Card className="p-5 bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('analysis.safetyScoreLabel', 'Safety Score')}</p>
                  <span className={`text-sm font-bold ${
                    (analysis.safetyScore || 0) >= 80 ? 'text-emerald-600' : (analysis.safetyScore || 0) >= 50 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {analysis.safetyScore !== undefined ? `${analysis.safetyScore}/100` : 'N/A'}
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (analysis.safetyScore || 0) >= 80 ? 'bg-emerald-500' : (analysis.safetyScore || 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${analysis.safetyScore !== undefined ? analysis.safetyScore : 50}%` }}
                  ></div>
                </div>
              </Card>

              <Card className="p-5 flex items-center justify-between bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`grid size-12 place-items-center rounded-xl shrink-0 ${
                    analysis.overallRiskLevel === 'low' ? 'bg-emerald-50 text-emerald-600' : analysis.overallRiskLevel === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('analysis.riskLevelLabel', 'Overall Risk Level')}</p>
                    <p className="mt-1 font-display text-lg font-bold text-slate-800 capitalize">
                      {t(`common.${analysis.overallRiskLevel}`, analysis.overallRiskLevel || 'low')}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                  analysis.overallRiskLevel === 'low' ? 'bg-emerald-100 text-emerald-800' : analysis.overallRiskLevel === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {analysis.overallRiskLevel || 'low'}
                </span>
              </Card>
            </div>

            {/* Row 2: Executive Summary & Simplified Summary */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-100">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Sparkles size={19} className="text-blue-500" />
                  {t('analysis.executiveSummaryTitle', 'Executive Summary')}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-700 whitespace-pre-line">
                  {analysis.executiveSummary || analysis.summary || 'No executive summary available.'}
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-white to-blue-50/10 border border-slate-100">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Info size={19} className="text-brandBlue" />
                  {t('analysis.simplifiedSummaryTitle', 'Simplified Summary')}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-700 whitespace-pre-line">
                  {analysis.simplifiedSummary || analysis.simplifiedText || 'No simplified summary available.'}
                </p>
              </Card>
            </div>

            {/* Row 3: Key Information & Recommendations */}
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <FileText size={19} className="text-brandBlue" />
                  {t('analysis.keyInfoTitle')}
                </h2>
                {analysis.keyInformation ? (
                  <ul className="space-y-3 mt-4 text-sm text-slate-700">
                    {analysis.keyInformation.split('\n').filter(Boolean).map((line, idx) => (
                      <li key={idx} className="flex items-start gap-2 border-b border-slate-50 pb-2 last:border-0">
                        <span className="text-brandBlue mt-1 font-bold shrink-0">•</span>
                        <span>{line.replace(/^•\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">{t('analysis.keyInfoEmpty')}</p>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 size={19} className="text-emerald-600" />
                  {t('analysis.recommendationsTitle', 'Recommendations')}
                </h2>
                {analysis.recommendations?.length ? (
                  <ul className="space-y-3 mt-4 text-sm text-slate-700">
                    {analysis.recommendations.map((recommendation, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-emerald-50/30 border border-emerald-100/50 rounded-xl p-3">
                        <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">{t('analysis.recommendationsEmpty', 'No specific recommendations generated.')}</p>
                )}
              </Card>
            </div>

            {/* Row 4: Obligations & User Responsibilities */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Scale size={19} className="text-brandBlue" />
                  {t('analysis.obligationsTitle', 'Legal Obligations')}
                </h2>
                <div className="mt-4 space-y-3">
                  {analysis.legalObligations?.length ? (
                    analysis.legalObligations.map((item, index) => (
                      <div key={index} className="rounded-lg border border-slate-100 p-4 bg-slate-50/40">
                        <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                        <p className="mt-1.5 text-xs leading-5 text-slate-600">{item.obligation}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">{t('analysis.obligationsEmpty', 'No legal obligations identified.')}</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-slate-800">
                  <User size={19} className="text-brandBlue" />
                  {t('analysis.responsibilitiesTitle', 'User Responsibilities')}
                </h2>
                <div className="mt-4 space-y-3">
                  {analysis.userResponsibilities?.length ? (
                    analysis.userResponsibilities.map((item, index) => (
                      <div key={index} className="rounded-lg border border-slate-100 p-4 bg-slate-50/40">
                        <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                        <p className="mt-1.5 text-xs leading-5 text-slate-600">{item.responsibility}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">{t('analysis.responsibilitiesEmpty', 'No specific user responsibilities identified.')}</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Row 5: Important Clauses & Missing/Suspicious Clauses */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <FileText size={19} className="text-brandBlue" />
                  {t('analysis.clausesTitle')}
                </h2>
                <div className="mt-4 space-y-3">
                  {(analysis.importantClauses || analysis.clauses)?.length ? (
                    (analysis.importantClauses || analysis.clauses).map((clause, index) => (
                      <div key={`${clause.title}-${index}`} className="rounded-lg border border-line p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-sm text-slate-800">{clause.title}</h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 shrink-0">{clause.category}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">{clause.explanation}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">{t('analysis.clausesEmpty')}</p>
                  )}
                </div>
              </Card>

              <Card className="p-6 border border-rose-100">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-rose-700">
                  <AlertOctagon size={19} className="text-rose-600" />
                  {t('analysis.missingClausesTitle', 'Missing & Suspicious Clauses')}
                </h2>
                <div className="mt-4 space-y-3">
                  {analysis.missingSuspiciousClauses?.length ? (
                    analysis.missingSuspiciousClauses.map((item, index) => (
                      <div key={index} className="rounded-lg border border-rose-100 bg-rose-50/10 p-4">
                        <h3 className="font-bold text-sm text-rose-900">{item.title}</h3>
                        <p className="mt-2 text-xs leading-5 text-slate-700">{item.explanation}</p>
                        {item.impact && (
                          <p className="mt-2 text-xs font-semibold text-rose-700 bg-rose-50/50 p-2 rounded">
                            Impact: {item.impact}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">{t('analysis.missingClausesEmpty', 'No standard missing clauses or highly suspicious language flagged.')}</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Row 6: Risks & Hidden Charges */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-6 border border-clay/20 bg-clay/5">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-clay">
                  <ShieldAlert size={19} className="text-clay" />
                  {t('analysis.risksTitle')}
                </h2>
                <div className="mt-4 space-y-3">
                  {(analysis.risksRedFlags || analysis.risks)?.length ? (
                    (analysis.risksRedFlags || analysis.risks).map((risk, index) => (
                      <div key={`${risk.title}-${index}`} className="rounded-lg border border-clay/20 bg-clay/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-sm text-slate-800">{risk.title}</h3>
                          <RiskBadge level={risk.level} />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-700">{risk.explanation}</p>
                        {risk.suggestion && <p className="mt-2.5 text-xs font-semibold text-clay">{risk.suggestion}</p>}
                        {risk.excerpt && (
                          <p className="mt-2 text-2xs italic text-slate-500 bg-white/40 p-2 rounded border border-slate-100">
                            "{risk.excerpt}"
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">{t('analysis.risksEmpty')}</p>
                  )}
                </div>
              </Card>

              <Card className="p-6 border border-amber-200 bg-amber-50/5">
                <h2 className="font-display text-xl font-bold text-amber-700 flex items-center gap-2">
                  <DollarSign size={19} className="text-amber-600" />
                  {t('analysis.chargesTitle')}
                </h2>
                <div className="mt-4 space-y-3">
                  {(analysis.hiddenChargesPenalties || analysis.hiddenCharges)?.length ? (
                    (analysis.hiddenChargesPenalties || analysis.hiddenCharges).map((charge, index) => (
                      <div key={`${charge.title}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-sm text-amber-900">{charge.title}</h3>
                          {charge.amount && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-2xs font-bold text-amber-800 shrink-0">
                              {charge.amount}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-700">{charge.explanation}</p>
                        {charge.excerpt && (
                          <p className="mt-2 text-2xs italic text-slate-500 bg-white/60 p-2 rounded border border-amber-100">
                            "{charge.excerpt}"
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">{t('analysis.chargesEmpty')}</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Conclusion Section */}
            <Card className="p-6 bg-slate-900 text-slate-100 border border-slate-800">
              <h2 className="font-display text-xl font-bold flex items-center gap-2 text-white">
                <ShieldCheck size={20} className="text-emerald-400" />
                {t('analysis.conclusionTitle', 'Final Conclusion')}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 whitespace-pre-wrap">
                {analysis.finalConclusion || 'No final conclusion available.'}
              </p>
            </Card>

            {/* Row 7: Chat with AI Callout */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="grid size-12 place-items-center rounded-lg bg-white shadow-sm border border-blue-100 text-brandBlue shrink-0">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-blue-900">{t('analysis.chatCalloutTitle')}</h3>
                  <p className="text-sm text-blue-700 mt-0.5">{t('analysis.chatCalloutDesc')}</p>
                </div>
              </div>
              <Link to={`/app/chat/${id}`}>
                <Button className="bg-brandBlue hover:bg-blue-700 shadow-sm shrink-0">
                  {t('analysis.chatCalloutBtn')}
                </Button>
              </Link>
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, FileText, MessageSquareText, RefreshCw, ShieldAlert, DollarSign, HelpCircle, Info, Sparkles, MessageSquare } from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

function RiskBadge({ level }) {
  const color = level === 'high' ? 'bg-clay/10 text-clay' : level === 'medium' ? 'bg-brass/15 text-[#8a5c1d]' : 'bg-fern/10 text-fern';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${color}`}>{level || 'low'}</span>;
}

export default function AnalysisPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

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
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-fern">Analysis</p>
            <h1 className="mt-2 max-w-4xl font-display text-3xl font-bold sm:text-4xl">{document?.originalName}</h1>
            <p className="mt-2 text-slate-600">Plain-language report, clause extraction, and risk highlights.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to={`/app/chat/${id}`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                <MessageSquareText size={17} />
                Chat
              </Button>
            </Link>
            <a href={api.downloadReport(id)} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Download size={17} />
                Report
              </Button>
            </a>
            <Button onClick={rerunAnalysis} disabled={analyzing} className="w-full sm:w-auto">
              <RefreshCw size={17} className={analyzing ? 'animate-spin' : ''} />
              Re-analyze
            </Button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-clay/10 px-4 py-3 text-sm font-semibold text-clay">{error}</p>}

        {!analysis ? (
          <Card className="p-8 text-center">
            <FileText size={34} className="mx-auto text-sage" />
            <h2 className="mt-4 font-display text-xl font-bold">No analysis generated yet</h2>
            <p className="mt-2 text-sm text-slate-600">Run analysis to simplify this document.</p>
            <Button onClick={rerunAnalysis} className="mt-5">Generate analysis</Button>
          </Card>
        ) : (
          <>
            {/* Row 1: Document Overview & Key Information */}
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <Info size={19} className="text-brandBlue" />
                  Document Overview
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-700 whitespace-pre-line">
                  {analysis.documentOverview || analysis.summary}
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <Sparkles size={19} className="text-brandBlue" />
                  Key Information
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
                  <p className="mt-4 text-sm text-slate-500">Metadata not parsed from document.</p>
                )}
              </Card>
            </div>

            {/* Row 2: Important Clauses & Risks & Red Flags */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <FileText size={19} className="text-brandBlue" />
                  Important Clauses
                </h2>
                <div className="mt-4 space-y-3">
                  {analysis.clauses?.length ? analysis.clauses.map((clause, index) => (
                    <div key={`${clause.title}-${index}`} className="rounded-lg border border-line p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold">{clause.title}</h3>
                        <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-slate-600">{clause.category}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{clause.explanation}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">No specific clauses listed.</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2 text-clay">
                  <ShieldAlert size={19} className="text-clay" />
                  Risks & Red Flags
                </h2>
                <div className="mt-4 space-y-3">
                  {analysis.risks?.length ? analysis.risks.map((risk, index) => (
                    <div key={`${risk.title}-${index}`} className="rounded-lg border border-clay/20 bg-clay/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold">{risk.title}</h3>
                        <RiskBadge level={risk.level} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{risk.explanation}</p>
                      {risk.suggestion && <p className="mt-3 text-sm font-semibold text-clay">{risk.suggestion}</p>}
                    </div>
                  )) : (
                    <p className="text-sm text-slate-600">No high-risk language was detected in the current analysis.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Row 3: Hidden Charges */}
            <Card className="p-6 border border-amber-200 bg-amber-50/5">
              <h2 className="font-display text-xl font-bold text-amber-700 flex items-center gap-2">
                <DollarSign size={19} className="text-amber-600" />
                Potential Hidden Charges & Penalties
              </h2>
              <div className="mt-4 space-y-3">
                {analysis.hiddenCharges?.length ? analysis.hiddenCharges.map((charge, index) => (
                  <div key={`${charge.title}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-amber-900">{charge.title}</h3>
                      {charge.amount && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                          {charge.amount}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{charge.explanation}</p>
                    {charge.excerpt && (
                      <p className="mt-2 text-xs italic text-slate-500 bg-white/60 p-2 rounded border border-amber-100">
                        "{charge.excerpt}"
                      </p>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-slate-600">No hidden charges or unusual financial penalties were highlighted in the analysis.</p>
                )}
              </div>
            </Card>

            {/* Row 4: Plain English Summary */}
            <Card className="p-6">
              <h2 className="font-display text-xl font-bold">Plain English Summary</h2>
              <div className="mt-4 rounded-lg bg-mist p-5 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
                {analysis.simplifiedText}
              </div>
            </Card>

            {/* Row 5: Chat with AI Callout */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="grid size-12 place-items-center rounded-lg bg-white shadow-sm border border-blue-100 text-brandBlue shrink-0">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-blue-900">Have questions about this document?</h3>
                  <p className="text-sm text-blue-700 mt-0.5">Use our dedicated conversational assistant to clarify clauses, search key terms, and get answers.</p>
                </div>
              </div>
              <Link to={`/app/chat/${id}`}>
                <Button className="bg-brandBlue hover:bg-blue-700 shadow-sm shrink-0">
                  Chat With AI
                </Button>
              </Link>
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}

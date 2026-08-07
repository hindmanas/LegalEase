import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, FileText, MessageSquareText, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    setQuotaLoading(true);

    api.listDocuments()
      .then((data) => {
        setDocuments(data.documents || []);
      })
      .catch((err) => {
        console.error("Failed to load documents:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    api.getQuota()
      .then((data) => {
        setQuota(data);
      })
      .catch((err) => {
        console.error("Failed to load quota:", err);
      })
      .finally(() => {
        setQuotaLoading(false);
      });
  }, []);

  const handleDelete = async (docId, docName) => {
    const confirmMessage = `WARNING: This document "${docName}" and all associated analysis data will be completely removed from our side (including database records and cloud storage). This action cannot be undone.\n\nAre you sure you want to proceed?`;
    if (window.confirm(confirmMessage)) {
      try {
        await api.deleteDocument(docId);
        setDocuments((prev) => prev.filter((d) => d._id !== docId));
        const updatedQuota = await api.getQuota();
        setQuota(updatedQuota);
      } catch (err) {
        alert(`Failed to delete document: ${err.message}`);
      }
    }
  };

  const stats = useMemo(() => {
    const analyzed = documents.filter((doc) => doc.status === 'analyzed').length;
    const risks = documents.reduce((sum, doc) => sum + (doc.analysis?.risks?.length || 0), 0);
    return [
      [t('dashboard.statDocs'), documents.length, FileText],
      [t('dashboard.statAnalyzed'), analyzed, ShieldCheck],
      [t('dashboard.statRisks'), risks, AlertTriangle]
    ];
  }, [documents, t]);

  const formatCooldown = (ms) => {
    if (!ms || ms <= 0) return null;
    const hours = Math.floor(ms / (3600 * 1000));
    const minutes = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };

  const formatResetDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="animate-fade-up">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brandBlue">{t('dashboard.tag')}</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t('dashboard.title')}</h1>
            <p className="mt-2 text-slate-600">{t('dashboard.subtitle')}</p>
          </div>
          <Link to="/app/upload" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <Button className="w-full sm:w-auto bg-brandBlue hover:bg-blue-700 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all">
              <Plus size={17} />
              {t('dashboard.newUpload')}
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(([label, value, Icon], index) => (
            <Card key={label} className="p-5 animate-fade-up" style={{ animationDelay: `${0.1 * (index + 2)}s` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <div className="grid size-8 place-items-center rounded-lg bg-brandBlue/10 text-brandBlue">
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-5 font-display text-4xl font-bold">{loading ? '...' : value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[2.2fr_0.8fr] items-start">
          <Card className="overflow-hidden animate-fade-up shadow-sm lg:col-span-1" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between border-b border-line p-5 bg-slate-50/50">
              <div>
                <h2 className="font-display text-xl font-bold">{t('dashboard.recentDocs')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('dashboard.tableDesc')}</p>
              </div>
            </div>
            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 rounded-xl" />)}
              </div>
            ) : documents.length === 0 ? (
              <div className="p-10 text-center bg-white">
                <div className="grid size-16 place-items-center rounded-full bg-slate-50 mx-auto text-slate-300">
                  <FileText size={34} />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{t('dashboard.noDocsTitle')}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  {t('dashboard.noDocsDesc')}
                </p>
                <Link to="/app/upload" className="mt-6 inline-flex">
                  <Button className="bg-brandBlue hover:bg-blue-700">{t('dashboard.uploadDocBtn')}</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop View: Visible on medium screens and larger */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-line">
                      <tr>
                        <th className="px-5 py-3 font-bold">{t('dashboard.colDoc')}</th>
                        <th className="px-5 py-3 font-bold">{t('dashboard.colType')}</th>
                        <th className="px-5 py-3 font-bold">{t('dashboard.colStatus')}</th>
                        <th className="px-5 py-3 font-bold">{t('dashboard.colRisks')}</th>
                        <th className="px-5 py-3 font-bold">{t('dashboard.colUpdated')}</th>
                        <th className="px-5 py-3 font-bold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {documents.map((doc) => (
                        <tr key={doc._id} className="transition hover:bg-slate-50/80 group">
                          <td className="px-5 py-4 font-semibold">{doc.originalName}</td>
                          <td className="px-5 py-4 text-slate-600">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{doc.fileType?.toUpperCase()}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-brandBlue/10 px-2.5 py-1 text-xs font-bold text-brandBlue inline-flex items-center gap-1.5 capitalize">
                              <span className="w-1.5 h-1.5 rounded-full bg-brandBlue"></span>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {doc.analysis?.risks?.length > 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-600 font-bold text-xs">{doc.analysis.risks.length}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-600">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/app/chat/${doc._id}`} className="rounded-lg p-2 text-brandBlue hover:bg-brandBlue/10 transition-colors" title={t('dashboard.actionChat')}>
                                <MessageSquareText size={17} />
                              </Link>
                              <Link to={`/app/analysis/${doc._id}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-bold text-brandBlue hover:bg-brandBlue/10 transition-colors" title={t('dashboard.actionOpen')}>
                                {t('dashboard.actionOpen')}
                                <ArrowRight size={15} />
                              </Link>
                              <button
                                onClick={() => handleDelete(doc._id, doc.originalName)}
                                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                title={t('dashboard.actionDelete', 'Delete')}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Visible on smaller screens */}
                <div className="block md:hidden divide-y divide-line bg-white">
                  {documents.map((doc) => (
                    <div key={doc._id} className="p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-800 text-sm leading-snug break-words">{doc.originalName}</h3>
                          <p className="text-2xs font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
                            {new Date(doc.updatedAt).toLocaleDateString()} • {doc.fileType?.toUpperCase()}
                          </p>
                        </div>
                        <span className="rounded-full bg-brandBlue/10 px-2.5 py-1 text-2xs font-bold text-brandBlue inline-flex items-center gap-1.5 shrink-0 capitalize">
                          <span className="w-1.5 h-1.5 rounded-full bg-brandBlue"></span>
                          {doc.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('dashboard.colRisks', 'Risks')}</span>
                        {doc.analysis?.risks?.length > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-600 font-bold text-xs">
                            {doc.analysis.risks.length}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">0</span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100/50">
                        <Link to={`/app/chat/${doc._id}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold text-brandBlue hover:bg-slate-50 transition shadow-2xs" title={t('dashboard.actionChat')}>
                          <MessageSquareText size={15} />
                          {t('dashboard.actionChat')}
                        </Link>
                        <Link to={`/app/analysis/${doc._id}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brandBlue p-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-2xs">
                          {t('dashboard.actionOpen')}
                          <ArrowRight size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(doc._id, doc.originalName)}
                          className="rounded-lg p-2.5 text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 transition shadow-2xs"
                          title={t('dashboard.actionDelete', 'Delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card className="p-6 animate-fade-up shadow-sm bg-white border border-slate-100 lg:col-span-1" style={{ animationDelay: '0.6s' }}>
            <h2 className="font-display text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-brandBlue"></span>
              {t('dashboard.quotaTitle', 'Usage Quota')}
            </h2>

            {quotaLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : quota ? (
              <div className="space-y-6">
                {/* Documents Remaining */}
                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-slate-500">{t('dashboard.quotaDocsRemaining', 'Documents Remaining')}</span>
                    <span className="font-bold text-slate-800">{quota.documentsRemaining}/3</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        quota.documentsRemaining === 3 ? 'bg-emerald-500' : quota.documentsRemaining > 0 ? 'bg-brandBlue' : 'bg-rose-500'
                      }`}
                      style={{ width: `${(quota.documentsRemaining / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Next Analysis Available In */}
                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-slate-500">{t('dashboard.quotaNextAnalysis', 'Next Analysis Available In')}</span>
                  </div>
                  {quota.documentsRemaining === 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs font-bold text-rose-600 w-full justify-center">
                      {t('dashboard.quotaWaiting', 'Waiting for weekly reset')}
                    </span>
                  ) : quota.nextAnalysisAvailableInMs > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 w-full justify-center">
                      {formatCooldown(quota.nextAnalysisAvailableInMs)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-600 w-full justify-center">
                      {t('dashboard.quotaAvailableNow', 'Available Now')}
                    </span>
                  )}
                </div>

                {/* Questions Remaining */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    <span>{t('dashboard.quotaQuestionsRemaining', 'Questions Remaining for Current Document')}</span>
                  </div>
                  {quota.currentDocName ? (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-600 truncate mb-2" title={quota.currentDocName}>
                        {quota.currentDocName}
                      </p>
                      <div className="flex justify-between items-center text-sm font-bold mb-1.5">
                        <span className="text-slate-500 text-xs">Questions</span>
                        <span className="text-slate-800">{quota.questionsRemaining}/3</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            quota.questionsRemaining === 3 ? 'bg-emerald-500' : quota.questionsRemaining > 0 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${(quota.questionsRemaining / 3) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold italic">No analyzed documents yet.</p>
                  )}
                </div>

                {/* Weekly Reset Date */}
                {quota.weeklyResetDate && (
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.quotaWeeklyReset', 'Weekly Reset Date')}</span>
                    <span className="font-bold text-slate-600">{formatResetDate(quota.weeklyResetDate)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Failed to load usage details.</p>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

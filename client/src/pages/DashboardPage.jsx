import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, FileText, MessageSquareText, Plus, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listDocuments()
      .then((data) => setDocuments(data.documents))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const analyzed = documents.filter((doc) => doc.status === 'analyzed').length;
    const risks = documents.reduce((sum, doc) => sum + (doc.analysis?.risks?.length || 0), 0);
    return [
      ['Documents', documents.length, FileText],
      ['Analyzed', analyzed, ShieldCheck],
      ['Open risks', risks, AlertTriangle]
    ];
  }, [documents]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="animate-fade-up">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brandBlue">Dashboard</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Document review history</h1>
            <p className="mt-2 text-slate-600">Track uploaded files, analysis status, and flagged clauses in one calm workspace.</p>
          </div>
          <Link to="/app/upload" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <Button className="w-full sm:w-auto bg-brandBlue hover:bg-blue-700 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all">
              <Plus size={17} />
              New upload
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

        <Card className="overflow-hidden animate-fade-up shadow-sm" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between border-b border-line p-5 bg-slate-50/50">
            <div>
              <h2 className="font-display text-xl font-bold">Recent documents</h2>
              <p className="mt-1 text-sm text-slate-500">Analysis records are saved to your account.</p>
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
              <h3 className="mt-4 font-display text-xl font-bold">No documents yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Upload a PDF, DOCX, or TXT file to generate your first simplified legal report.
              </p>
              <Link to="/app/upload" className="mt-6 inline-flex">
                <Button className="bg-brandBlue hover:bg-blue-700">Upload document</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-line">
                  <tr>
                    <th className="px-5 py-3 font-bold">Document</th>
                    <th className="px-5 py-3 font-bold">Type</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">Risks</th>
                    <th className="px-5 py-3 font-bold">Updated</th>
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
                        <span className="rounded-full bg-brandBlue/10 px-2.5 py-1 text-xs font-bold text-brandBlue inline-flex items-center gap-1.5">
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
                          <Link to={`/app/chat/${doc._id}`} className="rounded-lg p-2 text-brandBlue hover:bg-brandBlue/10 transition-colors" title="Chat">
                            <MessageSquareText size={17} />
                          </Link>
                          <Link to={`/app/analysis/${doc._id}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-bold text-brandBlue hover:bg-brandBlue/10 transition-colors">
                            Open
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

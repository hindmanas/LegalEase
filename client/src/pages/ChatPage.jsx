import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Send, UserRound } from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';

export default function ChatPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ask me about obligations, risks, deadlines, renewal terms, liability, or anything else in this document.'
    }
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.getDocument(id).then((data) => setDocument(data.document));
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim()) return;

    const nextQuestion = question.trim();
    setMessages((current) => [...current, { role: 'user', content: nextQuestion }]);
    setQuestion('');
    setLoading(true);

    try {
      const data = await api.chat(id, nextQuestion);
      setMessages((current) => [...current, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages((current) => [...current, { role: 'assistant', content: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-5xl flex-col">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link to={`/app/analysis/${id}`} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-ink">
              <ArrowLeft size={16} />
              Back to analysis
            </Link>
            <h1 className="font-display text-3xl font-bold">Chat with document</h1>
            <p className="mt-2 max-w-2xl truncate text-slate-600">{document?.originalName || 'Loading document...'}</p>
          </div>
        </div>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin sm:p-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-fern text-white">
                    <Bot size={17} />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-ink text-white' : 'bg-mist text-slate-700'}`}>
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-ink shadow-sm">
                    <UserRound size={17} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-fern text-white">
                  <Bot size={17} />
                </div>
                <div className="rounded-lg bg-mist px-4 py-3 text-sm font-semibold text-slate-500">Reading the document...</div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-line bg-white p-3 sm:p-4">
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about a clause, term, obligation, or risk..."
                className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-white px-4 text-sm outline-none transition focus:border-fern focus:ring-4 focus:ring-fern/10"
              />
              <Button type="submit" disabled={loading || !question.trim()} className="px-4">
                <Send size={17} />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}

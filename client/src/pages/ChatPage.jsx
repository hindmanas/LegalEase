import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Send, UserRound } from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import { useTranslation } from 'react-i18next';

export default function ChatPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [languageSelected, setLanguageSelected] = useState(false);
  const scrollRef = useRef(null);

  // Ask for language preference at the start
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: "Hello! Please select your preferred language to continue / कृपया आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें / ચાલુ રાખવા માટે કૃપા કરીને તમારી પસંદગીની ભાષા પસંદ કરો"
      }
    ]);
  }, []);

  useEffect(() => {
    api.getDocument(id).then((data) => setDocument(data.document));
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSelectLanguage(code) {
    localStorage.setItem('language', code);
    i18n.changeLanguage(code);
    setLanguageSelected(true);

    const languageNames = { en: 'English', hi: 'Hindi (हिन्दी)', gu: 'Gujarati (ગુજરાતી)' };
    const acknowledgments = {
      en: "Great! I will answer your questions about the document in English. What would you like to know?",
      hi: "बहुत बढ़िया! मैं दस्तावेज़ के बारे में आपके प्रश्नों का उत्तर हिन्दी में दूँगा। आप क्या जानना चाहते हैं?",
      gu: "સરસ! હું દસ્તાવેજ વિશેના તમારા પ્રશ્નોના જવાબ ગુજરાતીમાં આપીશ. તમે શું જાણવા માંગો છો?"
    };

    setMessages((current) => [
      ...current,
      { role: 'user', content: `Selected Language: ${languageNames[code]}` }
    ]);

    setLoading(true);
    setTimeout(() => {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: acknowledgments[code] }
      ]);
      setLoading(false);
    }, 800);
  }

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
              {t('chat.backLink')}
            </Link>
            <h1 className="font-display text-3xl font-bold">{t('chat.title')}</h1>
            <p className="mt-2 max-w-2xl truncate text-slate-600">{document?.originalName || '...'}</p>
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
                <div className="rounded-lg bg-mist px-4 py-3 text-sm font-semibold text-slate-500">{t('chat.readingDoc')}</div>
              </div>
            )}
            {!languageSelected && (
              <div className="flex flex-col gap-2 pl-12 mt-2">
                <p className="text-xs text-slate-500 font-semibold mb-1">
                  Select Language / भाषा चुनें / ભાષા પસંદ કરો:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSelectLanguage('en')}
                    className="rounded-lg bg-fern px-4 py-2 text-sm font-bold text-white hover:bg-fern/90 transition shadow-sm"
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleSelectLanguage('hi')}
                    className="rounded-lg bg-fern px-4 py-2 text-sm font-bold text-white hover:bg-fern/90 transition shadow-sm"
                  >
                    Hindi (हिन्दी)
                  </button>
                  <button
                    onClick={() => handleSelectLanguage('gu')}
                    className="rounded-lg bg-fern px-4 py-2 text-sm font-bold text-white hover:bg-fern/90 transition shadow-sm"
                  >
                    Gujarati (ગુજરાતી)
                  </button>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-line bg-white p-3 sm:p-4">
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={languageSelected ? t('chat.placeholder') : "Please select your preferred language..."}
                disabled={!languageSelected || loading}
                className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-white px-4 text-sm outline-none transition focus:border-fern focus:ring-4 focus:ring-fern/10 disabled:opacity-50"
              />
              <Button type="submit" disabled={loading || !languageSelected || !question.trim()} className="px-4">
                <Send size={17} />
                <span className="hidden sm:inline">{t('chat.sendBtn')}</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}

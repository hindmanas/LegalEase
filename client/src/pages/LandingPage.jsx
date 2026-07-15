import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Share2, Shield, FileCheck2, ShieldAlert, FileText, Scale } from 'lucide-react';
import PageTransition from '../components/ui/PageTransition.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <PageTransition>
      <div className="min-h-screen overflow-x-hidden text-ink relative">
        <Navbar />

        <main className="pt-32 lg:pt-40 pb-20">
          
          {/* Hero Section */}
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center animate-fade-up">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white/50 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm animate-float">
              <span className="w-2 h-2 rounded-full bg-brandBlue animate-pulse"></span>
              {t('landing.badge')}
            </div>
            
            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-6xl lg:text-[5rem]">
              {t('landing.title1')} <br/>
              <span className="text-slate-400">{t('landing.title2')}</span>
            </h1>
            
            <p className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-600 font-medium">
              {t('landing.subtitle')}
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full bg-brandBlue text-white hover:bg-blue-700 transition-all duration-300 px-8 py-3.5 rounded-xl text-sm font-semibold flex justify-center items-center gap-2 shadow-glow hover:shadow-float hover:-translate-y-1">
                  {t('landing.startBtn')} <ArrowRight size={18} />
                </button>
              </Link>
              <a href="#workflow" className="w-full sm:w-auto">
                <button className="w-full bg-white text-ink border border-line hover:border-slate-300 transition-all duration-300 px-8 py-3.5 rounded-xl text-sm font-semibold flex justify-center items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-1">
                  {t('landing.exploreBtn')}
                </button>
              </a>
            </div>

            {/* Hero Mockup Preview */}
            <div className="mt-20 w-full max-w-5xl relative animate-fade-up" style={{animationDelay: '0.2s'}}>
              <div className="absolute -inset-1 bg-gradient-to-r from-brandBlue to-purple-500 rounded-2xl blur opacity-20 animate-soft-pulse"></div>
              <div className="relative rounded-2xl border border-line bg-white/80 backdrop-blur-lg shadow-2xl overflow-hidden ring-1 ring-black/5">
                {/* Mockup Header */}
                <div className="flex items-center gap-2 border-b border-line px-4 py-3 bg-white/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="max-w-[200px] h-6 bg-slate-100 rounded flex items-center px-2 text-[11px] text-slate-400 font-mono">
                      legalease.app/analysis
                    </div>
                  </div>
                </div>
                {/* Mockup Body */}
                <div className="flex h-[300px] sm:h-[400px]">
                  {/* Sidebar */}
                  <div className="hidden sm:block w-48 border-r border-line p-4 space-y-4">
                    <div className="h-4 w-20 bg-slate-100 rounded"></div>
                    <div className="h-4 w-16 bg-slate-100 rounded"></div>
                    <div className="h-8 w-full bg-blue-50 text-brandBlue rounded flex items-center px-3 text-xs font-bold">{t('common.appName')}</div>
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                    <div className="text-[10px] font-bold text-slate-400 tracking-wider">DOCUMENT</div>
                    <div className="space-y-4 flex-1">
                      <div className="h-3 w-3/4 bg-slate-100 rounded-full"></div>
                      <div className="h-3 w-full bg-slate-100 rounded-full"></div>
                      <div className="h-3 w-5/6 bg-slate-100 rounded-full"></div>
                      <div className="h-3 w-4/5 bg-slate-100 rounded-full"></div>
                      <div className="h-3 w-1/2 bg-slate-100 rounded-full"></div>
                    </div>
                  </div>
                  {/* Right Panel */}
                  <div className="w-64 border-l border-line bg-slate-50/50 p-4">
                    <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-4">RISKS</div>
                    <div className="bg-white border border-red-200 rounded-lg p-3 shadow-sm border-l-2 border-l-red-500">
                      <div className="text-[10px] font-bold text-red-600 mb-1">CRITICAL</div>
                      <div className="text-sm font-bold text-ink">Liability cap</div>
                      <div className="text-xs text-slate-500 mt-1">Includes gross negligence.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow Section */}
          <section id="workflow" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 mt-12">
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brandBlue mb-4">{t('landing.workflowTitle')}</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight max-w-lg leading-tight">
                {t('landing.workflowSubtitle')}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 rounded-2xl border border-line bg-white/40 overflow-hidden shadow-sm backdrop-blur-sm">
              {[
                ['01', t('landing.step1Title'), t('landing.step1Desc')],
                ['02', t('landing.step2Title'), t('landing.step2Desc')],
                ['03', t('landing.step3Title'), t('landing.step3Desc')],
                ['04', t('landing.step4Title'), t('landing.step4Desc')]
              ].map(([num, title, copy], i) => (
                <div key={num} className={`p-8 hover:bg-white transition-colors duration-300 ${i !== 3 ? 'border-b sm:border-b-0 sm:border-r border-line' : ''}`}>
                  <span className="text-xs font-bold text-brandBlue">{num}</span>
                  <h3 className="mt-4 text-xl font-bold text-ink">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Social Proof Quote */}
          <section className="py-16 flex justify-center px-4">
             <div className="max-w-3xl text-center">
                <h3 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-ink mb-6">
                  {t('landing.testimonial')}
                </h3>
                <div className="flex items-center justify-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                   <div className="text-left">
                      <div className="text-sm font-bold text-ink">{t('landing.testimonialAuthor')}</div>
                      <div className="text-xs text-slate-500">{t('landing.testimonialRole')}</div>
                   </div>
                </div>
             </div>
          </section>

          {/* Features Section */}
          <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brandBlue mb-4">{t('landing.featuresTitle')}</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight max-w-xl leading-tight">
                {t('landing.featuresSubtitle')}
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                [ShieldAlert, t('landing.feat1Title'), t('landing.feat1Desc')],
                [FileText, t('landing.feat2Title'), t('landing.feat2Desc')],
                [Bot, t('landing.feat3Title'), t('landing.feat3Desc')],
                [Share2, t('landing.feat4Title'), t('landing.feat4Desc')],
                [Shield, t('landing.feat5Title'), t('landing.feat5Desc')],
                [FileCheck2, t('landing.feat6Title'), t('landing.feat6Desc')]
              ].map(([Icon, title, copy]) => (
                <div key={title} className="glass-card p-8 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brandBlue/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-brandBlue flex items-center justify-center mb-6 shadow-sm">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA Section */}
          <section className="px-4 py-12">
            <div className="mx-auto max-w-5xl rounded-[2rem] bg-ink text-white p-12 sm:p-20 text-center relative overflow-hidden shadow-float">
              {/* Abstract Background Shapes */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-brandBlue rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500 rounded-full blur-[100px]"></div>
              </div>

              <div className="relative z-10">
                <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                  {t('landing.ctaTitle')}
                </h2>
                <p className="text-slate-300 text-lg mb-10 max-w-lg mx-auto">
                  {t('landing.ctaDesc')}
                </p>
                <Link to="/register">
                  <button className="bg-white text-ink hover:bg-slate-100 transition-all duration-300 px-8 py-3.5 rounded-xl text-sm font-bold inline-flex justify-center items-center gap-2 hover:-translate-y-1 shadow-lg">
                    {t('landing.ctaBtn')} <ArrowRight size={18} />
                  </button>
                </Link>
              </div>
            </div>
          </section>

        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-line/50 bg-white/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500">
              <div className="grid size-6 place-items-center rounded bg-brandBlue text-white">
                <Scale size={12} />
              </div>
              <span className="text-sm font-medium">{t('landing.rightsReserved')}</span>
            </div>
            <div className="flex gap-6 text-sm font-semibold text-slate-400">
              <a href="#" className="hover:text-ink transition-colors">{t('landing.privacy')}</a>
              <a href="#" className="hover:text-ink transition-colors">{t('landing.terms')}</a>
              <a href="#" className="hover:text-ink transition-colors">{t('landing.security')}</a>
            </div>
          </div>
        </footer>

      </div>
    </PageTransition>
  );
}

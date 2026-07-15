import { useState, useEffect } from 'react';
import { Bell, Languages, Lock, Save } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { user, refreshUser, changeLanguage } = useAuth();
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [status, setStatus] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const currentLanguage = i18n.language || 'en';

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      await api.updateProfile(form);
      await refreshUser();
      setStatus(t('settings.profileSaved'));
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwdStatus(t('settings.passChanged'));
    setTimeout(() => setPwdStatus(''), 3000);
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 animate-fade-up">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brandBlue">{t('settings.tag')}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t('settings.title')}</h1>
          <p className="mt-2 text-slate-600">{t('settings.subtitle')}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-5">
            <Card className="p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="font-display text-xl font-bold">{t('settings.profileTitle')}</h2>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <Input label={t('settings.fieldName')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                <Input label={t('settings.fieldEmail')} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                {status && <p className="text-sm font-semibold text-brandBlue">{status}</p>}
                <Button type="submit" disabled={saving} className="bg-brandBlue hover:bg-blue-700">
                  <Save size={17} />
                  {saving ? t('common.saving') : t('common.save')}
                </Button>
              </form>
            </Card>

            <Card className="p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="font-display text-xl font-bold">{t('settings.securityTitle')}</h2>
              <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
                <Input label={t('settings.fieldCurrPass')} type="password" placeholder="••••••••" required />
                <Input label={t('settings.fieldNewPass')} type="password" placeholder={t('auth.passwordPlaceholder')} required />
                {pwdStatus && <p className="text-sm font-semibold text-brandBlue">{pwdStatus}</p>}
                <Button type="submit" className="bg-ink hover:bg-slate-800 text-white border-none">
                  <Lock size={17} />
                  {t('settings.changePassBtn')}
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-5">
            {/* Encryption Widget */}
            <Card className="p-5 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-brandBlue/5 text-brandBlue">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{t('settings.cardEncryptionTitle')}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t('settings.cardEncryptionDesc')}</p>
                </div>
              </div>
            </Card>

            {/* Language Preferences Widget */}
            <Card className="p-5 animate-fade-up border border-brandBlue/20" style={{ animationDelay: '0.4s' }}>
              <div className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-brandBlue/10 text-brandBlue">
                  <Languages size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{t('settings.cardLanguageTitle')}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 mb-3">{t('settings.cardLanguageDesc')}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('settings.langSelectLabel')}:</label>
                    <select
                      value={currentLanguage}
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="bg-white border border-line rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none hover:border-brandBlue focus:border-brandBlue transition-all cursor-pointer"
                    >
                      <option value="en">{t('common.english')}</option>
                      <option value="hi">{t('common.hindi')}</option>
                      <option value="gu">{t('common.gujarati')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notifications Widget */}
            <Card className="p-5 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-brandBlue/5 text-brandBlue">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{t('settings.cardNotificationsTitle')}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t('settings.cardNotificationsDesc')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

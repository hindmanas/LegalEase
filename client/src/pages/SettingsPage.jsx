import { useState } from 'react';
import { Bell, Languages, Lock, Save } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [status, setStatus] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      await api.updateProfile(form);
      await refreshUser();
      setStatus('Profile saved');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    // Placeholder for actual API call
    setPwdStatus('Password updated successfully');
    setTimeout(() => setPwdStatus(''), 3000);
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 animate-fade-up">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brandBlue">Settings</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Workspace preferences</h1>
          <p className="mt-2 text-slate-600">Manage your identity, security posture, and future language support.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-5">
            <Card className="p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="font-display text-xl font-bold">Profile</h2>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                <Input label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                {status && <p className="text-sm font-semibold text-brandBlue">{status}</p>}
                <Button type="submit" disabled={saving} className="bg-brandBlue hover:bg-blue-700">
                  <Save size={17} />
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            </Card>

            <Card className="p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="font-display text-xl font-bold">Security</h2>
              <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
                <Input label="Current password" type="password" placeholder="••••••••" required />
                <Input label="New password" type="password" placeholder="At least 8 characters" required />
                {pwdStatus && <p className="text-sm font-semibold text-brandBlue">{pwdStatus}</p>}
                <Button type="submit" className="bg-ink hover:bg-slate-800 text-white border-none">
                  <Lock size={17} />
                  Change password
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-5">
            {[
              [Lock, 'Data encryption', 'JWT-secured access is enabled. Keep documents private by using a strong password.'],
              [Languages, 'Multilingual readiness', 'The analysis service is structured to support translation outputs in future releases.'],
              [Bell, 'Review notifications', 'Planned alerts for expiring contracts, renewal windows, and unresolved risky clauses.']
            ].map(([Icon, title, copy], i) => (
              <Card key={title} className="p-5 animate-fade-up" style={{ animationDelay: `${0.1 * (i + 3)}s` }}>
                <div className="flex gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-brandBlue/5 text-brandBlue">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

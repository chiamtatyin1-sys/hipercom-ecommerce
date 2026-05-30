import { useState, useEffect } from 'react';
import { Mail, Save, Send, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminEmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [config, setConfig] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    user: '',
    pass: '',
    from: '',
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      const s = res.data;
      setConfig({
        host: s.email_host || 'smtp.gmail.com',
        port: s.email_port || '587',
        secure: s.email_secure === 'true',
        user: s.email_user || '',
        pass: '',
        from: s.email_from || s.email_user || '',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/email', config);
      toast.success('Email settings saved!');
    } catch (error) {
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Enter a valid test email address');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      await api.put('/settings/email', config);
      const res = await api.post('/settings/email/test', { to: testEmail });
      setTestResult(res.data);
      if (res.data.success) {
        toast.success('Test email sent!');
      } else {
        toast.error('Test email failed');
      }
    } catch (error) {
      setTestResult({ success: false, error: error.response?.data?.error || error.message });
      toast.error('Test email failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading email settings...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" /> Email Settings
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">SMTP Configuration</h3>
          <p className="text-sm text-gray-500 mb-6">
            Configure your email server. Settings saved here will override .env values.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">SMTP Host</label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              className="input"
              placeholder="smtp.gmail.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Port</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: e.target.value })}
                className="input"
                placeholder="587"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Secure (TLS)</label>
              <button
                onClick={() => setConfig({ ...config, secure: !config.secure })}
                className={`w-12 h-6 rounded-full transition-colors mt-2 ${config.secure ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${config.secure ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <p className="text-xs text-gray-500 mt-1">ON = 465, OFF = 587</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Username (Email)</label>
            <input
              type="text"
              value={config.user}
              onChange={(e) => setConfig({ ...config, user: e.target.value })}
              className="input"
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Password / App Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={config.pass}
                onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                className="input pr-10"
                placeholder="Enter SMTP password"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">From Address</label>
            <input
              type="text"
              value={config.from}
              onChange={(e) => setConfig({ ...config, from: e.target.value })}
              className="input"
              placeholder="HiperCom <your@email.com>"
            />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full flex items-center justify-center">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Send Test Email</h3>
            <p className="text-sm text-gray-500 mb-4">
              Save settings first, then send a test email to verify your SMTP configuration.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Recipient Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="input"
                placeholder="test@example.com"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={testing || !config.user || !config.pass}
              className="btn btn-secondary w-full flex items-center justify-center"
            >
              <Send className="h-4 w-4 mr-2" />
              {testing ? 'Sending...' : 'Send Test Email'}
            </button>

            {testResult && (
              <div className={`mt-4 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <span>{testResult.success ? 'Email sent successfully!' : testResult.error || 'Failed to send email'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Free Email Providers</h3>
            <div className="space-y-3">
              {[
                { name: 'Gmail (SMTP)', host: 'smtp.gmail.com', port: 587, note: 'Use App Password (not your regular password). Generate at myaccount.google.com/apppasswords' },
                { name: 'Mailtrap (Dev)', host: 'sandbox.smtp.mailtrap.io', port: 2525, note: 'Free dev inbox. Sign up at mailtrap.io. Emails are captured, never delivered.' },
                { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, note: 'Free tier: 100 emails/day. Use API key as password.' },
                { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, note: 'Free tier: 5,000 emails/month for 3 months.' },
              ].map((p, i) => (
                <div key={i} className="py-2 border-b last:border-0">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.host}:{p.port}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
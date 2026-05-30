import { Mail, Send, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SettingsEmail({ settings, updateSetting }) {
  const [showPass, setShowPass] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');

  const handleTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      await api.put('/settings/email', {
        host: settings.email_host,
        port: settings.email_port,
        secure: settings.email_secure,
        user: settings.email_user,
        pass: settings.email_pass,
        from: settings.email_from,
      });
      const res = await api.post('/settings/email/test', { to: testEmail });
      setTestResult(res.data);
      if (res.data.success) toast.success('Test email sent!');
      else toast.error('Test email failed');
    } catch (error) {
      setTestResult({ success: false, error: error.response?.data?.error || error.message });
      toast.error('Test email failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Email (SMTP) Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Configure your email server for password reset, order notifications, and marketing</p>
      </div>

      {/* SMTP Config */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Mail className="h-4 w-4" /> SMTP Configuration</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SMTP Host</label>
            <input type="text" value={settings.email_host || 'mail.hipercom.com.my'} onChange={(e) => updateSetting('email_host', e.target.value)} className="input" placeholder="mail.hipercom.com.my" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Port</label>
            <select value={settings.email_port || '465'} onChange={(e) => updateSetting('email_port', e.target.value)} className="input">
              <option value="465">465 (SSL)</option>
              <option value="587">587 (STARTTLS)</option>
              <option value="25">25 (Unencrypted)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input type="text" value={settings.email_user || ''} onChange={(e) => updateSetting('email_user', e.target.value)} className="input" placeholder="smtp@hipercom.com.my" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={settings.email_pass || ''} onChange={(e) => updateSetting('email_pass', e.target.value)} className="input pr-10" placeholder="SMTP password" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">From Address</label>
            <input type="text" value={settings.email_from || ''} onChange={(e) => updateSetting('email_from', e.target.value)} className="input" placeholder="HiperCom <smtp@hipercom.com.my>" />
          </div>
        </div>
      </div>

      {/* Test Email */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4">Test Email</h4>
        <div className="flex gap-2">
          <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="input flex-1" placeholder="test@example.com" />
          <button onClick={handleTest} disabled={testing || !settings.email_user || !settings.email_pass} className="btn btn-secondary flex items-center gap-2">
            <Send className="h-4 w-4" /> {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>
        {testResult && (
          <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center gap-2">
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>{testResult.success ? 'Email sent successfully!' : testResult.error || 'Failed'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Provider Presets */}
      <div>
        <h4 className="font-medium mb-4">Quick Setup Presets</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { name: 'Gmail', host: 'smtp.gmail.com', port: '465', note: 'Use App Password' },
            { name: 'HiperCom Mail', host: 'mail.hipercom.com.my', port: '465', note: 'Company SMTP' },
            { name: 'Mailtrap', host: 'sandbox.smtp.mailtrap.io', port: '2525', note: 'Dev testing only' },
            { name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587', note: '100 emails/day free' },
          ].map(preset => (
            <button key={preset.name} onClick={() => { updateSetting('email_host', preset.host); updateSetting('email_port', preset.port); }} className="p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors">
              <p className="font-medium text-sm">{preset.name}</p>
              <p className="text-xs text-gray-500">{preset.host}:{preset.port} — {preset.note}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

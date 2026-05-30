import { Upload, Globe, Phone, Mail, MapPin, Facebook, Instagram, Video, MessageCircle, Clock } from 'lucide-react';

export default function SettingsGeneral({ settings, updateSetting }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">General Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Configure your store identity and contact information</p>
      </div>

      {/* Site Identity */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Globe className="h-4 w-4" /> Site Identity</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input type="text" value={settings.site_name || 'HiperCom'} onChange={(e) => updateSetting('site_name', e.target.value)} className="input" placeholder="HiperCom" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tagline</label>
            <input type="text" value={settings.site_tagline || ''} onChange={(e) => updateSetting('site_tagline', e.target.value)} className="input" placeholder="Your trusted online store" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Store Description</label>
            <textarea value={settings.site_description || ''} onChange={(e) => updateSetting('site_description', e.target.value)} className="input h-20" placeholder="Describe your store..." />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Upload className="h-4 w-4" /> Logo & Favicon</h4>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            {settings.site_logo ? (
              <img src={settings.site_logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-gray-400 text-xs">Logo</span>
            )}
          </div>
          <div className="space-y-2">
            <input type="text" value={settings.site_logo || ''} onChange={(e) => updateSetting('site_logo', e.target.value)} className="input" placeholder="Logo URL or upload path" />
            <input type="text" value={settings.site_favicon || ''} onChange={(e) => updateSetting('site_favicon', e.target.value)} className="input" placeholder="Favicon URL" />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Information</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={settings.contact_email || ''} onChange={(e) => updateSetting('contact_email', e.target.value)} className="input" placeholder="support@hipercom.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input type="text" value={settings.contact_phone || ''} onChange={(e) => updateSetting('contact_phone', e.target.value)} className="input" placeholder="+60 123 456 789" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea value={settings.contact_address || ''} onChange={(e) => updateSetting('contact_address', e.target.value)} className="input h-16" placeholder="Full business address" />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Facebook className="h-4 w-4" /> Social Media</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Facebook URL</label>
            <input type="url" value={settings.social_facebook || ''} onChange={(e) => updateSetting('social_facebook', e.target.value)} className="input" placeholder="https://facebook.com/hipercom" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram URL</label>
            <input type="url" value={settings.social_instagram || ''} onChange={(e) => updateSetting('social_instagram', e.target.value)} className="input" placeholder="https://instagram.com/hipercom" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">TikTok URL</label>
            <input type="url" value={settings.social_tiktok || ''} onChange={(e) => updateSetting('social_tiktok', e.target.value)} className="input" placeholder="https://tiktok.com/@hipercom" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
            <input type="text" value={settings.social_whatsapp || ''} onChange={(e) => updateSetting('social_whatsapp', e.target.value)} className="input" placeholder="+60123456789" />
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> Business Hours</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Opening Time</label>
            <input type="time" value={settings.business_hours_open || '09:00'} onChange={(e) => updateSetting('business_hours_open', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Closing Time</label>
            <input type="time" value={settings.business_hours_close || '18:00'} onChange={(e) => updateSetting('business_hours_close', e.target.value)} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Operating Days</label>
            <input type="text" value={settings.business_days || 'Monday - Saturday'} onChange={(e) => updateSetting('business_days', e.target.value)} className="input" placeholder="Monday - Saturday" />
          </div>
        </div>
      </div>
    </div>
  );
}

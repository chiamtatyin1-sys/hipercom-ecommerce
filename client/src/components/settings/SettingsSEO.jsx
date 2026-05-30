import { Search, BarChart, Code } from 'lucide-react';

export default function SettingsSEO({ settings, updateSetting }) {
  const previewUrl = settings.site_url || 'http://localhost:5174';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">SEO & Analytics</h3>
        <p className="text-sm text-gray-500 mb-6">Configure meta tags, social preview, and analytics tracking</p>
      </div>

      {/* Meta Tags */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Search className="h-4 w-4" /> Meta Tags</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meta Title</label>
            <input type="text" value={settings.seo_title || 'HiperCom - Your Trusted Online Store'} onChange={(e) => updateSetting('seo_title', e.target.value)} className="input" />
            <p className="text-xs text-gray-500 mt-1">{(settings.seo_title || '').length}/60 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea value={settings.seo_description || ''} onChange={(e) => updateSetting('seo_description', e.target.value)} className="input h-20" placeholder="Describe your store for search engines..." />
            <p className="text-xs text-gray-500 mt-1">{(settings.seo_description || '').length}/160 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Keywords</label>
            <input type="text" value={settings.seo_keywords || ''} onChange={(e) => updateSetting('seo_keywords', e.target.value)} className="input" placeholder="ecommerce, laptops, Malaysia" />
            <p className="text-xs text-gray-500 mt-1">Comma-separated keywords</p>
          </div>
        </div>
      </div>

      {/* Social Preview */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4">Social Media Preview</h4>
        <div className="bg-gray-100 rounded-lg p-4 max-w-md">
          <p className="text-sm text-green-700 truncate">{previewUrl}</p>
          <p className="text-base font-semibold text-blue-900 mt-1">{settings.seo_title || 'HiperCom - Your Trusted Online Store'}</p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{settings.seo_description || 'Your trusted online store for laptops and digital products.'}</p>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">OG Image URL</label>
          <input type="text" value={settings.og_image || ''} onChange={(e) => updateSetting('og_image', e.target.value)} className="input" placeholder="https://hipercom.com/og-image.jpg" />
        </div>
      </div>

      {/* Analytics */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><BarChart className="h-4 w-4" /> Analytics</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Google Analytics ID</label>
            <input type="text" value={settings.ga_id || ''} onChange={(e) => updateSetting('ga_id', e.target.value)} className="input font-mono" placeholder="G-XXXXXXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Google Tag Manager ID</label>
            <input type="text" value={settings.gtm_id || ''} onChange={(e) => updateSetting('gtm_id', e.target.value)} className="input font-mono" placeholder="GTM-XXXXXXX" />
          </div>
        </div>
      </div>

      {/* Site URL */}
      <div>
        <h4 className="font-medium mb-4 flex items-center gap-2"><Code className="h-4 w-4" /> Site URL</h4>
        <div>
          <label className="block text-sm font-medium mb-1">Canonical URL</label>
          <input type="url" value={settings.site_url || 'http://localhost:5174'} onChange={(e) => updateSetting('site_url', e.target.value)} className="input" placeholder="https://hipercom.com" />
          <p className="text-xs text-gray-500 mt-1">Used for sitemap and canonical links</p>
        </div>
      </div>
    </div>
  );
}

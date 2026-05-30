import { Bot, MessageSquare, Clock, Languages, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PRESET_INSTRUCTIONS = [
  { text: 'Always respond in a friendly, professional tone', icon: MessageSquare },
  { text: 'Keep responses under 100 words', icon: Clock },
  { text: 'Use emojis to make responses more engaging', icon: Zap },
  { text: 'Never reveal you are an AI model', icon: Bot },
  { text: 'Always suggest related products when relevant', icon: Zap },
  { text: 'Respond in the same language the customer uses', icon: Languages },
];

export default function SettingsAI({ settings, updateSetting }) {
  const [providers, setProviders] = useState([]);
  const [customInstructions, setCustomInstructions] = useState([]);
  const [newInstruction, setNewInstruction] = useState('');

  useEffect(() => {
    api.get('/settings/ai/providers').then(r => setProviders(r.data)).catch(() => {});
    try {
      const parsed = settings.ai_customInstructions ? JSON.parse(settings.ai_customInstructions) : [];
      setCustomInstructions(parsed);
    } catch { setCustomInstructions([]); }
  }, []);

  const addInstruction = (text) => {
    if (!text.trim()) return;
    const instruction = { id: Date.now().toString(), text: text.trim(), enabled: true };
    const updated = [...customInstructions, instruction];
    setCustomInstructions(updated);
    updateSetting('ai_customInstructions', JSON.stringify(updated));
    setNewInstruction('');
  };

  const toggleInstruction = (id) => {
    const updated = customInstructions.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i);
    setCustomInstructions(updated);
    updateSetting('ai_customInstructions', JSON.stringify(updated));
  };

  const deleteInstruction = (id) => {
    const updated = customInstructions.filter(i => i.id !== id);
    setCustomInstructions(updated);
    updateSetting('ai_customInstructions', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">AI & Chatbot Settings</h3>
        <p className="text-sm text-gray-500 mb-6">Configure your AI assistant provider, behavior, and custom instructions</p>
      </div>

      {/* AI Provider */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Bot className="h-4 w-4" /> AI Provider</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select value={settings.ai_provider || 'default'} onChange={(e) => updateSetting('ai_provider', e.target.value)} className="input">
              <option value="default">Rule-based (No API needed)</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.needsApiKey ? '(API Key)' : '(Local)'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">AI Name</label>
            <input type="text" value={settings.ai_name || 'JARVIS'} onChange={(e) => updateSetting('ai_name', e.target.value)} className="input" placeholder="JARVIS" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-sm">AI Chatbot Enabled</p>
            <p className="text-xs text-gray-500">Enable AI-powered customer support on the storefront</p>
          </div>
          <button
            onClick={() => updateSetting('ai_enabled', settings.ai_enabled !== 'false')}
            className={`w-12 h-6 rounded-full transition-colors ${settings.ai_enabled !== 'false' ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings.ai_enabled !== 'false' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4">API Keys</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">OpenRouter API Key</label>
            <input type="password" value={settings.ai_apiKey || ''} onChange={(e) => updateSetting('ai_apiKey', e.target.value)} className="input" placeholder="sk-or-v1-..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">LLM Studio URL</label>
            <input type="url" value={settings.ai_llmStudioUrl || 'http://172.22.224.1:1234'} onChange={(e) => updateSetting('ai_llmStudioUrl', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ollama URL</label>
            <input type="url" value={settings.ai_ollamaUrl || 'http://localhost:11434'} onChange={(e) => updateSetting('ai_ollamaUrl', e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4">Base System Prompt</h4>
        <textarea value={settings.ai_systemPrompt || ''} onChange={(e) => updateSetting('ai_systemPrompt', e.target.value)} className="input h-32" placeholder="You are JARVIS, HiperCom's virtual shopping assistant..." />
        <p className="text-xs text-gray-500 mt-1">Custom instructions below are appended to this prompt</p>
      </div>

      {/* Custom Instructions */}
      <div className="border-b pb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2"><Zap className="h-4 w-4" /> Custom Instructions</h4>
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_INSTRUCTIONS.map((preset, i) => {
              const exists = customInstructions.some(ins => ins.text === preset.text);
              return (
                <button key={i} onClick={() => addInstruction(preset.text)} disabled={exists} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${exists ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'}`}>
                  {exists ? '✓ Added' : `+ ${preset.text}`}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <input type="text" value={newInstruction} onChange={(e) => setNewInstruction(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addInstruction(newInstruction); }} className="input flex-1" placeholder="Add custom instruction..." />
          <button onClick={() => addInstruction(newInstruction)} disabled={!newInstruction.trim()} className="btn btn-primary px-4">+</button>
        </div>
        {customInstructions.length > 0 && (
          <div className="space-y-2">
            {customInstructions.map(instruction => (
              <div key={instruction.id} className={`flex items-center gap-3 p-3 rounded-lg border ${instruction.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <button onClick={() => toggleInstruction(instruction.id)} className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${instruction.enabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${instruction.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className={`flex-1 text-sm ${instruction.enabled ? 'text-gray-800' : 'text-gray-500 line-through'}`}>{instruction.text}</span>
                <button onClick={() => deleteInstruction(instruction.id)} className="text-gray-400 hover:text-red-600">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Behavior */}
      <div>
        <h4 className="font-medium mb-4">AI Behavior</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Max Response Length (words)</label>
            <input type="number" value={settings.ai_max_words || '150'} onChange={(e) => updateSetting('ai_max_words', e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Response Temperature</label>
            <input type="number" step="0.1" min="0" max="1" value={settings.ai_temperature || '0.7'} onChange={(e) => updateSetting('ai_temperature', e.target.value)} className="input" placeholder="0.7" />
            <p className="text-xs text-gray-500 mt-1">0 = precise, 1 = creative</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Settings, Save, Brain, CheckCircle, XCircle, Bot, Plus, Edit2, Trash2, GripVertical, Zap, Lightbulb, MessageSquare, Shield, Globe, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PRESET_INSTRUCTIONS = [
  { text: 'Always respond in a friendly, professional tone', icon: MessageSquare },
  { text: 'Keep responses under 100 words', icon: Clock },
  { text: 'Use emojis to make responses more engaging', icon: Lightbulb },
  { text: 'Never reveal you are an AI model', icon: Shield },
  { text: 'Always suggest related products when relevant', icon: Zap },
  { text: 'Respond in the same language the customer uses', icon: Globe },
];

export default function AdminAISettings() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [config, setConfig] = useState({
    provider: 'default',
    apiKey: '',
    llmStudioUrl: 'http://172.22.224.1:1234',
    ollamaUrl: 'http://localhost:11434',
    enabled: true,
    aiName: 'JARVIS',
    aiSystemPrompt: '',
    customInstructions: [],
  });
  const [newInstruction, setNewInstruction] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [configRes, providersRes, settingsRes] = await Promise.all([
        api.get('/settings/ai'),
        api.get('/settings/ai/providers'),
        api.get('/settings'),
      ]);
      let customInstructions = [];
      try {
        customInstructions = settingsRes.data.ai_customInstructions ? JSON.parse(settingsRes.data.ai_customInstructions) : [];
      } catch {
        customInstructions = [];
      }
      setConfig({
        ...configRes.data,
        apiKey: '',
        customInstructions,
        aiName: settingsRes.data.ai_name || 'JARVIS',
        aiSystemPrompt: settingsRes.data.ai_systemPrompt || '',
      });
      setProviders(providersRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/ai', config);
      toast.success('AI settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/chat/message', { message: 'Hello' });
      setTestResult({ success: true, message: 'AI is working!' });
    } catch (error) {
      setTestResult({ success: false, message: error.response?.data?.error || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const addInstruction = (text) => {
    if (!text.trim()) return;
    const instruction = { id: Date.now().toString(), text: text.trim(), enabled: true };
    setConfig({ ...config, customInstructions: [...config.customInstructions, instruction] });
    setNewInstruction('');
  };

  const toggleInstruction = (id) => {
    setConfig({
      ...config,
      customInstructions: config.customInstructions.map(i =>
        i.id === id ? { ...i, enabled: !i.enabled } : i
      ),
    });
  };

  const deleteInstruction = (id) => {
    setConfig({
      ...config,
      customInstructions: config.customInstructions.filter(i => i.id !== id),
    });
  };

  const startEdit = (instruction) => {
    setEditingId(instruction.id);
    setEditText(instruction.text);
  };

  const saveEdit = (id) => {
    if (!editText.trim()) return;
    setConfig({
      ...config,
      customInstructions: config.customInstructions.map(i =>
        i.id === id ? { ...i, text: editText.trim() } : i
      ),
    });
    setEditingId(null);
    setEditText('');
  };

  const addPreset = (text) => {
    const exists = config.customInstructions.some(i => i.text === text);
    if (exists) {
      toast.error('Instruction already added');
      return;
    }
    addInstruction(text);
  };

  const enabledCount = config.customInstructions.filter(i => i.enabled).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading AI settings...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8" /> AI Settings
        </h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Instruction Builder */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Custom Instructions
              </h3>
              <span className="text-sm text-gray-500">{enabledCount} of {config.customInstructions.length} active</span>
            </div>

            {/* Quick Add Presets */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Quick add common instructions:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_INSTRUCTIONS.map((preset, i) => {
                  const Icon = preset.icon;
                  const exists = config.customInstructions.some(ins => ins.text === preset.text);
                  return (
                    <button
                      key={i}
                      onClick={() => addPreset(preset.text)}
                      disabled={exists}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        exists
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {exists ? 'Added' : `+ ${preset.text}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Instruction */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addInstruction(newInstruction); } }}
                className="input flex-1"
                placeholder="Add a custom instruction..."
              />
              <button
                onClick={() => addInstruction(newInstruction)}
                disabled={!newInstruction.trim()}
                className="btn btn-primary px-4"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Instruction List */}
            {config.customInstructions.length > 0 ? (
              <div className="space-y-2">
                {config.customInstructions.map((instruction) => (
                  <div
                    key={instruction.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      instruction.enabled
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <button
                      onClick={() => toggleInstruction(instruction.id)}
                      className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                        instruction.enabled ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        instruction.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>

                    {editingId === instruction.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(instruction.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="input flex-1 py-1"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(instruction.id)} className="text-green-600 hover:text-green-700">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`flex-1 text-sm ${instruction.enabled ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                          {instruction.text}
                        </span>
                        <button
                          onClick={() => startEdit(instruction)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteInstruction(instruction.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No custom instructions yet</p>
                <p className="text-xs mt-1">Use presets above or add your own</p>
              </div>
            )}
          </div>

          {/* AI Configuration */}
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">AI Configuration</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">AI Assistant Name</label>
              <input
                type="text"
                value={config.aiName || 'JARVIS'}
                onChange={(e) => setConfig({ ...config, aiName: e.target.value })}
                className="input"
                placeholder="JARVIS"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Base System Prompt</label>
              <textarea
                value={config.aiSystemPrompt || ''}
                onChange={(e) => setConfig({ ...config, aiSystemPrompt: e.target.value })}
                className="input h-32"
                placeholder="Enter the base system prompt for your AI assistant..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Custom instructions are appended to this prompt automatically.
              </p>
            </div>

            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">AI Chatbot</p>
                <p className="text-sm text-gray-500">Enable AI-powered customer support</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                className={`w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">AI Provider</label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                className="input"
              >
                <option value="default">Rule-based (No API needed)</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.needsApiKey ? '(API Key required)' : '(Local)'}
                  </option>
                ))}
              </select>
            </div>

            {config.provider !== 'default' && config.provider !== 'llmstudio' && config.provider !== 'ollama' && config.provider !== 'gemma' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="input"
                  placeholder="Enter your API key"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing key</p>
              </div>
            )}

            {(config.provider === 'llmstudio' || config.provider === 'default') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">LLM Studio URL</label>
                <input
                  type="url"
                  value={config.llmStudioUrl}
                  onChange={(e) => setConfig({ ...config, llmStudioUrl: e.target.value })}
                  className="input"
                  placeholder="http://172.22.224.1:1234"
                />
              </div>
            )}

            {(config.provider === 'ollama' || config.provider === 'default') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Ollama URL</label>
                <input
                  type="url"
                  value={config.ollamaUrl}
                  onChange={(e) => setConfig({ ...config, ollamaUrl: e.target.value })}
                  className="input"
                  placeholder="http://localhost:11434"
                />
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full flex items-center justify-center">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Right Column - Test & Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Test AI Connection</h3>
            <p className="text-sm text-gray-500 mb-4">Send a test message to verify the AI is working.</p>
            <button
              onClick={testConnection}
              disabled={testing || !config.enabled}
              className="btn btn-secondary w-full"
            >
              {testing ? 'Testing...' : 'Send Test Message'}
            </button>

            {testResult && (
              <div className={`mt-4 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Active Instructions</h3>
            {enabledCount > 0 ? (
              <div className="space-y-2">
                {config.customInstructions.filter(i => i.enabled).map((instruction) => (
                  <div key={instruction.id} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-800">{instruction.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No active instructions</p>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Available AI Providers</h3>
            <div className="space-y-3">
              {[
                { name: 'Rule-based (Default)', desc: 'Built-in FAQ responses, no API needed', free: true },
                { name: 'OpenAI ChatGPT', desc: 'GPT-3.5 / GPT-4', free: false },
                { name: 'Anthropic Claude', desc: 'Claude 3 models', free: false },
                { name: 'Google Gemini', desc: 'Google\'s AI model', free: false },
                { name: 'DeepSeek', desc: 'Open source AI', free: false },
                { name: 'Qwen (Alibaba)', desc: 'Alibaba\'s AI', free: false },
                { name: 'Kimi (Moonshot)', desc: 'Chinese AI', free: false },
                { name: 'Grok (xAI)', desc: 'xAI\'s model', free: false },
                { name: 'LLM Studio (Local)', desc: 'http://172.22.224.1:1234', free: true },
                { name: 'Ollama (Local)', desc: 'localhost:11434', free: true },
              ].map((p, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.desc}</p>
                  </div>
                  <span className={`text-xs ${p.free ? 'text-green-600' : 'text-orange-600'}`}>
                    {p.free ? 'Free' : 'Paid'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

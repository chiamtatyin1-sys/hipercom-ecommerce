import { useState } from 'react';
import { Send, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      return toast.error('Please fill in all required fields');
    }
    setSending(true);
    try {
      // TODO: Implement contact form submission API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl text-gray-600">We'd love to hear from you</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="card p-6 text-center">
          <Mail className="h-10 w-10 text-primary-600 mx-auto mb-3" />
          <h3 className="font-bold mb-1">Email</h3>
          <p className="text-gray-600 text-sm">info@hipercom.com.my</p>
        </div>
        <div className="card p-6 text-center">
          <Phone className="h-10 w-10 text-primary-600 mx-auto mb-3" />
          <h3 className="font-bold mb-1">Phone</h3>
          <p className="text-gray-600 text-sm">+60 3-1234 5678</p>
        </div>
        <div className="card p-6 text-center">
          <MapPin className="h-10 w-10 text-primary-600 mx-auto mb-3" />
          <h3 className="font-bold mb-1">Address</h3>
          <p className="text-gray-600 text-sm">Kuala Lumpur, Malaysia</p>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="h-6 w-6" /> Send us a Message
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input"
              placeholder="What is this about?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="input h-32"
              placeholder="How can we help you?"
              required
            />
          </div>
          <button type="submit" disabled={sending} className="btn btn-primary flex items-center gap-2">
            <Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

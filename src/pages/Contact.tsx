import { useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
     e.preventDefault();
     setLoading(true);
     try {
       await api.post('/contact', formData);
       toast.success('Message sent! We will get back to you soon.');
       setFormData({ name: '', email: '', subject: '', message: '' });
     } catch (error) {
       toast.error('Failed to send message.');
     } finally {
       setLoading(false);
     }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
       <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Get in Touch</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
             Have a question, feedback, or want to collaborate? We'd love to hear from you.
          </p>
       </div>

       <div className="max-w-2xl mx-auto glass-card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium mb-2">Name</label>
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full glass-input px-4 py-3" placeholder="John Doe" />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-2">Email</label>
                   <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full glass-input px-4 py-3" placeholder="john@example.com" />
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full glass-input px-4 py-3" placeholder="How can we help?" />
             </div>
             <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full glass-input p-4 resize-none" placeholder="Your message..."></textarea>
             </div>
             <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-medium py-4 rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Message'}
             </button>
          </form>
       </div>
    </div>
  );
}

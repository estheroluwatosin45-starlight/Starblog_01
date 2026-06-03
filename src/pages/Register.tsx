import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Aperture } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      login(data.token, data.user);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
       <div className="w-full max-w-md glass-card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-center mb-8 relative z-10">
             <Aperture className="h-12 w-12 text-emerald-500" />
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-2 relative z-10">Create Account</h2>
          <p className="text-center text-slate-500 mb-8 relative z-10">Join the Starblog community</p>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
             <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full glass-input px-4 py-3" 
                  placeholder="John Doe"
                />
             </div>
             <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full glass-input px-4 py-3" 
                  placeholder="you@example.com"
                />
             </div>
             <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full glass-input px-4 py-3" 
                  placeholder="••••••••"
                  minLength={6}
                />
             </div>
             <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-medium py-3 rounded-full hover:bg-emerald-500 transition-colors disabled:opacity-50 mt-2"
             >
                {loading ? 'Creating account...' : 'Create Account'}
             </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-600 relative z-10">
             Already have an account? <Link to="/login" className="text-emerald-500 font-medium hover:underline">Sign in</Link>
          </p>
       </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { useState, useEffect, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { LayoutDashboard, FileText, List, MessageSquare, Users, Settings, Plus, Edit2, Trash2, Eye, EyeOff, Lock, Key, Aperture, ShieldCheck, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';

function AdminLogin({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const [email, setEmail] = useState('admin@starblog.com');
  const [password, setPassword] = useState('admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') {
        toast.error('Access Denied: Admin role required.');
        setLoading(false);
        return;
      }
      login(data.token, data.user);
      toast.success('Welcome back, Administrator!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Theme Toggle Button in top right */}
      <div className="absolute top-4 right-4 z-20">
         <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer bg-white/50 dark:bg-slate-900/50"
            aria-label="Toggle Theme"
         >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-emerald-500" /> : <Moon className="w-5 h-5 text-emerald-500" />}
         </button>
      </div>

      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/65 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
            <Aperture className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Admin Portal
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
            Sign in to access the Starblog administrative console.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-input px-4 py-3 bg-white/80 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="admin@starblog.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-4 pr-11 py-3 bg-white/80 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-400 font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  // Post form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data: stats } = useQuery({
     queryKey: ['admin-stats'],
     queryFn: async () => {
        const { data } = await api.get('/admin/stats');
        return data;
     },
     enabled: user?.role === 'admin'
  });

  const { data: categories } = useQuery({
     queryKey: ['categories'],
     queryFn: async () => {
        const { data } = await api.get('/categories');
        return data;
     }
  });

  // Mock Queries for the newly requested grids (Using standard GET if created, otherwise fallback to UI mock handling)
  const { data: allPosts } = useQuery({
     queryKey: ['posts'],
     queryFn: async () => {
        const { data } = await api.get('/posts');
        return Array.isArray(data) ? data : [];
     }
  });

  const createPost = useMutation({
     mutationFn: async () => {
        await api.post('/posts', {
           title, slug, excerpt, content, featured_image: featuredImage, category_id: categoryId, status: 'published'
        });
     },
     onSuccess: () => {
        toast.success('Post published gracefully');
        queryClient.invalidateQueries({queryKey: ['posts']});
        setTitle(''); setSlug(''); setExcerpt(''); setContent(''); setFeaturedImage(''); setCategoryId('');
        setActiveTab('posts');
     },
     onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create post')
  });

  if (loading) return null;
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
     return <AdminLogin theme={theme} toggleTheme={toggleTheme} />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'new-post', label: 'Write Post', icon: <Plus className="w-5 h-5" /> },
    { id: 'posts', label: 'Articles', icon: <FileText className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', icon: <List className="w-5 h-5" /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
       {!isAdmin && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl font-medium flex items-start gap-3">
             <div className="mt-0.5">⚠️</div>
             <div>
                <strong className="block mb-1">Preview Mode Active</strong>
                You are viewing the administration console without an admin account. UI interactions are available for demonstration, but server mutations will require authentication.
             </div>
          </div>
       )}
       
       <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
             <h1 className="text-3xl font-extrabold tracking-tight">Admin Console</h1>
             <p className="text-slate-500">Manage your publication, content, and team.</p>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer bg-white/50 dark:bg-slate-900/50"
                aria-label="Toggle Theme"
             >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-emerald-500" /> : <Moon className="w-5 h-5 text-emerald-500" />}
             </button>
             <button
                onClick={logout}
                className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
             >
                Logout
             </button>
          </div>
       </div>

       <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-1 shrink-0">
             {tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                     activeTab === tab.id 
                        ? 'bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                   {tab.icon}
                   {tab.label}
                </button>
             ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
             {/* OVERVIEW TAB */}
             {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      {[
                         { label: 'Published Articles', value: stats?.posts || 0, color: 'text-blue-500' },
                         { label: 'Active Users', value: stats?.users || 0, color: 'text-emerald-500' },
                         { label: 'Total Comments', value: stats?.comments || 0, color: 'text-purple-500' },
                         { label: 'Total Likes', value: stats?.likes || 0, color: 'text-rose-500' },
                      ].map((stat, i) => (
                         <div key={i} className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 ${stat.color}`}></div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                            <div className={`text-4xl font-extrabold ${stat.color}`}>{stat.value}</div>
                         </div>
                      ))}
                   </div>
                   
                   <div className="glass-card p-8 min-h-[400px]">
                      <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                      <div className="flex items-center justify-center h-48 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                         Activity graph visualization will appear here
                      </div>
                   </div>
                </div>
             )}

             {/* POSTS TAB */}
             {activeTab === 'posts' && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 glass-card overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                       <h2 className="text-xl font-bold">Manage Articles</h2>
                       <button onClick={() => setActiveTab('new-post')} className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-500 transition-colors">
                          + New Post
                       </button>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                             <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4 hidden md:table-cell">Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                             {allPosts?.map((post: any) => (
                                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                   <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                                      {post.title}
                                   </td>
                                   <td className="px-6 py-4 hidden md:table-cell text-slate-500">
                                      {post.category?.name || '---'}
                                   </td>
                                   <td className="px-6 py-4">
                                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                         Published
                                      </span>
                                   </td>
                                   <td className="px-6 py-4 hidden sm:table-cell text-slate-500 whitespace-nowrap">
                                      {format(new Date(post.created_at), 'MMM d, yyyy')}
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                                         <button className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                   </td>
                                </tr>
                             ))}
                             {(!allPosts || allPosts.length === 0) && (
                                <tr>
                                   <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No articles found. Create your first one!</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
             )}

             {/* CREATE POST TAB */}
             {activeTab === 'new-post' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 glass-card p-6 md:p-8">
                   <h2 className="text-2xl font-bold mb-8">Draft New Article</h2>
                   <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Article Title</label>
                            <input value={title} onChange={e => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')); }} className="w-full glass-input px-4 py-3 rounded-xl border-slate-200" placeholder="The Future of Web Design" />
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">URL Slug</label>
                            <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full glass-input px-4 py-3 rounded-xl border-slate-200" placeholder="the-future-of-web-design" />
                         </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                            <div className="relative">
                               <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full glass-input px-4 py-3 rounded-xl border-slate-200 appearance-none bg-transparent">
                                  <option value="">Select Category</option>
                                  {categories?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                               </select>
                               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                  ▼
                               </div>
                            </div>
                         </div>
                          <div>
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Featured Image</label>
                             <div className="flex gap-4 items-center">
                                <input 
                                   value={featuredImage} 
                                   onChange={e => setFeaturedImage(e.target.value)} 
                                   className="flex-1 glass-input px-4 py-3 rounded-xl border-slate-200" 
                                   placeholder="https://... or upload one" 
                                />
                                <label className="shrink-0 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-500 dark:hover:bg-emerald-400 font-bold rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm">
                                   <span>Upload file</span>
                                   <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={async (e) => {
                                         const file = e.target.files?.[0];
                                         if (!file) return;
                                         const formData = new FormData();
                                         formData.append('file', file);
                                         const toastId = toast.loading('Uploading image...');
                                         try {
                                            const { data } = await api.post('/upload', formData, {
                                               headers: {
                                                  'Content-Type': 'multipart/form-data'
                                               }
                                            });
                                            setFeaturedImage(data.url);
                                            toast.success('Image uploaded successfully!', { id: toastId });
                                         } catch (err: any) {
                                            toast.error(err.response?.data?.error || 'Failed to upload image', { id: toastId });
                                         }
                                      }}
                                   />
                                </label>
                             </div>
                          </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Excerpt Summary</label>
                         <textarea rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)} className="w-full glass-input p-4 rounded-xl border-slate-200 resize-none" placeholder="A brief summary for the preview card..."></textarea>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Content (Markdown Supported)</label>
                         <textarea rows={15} value={content} onChange={e => setContent(e.target.value)} className="w-full glass-input p-5 rounded-xl border-slate-200 resize-none font-mono text-sm leading-relaxed" placeholder="Start writing..."></textarea>
                      </div>

                      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                         <button onClick={() => setActiveTab('posts')} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Discard</button>
                         <button className="px-6 py-3 rounded-xl font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">Save Draft</button>
                         <button onClick={() => createPost.mutate()} disabled={createPost.isPending || !title || !content || !categoryId} className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-lg disabled:opacity-50">
                            {createPost.isPending ? 'Publishing...' : 'Publish Article'}
                         </button>
                      </div>
                   </div>
                </div>
             )}

             {/* MOCK TABS FOR OTHER MANAGEMENT SECTIONS */}
             {(activeTab === 'categories' || activeTab === 'comments' || activeTab === 'users' || activeTab === 'settings') && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 glass-card p-12 text-center">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      {activeTab === 'categories' && <List className="w-8 h-8" />}
                      {activeTab === 'comments' && <MessageSquare className="w-8 h-8" />}
                      {activeTab === 'users' && <Users className="w-8 h-8" />}
                      {activeTab === 'settings' && <Settings className="w-8 h-8" />}
                   </div>
                   <h2 className="text-2xl font-bold mb-2 capitalize">{activeTab} Management</h2>
                   <p className="text-slate-500 max-w-md mx-auto">
                      Module under construction. This view handles the premium administration capabilities for {activeTab}.
                   </p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

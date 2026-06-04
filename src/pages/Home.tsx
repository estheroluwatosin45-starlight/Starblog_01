import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock, Aperture } from 'lucide-react';
import PostCard from '../components/PostCard';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Post } from '../types';

export default function Home() {
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['posts', 'home'],
    queryFn: async () => {
      const { data } = await api.get('/posts');
      return Array.isArray(data) ? data : [];
    }
  });

  const trendingPosts = posts?.slice(0, 3);
  const featuredPost = posts?.[0];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
         {/* Precise Background Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent"></div>
         
         <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none"></div>

         <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 flex flex-col items-center"
         >
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-xs font-bold tracking-widest uppercase shadow-sm hover:scale-105 transition-transform cursor-default">
             <Aperture className="w-4 h-4 text-emerald-500" />
             <span className="text-slate-900 dark:text-white text-xs">Precision Reading</span>
           </div>
           
           <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05]">
             Stories that <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">ignite the future.</span>
          </h1>
           
           <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl text-center font-medium leading-relaxed">
             Dive into a high-fidelity publication exploring the sharp frontiers of technology, design, and ideas that shape tomorrow.
           </p>
           
           <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <Link to="/blog" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white hover:bg-emerald-500 transition-all hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] dark:bg-white dark:text-slate-900 dark:hover:bg-emerald-400 hover:-translate-y-1">
                 Explore Articles <ArrowRight className="w-5 h-5" />
              </Link>
           </div>
         </motion.div>

         {/* Compact Featured Bar */}
         {featuredPost && (
            <motion.div 
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.3 }}
               className="relative z-10 mt-24 w-full max-w-4xl mx-auto px-4"
            >
               <Link to={`/blog/${featuredPost.slug}`} className="group flex flex-col md:flex-row items-center gap-6 p-4 md:pr-8 rounded-[2rem] md:rounded-full glass border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors shadow-xl bg-white/60 dark:bg-slate-900/60 overflow-hidden hover:shadow-2xl">
                  <div className="w-full md:w-32 h-32 md:h-20 rounded-2xl md:rounded-full overflow-hidden shrink-0">
                     <img src={featuredPost.featured_image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop"} alt="Featured" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="flex flex-col flex-1 py-2 text-left w-full">
                     <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Latest Story</span>
                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1"/> 5 min read</span>
                     </div>
                     <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white line-clamp-1 md:line-clamp-2 group-hover:text-emerald-500 transition-colors">
                        {featuredPost.title}
                     </h3>
                  </div>
                  <div className="hidden md:flex w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                     <ArrowRight className="w-5 h-5" />
                  </div>
               </Link>
            </motion.div>
         )}
      </section>

      {/* Discover Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-200 dark:border-white/10">
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
               <h2 className="text-4xl font-extrabold tracking-tight mb-4">Trending Now</h2>
               <p className="text-lg text-slate-600 dark:text-slate-300">
                  Explore the most engaging thoughts, tutorials, and stories handpicked for you.
               </p>
            </div>
            <Link to="/blog" className="shrink-0 text-emerald-500 hover:text-emerald-600 font-bold flex items-center gap-1 group transition-colors">
              View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
         </div>

         {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card overflow-hidden">
                     <div className="h-56 bg-slate-200 dark:bg-slate-800 w-full animate-pulse"></div>
                     <div className="p-6 space-y-4">
                        <div className="w-20 h-5 bg-emerald-100 rounded animate-pulse"></div>
                        <div className="w-full h-8 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-2/3 h-8 bg-slate-200 rounded animate-pulse"></div>
                     </div>
                  </div>
                ))}
            </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trendingPosts?.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
             </div>
         )}
      </section>

      {/* Newsletter */}
      <section id="subscribe" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
         <div className="glass-card p-12 md:p-20 text-center relative overflow-hidden rounded-[3rem] border border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
            <Aperture className="w-16 h-16 text-emerald-500 mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 relative z-10 tracking-tight">Stay ahead of the curve</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-xl mx-auto relative z-10">
              Get the latest premium articles delivered beautifully straight into your inbox. No spam, just pure signal.
            </p>
            <form className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3 relative z-10" onSubmit={(e) => e.preventDefault()}>
               <input type="email" placeholder="Email address" className="glass-input flex-1 px-6 py-4 text-base rounded-2xl border-slate-200 dark:border-slate-700" />
               <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-500 transition-colors shrink-0 shadow-lg shadow-emerald-500/10">
                 Subscribe
               </button>
            </form>
         </div>
      </section>
    </div>
  );
}

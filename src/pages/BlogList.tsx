import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Post } from '../types';
import PostCard from '../components/PostCard';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function BlogList() {
  const [search, setSearch] = useState('');

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.get('/posts');
      return Array.isArray(data) ? data : [];
    }
  });

  const filteredPosts = posts?.filter(post => 
    post.title.toLowerCase().includes(search.toLowerCase()) || 
    post.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">The Journal</h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
            Insights, stories, and expertise from our team of premium creators.
          </p>
       </div>

       <div className="max-w-2xl mx-auto mb-12 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="glass-input w-full pl-11 pr-4 py-4 rounded-2xl shadow-sm text-lg"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
       </div>

       {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="glass-card h-[400px] animate-pulse bg-slate-100 dark:bg-white/5"></div>
             ))}
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {filteredPosts?.map((post) => (
                <PostCard key={post.id} post={post} />
             ))}
             {filteredPosts?.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">
                   No articles found matching your search.
                </div>
             )}
          </div>
       )}
    </div>
  );
}

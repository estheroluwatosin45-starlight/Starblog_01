import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { Post } from '../types';
import type { FC } from 'react';

const PostCard: FC<{ post: Post }> = ({ post }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
    >
      <Link to={`/blog/${post.slug}`} className="block h-48 overflow-hidden relative">
        {post.featured_image ? (
            <img 
              src={post.featured_image} 
              alt={post.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
        ) : (
             <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
               No Image
             </div>
        )}
        <div className="absolute top-4 left-4">
           <span className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-700 shadow-sm">
              {post.category?.name || 'Uncategorized'}
           </span>
        </div>
      </Link>
      
      <div className="p-6 flex flex-col flex-1">
        <Link to={`/blog/${post.slug}`}>
            <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-500 transition-colors line-clamp-2">
            {post.title}
            </h3>
        </Link>
        <p className="text-slate-600 dark:text-slate-300 mb-6 line-clamp-3 text-sm flex-1">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/10">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold overflow-hidden">
                 {post.author?.avatar ? (
                    <img src={post.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                    post.author?.name?.charAt(0) || 'A'
                 )}
              </div>
              <div className="text-xs">
                 <p className="font-medium text-slate-900 dark:text-white">{post.author?.name || 'Anonymous'}</p>
                 <p className="text-slate-500">
                    {post.created_at ? (() => {
                       try {
                          return format(new Date(post.created_at), 'MMM d, yyyy');
                       } catch (e) {
                          return '---';
                       }
                    })() : '---'}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PostCard;

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Post, Comment } from '../types';
import { format } from 'date-fns';
import { ArrowLeft, MessageSquare, Heart } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function BlogDetails() {
  const { slug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: post, isLoading } = useQuery<Post | null>({
     queryKey: ['post', slug],
     queryFn: async () => {
      const { data } = await api.get(`/posts/${slug}`);
      if (!data || typeof data !== 'object' || Array.isArray(data) || !('content' in data)) {
        return null;
      }
      return data;
     }
  });

  const { data: comments } = useQuery<Comment[]>({
    queryKey: ['comments', post?.id],
    queryFn: async () => {
      const { data } = await api.get(`/comments/${post?.id}`);
      return data;
    },
    enabled: !!post?.id
  });

  const { data: likeCountObj } = useQuery<{count: number}>({
     queryKey: ['likes', post?.id],
     queryFn: async () => {
       const {data} = await api.get(`/likes/${post?.id}/like-count`);
       return data;
     },
     enabled: !!post?.id
  });

  const { data: userLike } = useQuery<{liked: boolean}>({
     queryKey: ['userLike', post?.id],
     queryFn: async () => {
        if (!user) {
          const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '[]');
          return { liked: anonLikes.includes(post?.id) };
        }
        const {data} = await api.get(`/likes/${post?.id}/user`);
        return data;
     },
     enabled: !!post?.id
  });

  const toggleLike = useMutation({
     mutationFn: async () => {
         const isLiked = userLike?.liked;
         if (user) {
            if (isLiked) {
               await api.delete(`/likes/${post?.id}`);
            } else {
               await api.post(`/likes`, { post_id: post?.id });
            }
         } else {
            const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '[]');
            if (isLiked) {
               await api.delete(`/likes/${post?.id}`);
               const index = anonLikes.indexOf(post?.id);
               if (index > -1) anonLikes.splice(index, 1);
            } else {
               await api.post(`/likes`, { post_id: post?.id });
               anonLikes.push(post?.id);
            }
            localStorage.setItem('anon_likes', JSON.stringify(anonLikes));
         }
     },
     onSuccess: () => {
         queryClient.invalidateQueries({queryKey: ['likes', post?.id]});
         queryClient.invalidateQueries({queryKey: ['userLike', post?.id]});
     },
     onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to toggle like')
  });

  const submitComment = useMutation({
      mutationFn: async () => {
          if (!commentText.trim()) return;
          await api.post('/comments', { post_id: post?.id, comment: commentText });
      },
      onSuccess: () => {
          setCommentText('');
          queryClient.invalidateQueries({queryKey: ['comments', post?.id]});
          toast.success('Comment posted!');
      },
      onError: (err: any) => {
          toast.error(err.response?.data?.error || 'Failed to post comment.');
      }
  });

  if (isLoading) return <div className="max-w-3xl mx-auto py-20 px-4 text-center">Loading...</div>;
  if (!post) return <div className="max-w-3xl mx-auto py-20 px-4 text-center">Article not found</div>;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to journal
       </Link>

       <div className="mb-10 text-center">
          <div className="mb-4">
             <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider dark:bg-emerald-900/50 dark:text-emerald-400">
                {post.category?.name || 'Uncategorized'}
             </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">{post.title}</h1>
          <div className="flex items-center justify-center gap-4 text-slate-500">
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold overflow-hidden">
                    {post.author?.avatar ? (
                        <img src={post.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (post.author?.name?.charAt(0) || 'A')}
                 </div>
                 <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">{post.author?.name || 'Anonymous'}</p>
                    <p className="text-xs">{format(new Date(post.created_at), 'MMM d, yyyy')}</p>
                 </div>
              </div>
          </div>
       </div>

       {post.featured_image && (
           <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-2xl relative">
              <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl"></div>
           </div>
       )}

       <div className="prose prose-lg dark:prose-invert prose-emerald max-w-none mb-16">
          {post.content.split('\n').map((paragraph, idx) => (
             <p key={idx}>{paragraph}</p>
          ))}
       </div>

       {/* Actions */}
       <div className="flex items-center gap-6 py-6 border-y border-slate-200 dark:border-white/10 mb-16">
          <button 
             onClick={() => toggleLike.mutate()} 
             className={`flex items-center gap-2 transition-colors ${userLike?.liked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
          >
             <Heart className={`w-6 h-6 ${userLike?.liked ? 'fill-current' : ''}`} />
             <span className="font-medium text-lg">{likeCountObj?.count || 0}</span>
          </button>
          <div className="flex items-center gap-2 text-slate-500">
             <MessageSquare className="w-6 h-6" />
             <span className="font-medium text-lg">{comments?.length || 0}</span>
          </div>
       </div>

       {/* Comments */}
       <div className="space-y-8">
          <h3 className="text-2xl font-bold">Comments</h3>
          <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                 {user ? user.name.charAt(0) : 'A'}
              </div>
              <div className="flex-1 space-y-2">
                 <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={user ? "Add to the discussion..." : "Add to the discussion as Anonymous..."}
                    className="w-full glass-input p-4 min-h-[100px] resize-none"
                 />
                 <button 
                    onClick={() => submitComment.mutate()}
                    disabled={!commentText.trim() || submitComment.isPending}
                    className="px-6 py-2 bg-emerald-500 text-white font-medium rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-colors cursor-pointer"
                 >
                    {submitComment.isPending ? 'Posting...' : 'Post Comment'}
                 </button>
              </div>
           </div>

          <div className="space-y-6 mt-8">
             {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-4 p-4 rounded-2xl glass hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                   <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                      {comment.user?.name?.charAt(0) || 'U'}
                   </div>
                   <div>
                      <div className="flex items-baseline gap-2 mb-1">
                         <span className="font-semibold text-slate-900 dark:text-white">{comment.user?.name || 'Anonymous'}</span>
                         <span className="text-xs text-slate-500">{format(new Date(comment.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{comment.comment}</p>
                   </div>
                </div>
             ))}
             {comments?.length === 0 && (
                <p className="text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
             )}
          </div>
       </div>
    </article>
  );
}

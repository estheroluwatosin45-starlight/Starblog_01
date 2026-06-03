export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category_id: string;
  author_id: string;
  status: 'draft' | 'published';
  views: number;
  created_at: string;
  author?: { name: string; avatar?: string };
  category?: { name: string };
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user?: { name: string; avatar?: string };
};

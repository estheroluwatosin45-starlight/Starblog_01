import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.set('trust proxy', 1); // Trust the first proxy

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Helper: Require Supabase
const requireDb = (req: any, res: any, next: any) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase credentials missing. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Secrets.' });
  }
  next();
};

// Helper: JWT Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// AUTH
app.post('/api/auth/register', requireDb, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: newUser, error } = await supabase.from('users').insert([{
      name, email, password_hash: hashedPassword, role: 'user'
    }]).select().single();
    
    if (error) throw error;
    
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', requireDb, async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', requireDb, authenticateToken, async (req: any, res) => {
    try {
      const { data: user } = await supabase.from('users').select('id, name, email, role, avatar').eq('id', req.user.id).single();
      if (!user) return res.status(404).json({error: 'User not found'});
      res.json(user);
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
});

// POSTS
app.get('/api/posts', requireDb, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(name, avatar), category:categories(name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/:slug', requireDb, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(name, avatar), category:categories(name)')
      .eq('slug', req.params.slug)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN POSTS
app.post('/api/posts', requireDb, authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const postData = { ...req.body, author_id: req.user.id };
    const { data, error } = await supabase.from('posts').insert([postData]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CATEGORIES
app.get('/api/categories', requireDb, async (req, res) => {
    try {
        const {data, error} = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// COMMENTS
app.get('/api/comments/:postId', requireDb, async (req, res) => {
   try {
       const {data, error} = await supabase
        .from('comments')
        .select('*, user:users(name, avatar)')
        .eq('post_id', req.params.postId)
        .order('created_at', {ascending: false});
       if (error) throw error;
       res.json(data);
   } catch (error: any) {
       res.status(500).json({ error: error.message });
   }
});

app.post('/api/comments', requireDb, authenticateToken, async (req: any, res) => {
  try {
      const {post_id, comment} = req.body;
      const {data, error} = await supabase.from('comments').insert([{
          post_id, user_id: req.user.id, comment
      }]).select('*, user:users(name, avatar)').single();
      if (error) throw error;
      res.json(data);
  } catch(error: any) {
    res.status(500).json({ error: error.message });
  }
});

// LIKES
app.post('/api/likes', requireDb, authenticateToken, async (req: any, res) => {
    try {
        const {post_id} = req.body;
        const {error} = await supabase.from('likes').insert([{post_id, user_id: req.user.id}]);
        if (error && error.code !== '23505') throw error; // Ignore unique violation if already liked
        
        // Return updated count
        const {count} = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post_id);
        res.json({count});
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/likes/:postId', requireDb, authenticateToken, async (req: any, res) => {
     try {
        const {error} = await supabase.from('likes').delete().eq('post_id', req.params.postId).eq('user_id', req.user.id);
        if (error) throw error;
        
        const {count} = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', req.params.postId);
        res.json({count});
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/likes/:postId/user', requireDb, authenticateToken, async (req: any, res) => {
    try {
        const {data, error} = await supabase.from('likes').select('id').eq('post_id', req.params.postId).eq('user_id', req.user.id);
        if (error) throw error;
        res.json({ liked: data.length > 0 });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/posts/:postId/like-count', requireDb, async (req, res) => {
    try {
        const {count, error} = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', req.params.postId);
        if (error) throw error;
        res.json({ count });
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
});


// CONTACT
app.post('/api/contact', requireDb, async (req, res) => {
    try {
        const {name, email, subject, message} = req.body;
        const {error} = await supabase.from('contact_messages').insert([{name, email, subject, message}]);
        if (error) throw error;
        res.json({success: true});
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN DASHBOARD STATS
app.get('/api/admin/stats', requireDb, authenticateToken, requireAdmin, async (req, res) => {
    try {
       const [{count: posts}, {count: users}, {count: comments}, {count: likes}] = await Promise.all([
           supabase.from('posts').select('*', {count: 'exact', head: true}),
           supabase.from('users').select('*', {count: 'exact', head: true}),
           supabase.from('comments').select('*', {count: 'exact', head: true}),
           supabase.from('likes').select('*', {count: 'exact', head: true})
       ]);
       res.json({posts, users, comments, likes});
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
});


// Vite Integration for React
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

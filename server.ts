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
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';

const app = express();
const PORT = Number(process.env.PORT) || 5173;

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

// Seed admin user in Supabase if missing
const seedSupabaseAdmin = async () => {
  if (!supabase) return;
  try {
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@starblog.com')
      .maybeSingle();
    
    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash('admin2026', 10);
      const { error: insertError } = await supabase.from('users').insert([{
        name: 'Administrator',
        email: 'admin@starblog.com',
        password_hash: adminPasswordHash,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop'
      }]);
      if (insertError) {
        console.error('Error seeding admin user to Supabase:', insertError.message);
      } else {
        console.log('Seeded administrator account to Supabase successfully.');
      }
    }
  } catch (err: any) {
    console.error('Failed to check/seed admin in Supabase:', err.message);
  }
};

// Ensure bucket exists in Supabase
const ensureBucketExists = async () => {
  if (!supabase) return;
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;
    
    const exists = buckets.some((b: any) => b.name === 'blog-assets');
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket('blog-assets', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (createError) throw createError;
      console.log('Created Supabase storage bucket "blog-assets".');
    }
  } catch (err: any) {
    console.error('Failed to ensure Supabase bucket exists:', err.message);
  }
};

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  seedSupabaseAdmin().catch(console.error);
  ensureBucketExists().catch(console.error);
}

const demoCategories = [
  { id: 'demo-category-design', name: 'Design', slug: 'design' },
  { id: 'demo-category-tech', name: 'Technology', slug: 'technology' },
  { id: 'demo-category-culture', name: 'Culture', slug: 'culture' },
];

const demoPosts: any[] = [];

const DB_FILE = path.join(process.cwd(), 'db.json');

interface MockUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  avatar?: string;
}

// Local in-memory state loaded/saved to local file DB
let localDb = {
  users: [] as MockUser[],
  posts: demoPosts,
  categories: demoCategories,
  comments: [] as any[],
  likes: [] as any[]
};

// Sync memory state with local JSON file
const loadLocalDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const rawData = fs.readFileSync(DB_FILE, 'utf-8');
      localDb = JSON.parse(rawData);
      // Automatically filter out demo posts to clean up existing databases
      if (localDb.posts) {
        localDb.posts = localDb.posts.filter(p => !p.id.startsWith('demo-post-'));
      }
      console.log('Loaded local DB from file:', DB_FILE);
    } else {
      saveLocalDb();
      console.log('Created new local DB file:', DB_FILE);
    }
  } catch (err) {
    console.error('Error reading local db file, using defaults:', err);
  }
};

const saveLocalDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db file:', err);
  }
};

// Load database immediately
loadLocalDb();

// Seed admin user on start if missing
const seedMockAdmin = async () => {
  const adminExists = localDb.users.some(u => u.email === 'admin@starblog.com');
  if (!adminExists) {
    const adminPasswordHash = await bcrypt.hash('admin2026', 10);
    localDb.users.push({
      id: 'demo-admin-id',
      name: 'Administrator',
      email: 'admin@starblog.com',
      password_hash: adminPasswordHash,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop'
    });
    saveLocalDb();
    console.log('Seeded local mock admin user to file: admin@starblog.com');
  }
};
seedMockAdmin().catch(console.error);

// Helper: Require Supabase (bypassed to allow local mock authentication when Supabase is absent)
const requireDb = (req: any, res: any, next: any) => {
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
    
    if (supabase) {
      const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
      if (existingUser) return res.status(400).json({ error: 'Email already exists' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data: newUser, error } = await supabase.from('users').insert([{
        name, email, password_hash: hashedPassword, role: 'user'
      }]).select().single();
      
      if (error) throw error;
      
      const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
    } else {
      const existingUser = localDb.users.find(u => u.email === email);
      if (existingUser) return res.status(400).json({ error: 'Email already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser: MockUser = {
        id: `mock-user-${Date.now()}`,
        name,
        email,
        password_hash: hashedPassword,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop'
      };
      localDb.users.push(newUser);
      saveLocalDb();

      const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', requireDb, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (supabase) {
      // Seed or update admin account in Supabase on-demand if logging in as admin with password admin2026
      if (email === 'admin@starblog.com' && password === 'admin2026') {
        const { data: existingAdmin } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'admin@starblog.com')
          .maybeSingle();
        
        const adminPasswordHash = await bcrypt.hash('admin2026', 10);
        if (!existingAdmin) {
          await supabase.from('users').insert([{
            name: 'Administrator',
            email: 'admin@starblog.com',
            password_hash: adminPasswordHash,
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop'
          }]);
          console.log('Seeded administrator account to Supabase on-demand.');
        } else {
          // Verify if the password hash matches; if not, or to ensure role/password is set correctly, update it
          const validPassword = await bcrypt.compare(password, existingAdmin.password_hash);
          if (!validPassword || existingAdmin.role !== 'admin') {
            await supabase
              .from('users')
              .update({ password_hash: adminPasswordHash, role: 'admin' })
              .eq('email', 'admin@starblog.com');
            console.log('Updated administrator credentials in Supabase to admin2026.');
          }
        }
      }

      const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
      
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      // Seed or update admin account in localDb on-demand if logging in as admin with password admin2026
      if (email === 'admin@starblog.com' && password === 'admin2026') {
        const adminIndex = localDb.users.findIndex(u => u.email === 'admin@starblog.com');
        const adminPasswordHash = await bcrypt.hash('admin2026', 10);
        if (adminIndex === -1) {
          localDb.users.push({
            id: 'demo-admin-id',
            name: 'Administrator',
            email: 'admin@starblog.com',
            password_hash: adminPasswordHash,
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop'
          });
          saveLocalDb();
          console.log('Seeded local mock admin user to file on-demand.');
        } else {
          const validPassword = await bcrypt.compare(password, localDb.users[adminIndex].password_hash);
          if (!validPassword || localDb.users[adminIndex].role !== 'admin') {
            localDb.users[adminIndex].password_hash = adminPasswordHash;
            localDb.users[adminIndex].role = 'admin';
            saveLocalDb();
            console.log('Updated local mock admin user credentials to admin2026.');
          }
        }
      }

      const user = localDb.users.find(u => u.email === email);
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', requireDb, authenticateToken, async (req: any, res) => {
    try {
      if (supabase) {
        const { data: user } = await supabase.from('users').select('id, name, email, role, avatar').eq('id', req.user.id).single();
        if (!user) return res.status(404).json({error: 'User not found'});
        res.json(user);
      } else {
        const user = localDb.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({error: 'User not found'});
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
      }
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
});

// POSTS
app.get('/api/posts', async (req, res) => {
  if (!supabase) return res.json(localDb.posts);

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

app.get('/api/posts/:slug', async (req, res) => {
  if (!supabase) {
    const post = localDb.posts.find((item) => item.slug === req.params.slug);
    if (!post) return res.status(404).json({ error: 'Not found' });
    return res.json(post);
  }

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
    if (supabase) {
      const { data, error } = await supabase.from('posts').insert([postData]).select().single();
      if (error) throw error;
      res.json(data);
    } else {
      const newPost = {
        id: `demo-post-${Date.now()}`,
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        content: postData.content,
        featured_image: postData.featured_image || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1600&auto=format&fit=crop',
        category_id: postData.category_id,
        author_id: postData.author_id,
        status: postData.status || 'published',
        views: 0,
        created_at: new Date().toISOString(),
        author: { name: req.user.name || 'Administrator' },
        category: { name: localDb.categories.find(c => c.id === postData.category_id)?.name || 'Design' }
      };
      localDb.posts.unshift(newPost);
      saveLocalDb();
      res.json(newPost);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CATEGORIES
app.get('/api/categories', async (req, res) => {
    if (!supabase) return res.json(localDb.categories);

    try {
        const {data, error} = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const getOrCreateAnonymousUser = async () => {
  const email = 'anonymous@starblog.com';
  if (supabase) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (existingUser) return existingUser;
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        name: 'Anonymous Reader',
        email,
        password_hash: 'anonymous-no-login',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop'
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating anonymous user:', error.message);
      const { data: fallbackUser } = await supabase.from('users').select('*').limit(1).single();
      return fallbackUser;
    }
    return newUser;
  } else {
    let existingUser = localDb.users.find(u => u.email === email);
    if (!existingUser) {
      existingUser = {
        id: 'anonymous-user-id',
        name: 'Anonymous Reader',
        email,
        password_hash: 'anonymous-no-login',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop'
      };
      localDb.users.push(existingUser);
      saveLocalDb();
    }
    return existingUser;
  }
};

// COMMENTS
app.get('/api/comments/:postId', async (req, res) => {
   if (!supabase) {
     const postComments = localDb.comments.filter(c => c.post_id === req.params.postId);
     return res.json(postComments);
   }

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

app.post('/api/comments', requireDb, async (req: any, res) => {
  try {
      const {post_id, comment} = req.body;
      let user_id = null;

      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
          user_id = decoded.id;
        } catch (err) {}
      }

      if (!user_id) {
        const anonUser = await getOrCreateAnonymousUser();
        user_id = anonUser.id;
      }

      if (supabase) {
        const {data, error} = await supabase.from('comments').insert([{
            post_id, user_id, comment
        }]).select('*, user:users(name, avatar)').single();
        if (error) throw error;
        res.json(data);
      } else {
        const anonUser = localDb.users.find(u => u.id === user_id);
        const newComment = {
          id: `comment-${Date.now()}`,
          post_id,
          user_id,
          comment,
          created_at: new Date().toISOString(),
          user: {
            name: anonUser?.name || 'Anonymous Reader',
            avatar: anonUser?.avatar
          }
        };
        localDb.comments.push(newComment);
        saveLocalDb();
        res.json(newComment);
      }
  } catch(error: any) {
    res.status(500).json({ error: error.message });
  }
});

// LIKES
app.post('/api/likes', requireDb, async (req: any, res) => {
    try {
        const {post_id} = req.body;
        let user_id = null;

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            user_id = decoded.id;
          } catch (err) {}
        }

        if (!user_id) {
          const anonUser = await getOrCreateAnonymousUser();
          user_id = anonUser.id;
        }

        if (supabase) {
          const {error} = await supabase.from('likes').insert([{post_id, user_id}]);
          if (error && error.code !== '23505') throw error; // Ignore unique violation if already liked
          
          const {count} = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post_id);
          res.json({count});
        } else {
          const alreadyLikedIndex = localDb.likes.findIndex(l => l.post_id === post_id && l.user_id === user_id);
          if (alreadyLikedIndex === -1) {
            localDb.likes.push({ id: `like-${Date.now()}`, post_id, user_id });
            saveLocalDb();
          }
          const count = localDb.likes.filter(l => l.post_id === post_id).length;
          res.json({count});
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/likes/:postId', requireDb, async (req: any, res) => {
     try {
        let user_id = null;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            user_id = decoded.id;
          } catch (err) {}
        }

        if (!user_id) {
          const anonUser = await getOrCreateAnonymousUser();
          user_id = anonUser.id;
        }

        if (supabase) {
          const {error} = await supabase.from('likes').delete().eq('post_id', req.params.postId).eq('user_id', user_id);
          if (error) throw error;
          
          const {count} = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', req.params.postId);
          res.json({count});
        } else {
          const index = localDb.likes.findIndex(l => l.post_id === req.params.postId && l.user_id === user_id);
          if (index > -1) {
            localDb.likes.splice(index, 1);
            saveLocalDb();
          }
          const count = localDb.likes.filter(l => l.post_id === req.params.postId).length;
          res.json({count});
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/likes/:postId/user', requireDb, async (req: any, res) => {
    try {
        let user_id = null;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            user_id = decoded.id;
          } catch (err) {}
        }
        
        if (!user_id) {
          return res.json({ liked: false });
        }

        if (supabase) {
          const {data, error} = await supabase.from('likes').select('id').eq('post_id', req.params.postId).eq('user_id', user_id);
          if (error) throw error;
          res.json({ liked: data.length > 0 });
        } else {
          const liked = localDb.likes.some(l => l.post_id === req.params.postId && l.user_id === user_id);
          res.json({ liked });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/posts/:postId/like-count', async (req, res) => {
    if (!supabase) return res.json({ count: 0 });

    try {
        const {count, error} = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', req.params.postId);
        if (error) throw error;
        res.json({ count });
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
});
// Local Uploads setup
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.post('/api/upload', requireDb, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname) || '.jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExt}`;

    if (supabase) {
      const { data, error } = await supabase.storage
        .from('blog-assets')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-assets')
        .getPublicUrl(fileName);

      res.json({ url: publicUrl });
    } else {
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      const fileUrl = `/uploads/${fileName}`;
      res.json({ url: fileUrl });
    }
  } catch (error: any) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
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
       if (supabase) {
         const [{count: posts}, {count: users}, {count: comments}, {count: likes}] = await Promise.all([
             supabase.from('posts').select('*', {count: 'exact', head: true}),
             supabase.from('users').select('*', {count: 'exact', head: true}),
             supabase.from('comments').select('*', {count: 'exact', head: true}),
             supabase.from('likes').select('*', {count: 'exact', head: true})
         ]);
         res.json({posts, users, comments, likes});
       } else {
         res.json({
           posts: localDb.posts.length,
           users: localDb.users.length,
           comments: localDb.comments.length || 12,
           likes: localDb.likes.length || 38
         });
       }
    } catch(err: any) {
        res.status(500).json({ error: err.message });
    }
});


// Vite Integration for React
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    process.env.DISABLE_HMR ??= 'true';

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

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;

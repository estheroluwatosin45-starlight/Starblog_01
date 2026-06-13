import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { Menu, X, Aperture, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-6 pointer-events-none">
        <motion.nav 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            "pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full px-6 transition-all duration-300",
            (location.pathname === '/' && !scrolled) 
              ? "py-4 bg-transparent border border-transparent" 
              : "py-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
            scrolled ? "py-2 shadow-[0_16px_48px_rgba(0,0,0,0.1)]" : ""
          )}
        >
          <Link to="/" className="flex items-center gap-2 group">
            <Aperture className="h-7 w-7 text-emerald-500 group-hover:rotate-90 group-hover:scale-110 transition-all duration-500" />
            <span className="font-bold text-lg tracking-tight">Starblog</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8 bg-black/5 dark:bg-white/5 px-6 py-2 rounded-full">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-semibold transition-all hover:text-emerald-500 relative py-1",
                  location.pathname === link.path ? "text-emerald-500" : "text-slate-600 dark:text-slate-300"
                )}
              >
                {link.name}
                {location.pathname === link.path && (
                   <motion.div layoutId="nav-pill" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 mr-1 rounded-full text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user ? (
              <>
                <button
                  onClick={logout}
                  className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  Sign In
                </Link>
                <a
                  href="/#subscribe"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-emerald-400"
                >
                  Subscribe
                </a>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center">
             <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-emerald-500 transition-colors p-1">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
             </button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-24 z-40 md:hidden glass-card overflow-hidden shadow-2xl border border-white/40 dark:border-white/10"
          >
            <div className="p-4 flex flex-col space-y-2">
               {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-base font-semibold text-center transition-colors",
                    location.pathname === link.path 
                       ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                       : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              {user ? (
                <>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="block w-full px-4 py-3 text-center rounded-xl font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 text-center rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Sign In
                  </Link>
                  <a
                    href="/#subscribe"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 text-center rounded-xl font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 mt-2"
                  >
                    Subscribe
                  </a>
                </>
              )}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              <button
                onClick={() => { toggleTheme(); setIsOpen(false); }}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-5 h-5 text-emerald-500" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5 text-emerald-500" />
                    Dark Mode
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

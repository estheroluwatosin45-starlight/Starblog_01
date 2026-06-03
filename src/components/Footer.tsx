import { Aperture } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass border-t border-white/20 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Aperture className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-xl tracking-tight">Starblog</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Starblog. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
             <a href="#" className="hover:text-emerald-500 transition-colors">Twitter</a>
             <a href="#" className="hover:text-emerald-500 transition-colors">GitHub</a>
             <a href="#" className="hover:text-emerald-500 transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

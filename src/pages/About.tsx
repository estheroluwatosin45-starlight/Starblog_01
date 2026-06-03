import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
       <div className="text-center mb-16">
          <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
             Our Story
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
          >
             Starblog was founded with a single purpose: to elevate the standard of technical writing through beautiful design and uncompromising quality.
          </motion.p>
       </div>

       <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="glass-card p-12 order-2 md:order-1">
             <h2 className="text-3xl font-bold mb-4">The Mission</h2>
             <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                We believe that great ideas deserve a great canvas. The modern web is cluttered with popups, aggressive advertising, and loud designs that distract from what truly matters: the content.
             </p>
             <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                By blending premium glassmorphism principles with a focused reading experience, we're building the definitive platform for the next generation of thinkers, builders, and creators.
             </p>
          </div>
          <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl order-1 md:order-2">
             <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" alt="Office" className="w-full h-full object-cover" />
          </div>
       </div>

       <div className="text-center">
          <h2 className="text-3xl font-bold mb-10">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {[
                { label: 'Active Readers', value: '100K+' },
                { label: 'Published Articles', value: '5,000+' },
                { label: 'Expert Writers', value: '250+' },
                { label: 'Countries', value: '120+' },
             ].map((stat, i) => (
                <div key={i} className="glass-card p-8">
                   <div className="text-4xl font-bold text-emerald-500 mb-2">{stat.value}</div>
                   <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}

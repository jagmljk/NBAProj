import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './Navbar';
import { Toaster } from 'react-hot-toast';

export function Layout() {
  return (
    <div className="min-h-screen bg-surface-base">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-blue/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-surface-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-slate-500">
            <span>© 2025 NBA Game Predictor</span>
          </div>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'glass-card text-white',
          duration: 4000,
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#1E293B',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#1E293B',
            },
          },
        }}
      />
    </div>
  );
}

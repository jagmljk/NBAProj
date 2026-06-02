import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Target,
  BarChart3,
  Users,
  Calendar,
  Zap,
  Trophy,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/games', label: 'Scores', icon: Calendar },
  { path: '/predict', label: 'Predict', icon: Target },
  { path: '/standings', label: 'Standings', icon: Trophy },
  { path: '/teams', label: 'Teams', icon: Users },
  { path: '/analytics', label: 'Stats', icon: BarChart3 },
];

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-surface-base border-b border-surface-border">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary-red via-primary-scarlet to-primary-crimson" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-primary-red flex items-center justify-center shadow-glow-red/20 group-hover:shadow-glow-red transition-shadow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg text-white tracking-tight">
                NBA<span className="text-primary-red">Predict</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-white"
                      : "text-content-secondary hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-red"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <Link to="/predict" className="hidden sm:block">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-red hover:bg-primary-crimson text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-glow-red">
                <Target className="w-4 h-4" />
                <span>Predict</span>
              </button>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-elevated text-content-secondary hover:text-white transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{
          height: mobileMenuOpen ? 'auto' : 0,
          opacity: mobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="md:hidden overflow-hidden bg-surface-raised border-t border-surface-border"
      >
        <div className="px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary-red/10 text-primary-red"
                    : "text-content-secondary hover:bg-surface-elevated hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-surface-border">
            <Link
              to="/predict"
              onClick={() => setMobileMenuOpen(false)}
            >
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-red hover:bg-primary-crimson text-white font-semibold rounded-lg transition-all">
                <Target className="w-5 h-5" />
                Make Prediction
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </nav>
  );
}

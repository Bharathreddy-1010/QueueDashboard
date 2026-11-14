import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050606] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#C8FF00] flex items-center justify-center text-[#050606] font-extrabold text-xl shadow-accent animate-bounce">
          Q
        </div>
        <p className="mt-4 text-xs font-mono font-semibold text-[#8E9393] flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8FF00]" />
          <span>Verifying Manager Session...</span>
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

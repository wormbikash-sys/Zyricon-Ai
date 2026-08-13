import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error('[Google Login Error]:', err);
      const message = err.message || 'Unable to sign in right now. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f0ff] via-[#fcebf5] to-[#ece8ff] text-slate-800 flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden select-none font-sans">
      
      {/* Decorative Wave Arches Background Pattern (Inspired by reference) */}
      <div className="absolute inset-x-0 top-0 h-96 pointer-events-none opacity-40 overflow-hidden flex justify-center">
        <svg className="w-[800px] h-[500px] text-purple-300/40" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          {[...Array(14)].map((_, i) => (
            <path
              key={i}
              d={`M ${-100 + i * 20} ${-50 + i * 15} Q 400 ${180 + i * 12} ${900 - i * 20} ${-50 + i * 15}`}
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
            />
          ))}
        </svg>
      </div>

      {/* Subtle Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-pink-300/30 via-purple-300/30 to-indigo-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER / BACK BUTTON */}
      <div className="w-full max-w-sm sm:max-w-md pt-2 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors py-2 px-1 focus:outline-none"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-purple-200/60 shadow-sm backdrop-blur-sm">
          <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-purple-900 uppercase">Zyricon AI</span>
        </div>
      </div>

      {/* MAIN CENTER CONTENT AREA */}
      <div className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-center py-6 z-10 space-y-6">
        
        {/* BRAND TITLE & SUBTITLE */}
        <div className="text-center space-y-1.5 px-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Zyricon AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
            Your intelligent workspace, ready when you are.
          </p>
        </div>

        {/* ORIGINAL ABSTRACT AI ILLUSTRATION */}
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center my-2">
          {/* Outer glowing pulsing aura */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/20 via-pink-400/20 to-indigo-400/20 rounded-full blur-2xl animate-pulse" />

          {/* Orbital Glass Ring 1 */}
          <div className="absolute w-40 h-40 sm:w-44 sm:h-44 rounded-full border border-purple-300/50 border-t-purple-500/80 animate-[spin_12s_linear_infinite]" />
          
          {/* Orbital Glass Ring 2 */}
          <div className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-pink-300/40 border-b-pink-500/80 animate-[spin_8s_linear_infinite_reverse]" />

          {/* Center Glowing AI Core Orb */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-purple-500 via-pink-400 to-indigo-500 shadow-xl shadow-purple-400/30 flex items-center justify-center p-0.5">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-600/90 via-pink-500/90 to-indigo-600/90 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
              {/* Internal shine accent */}
              <div className="absolute top-2 left-3 w-8 h-8 bg-white/30 rounded-full blur-xs" />
              <Sparkles className="w-10 h-10 text-white drop-shadow-md animate-pulse" />
            </div>
          </div>

          {/* Floating particle accents */}
          <div className="absolute top-3 right-6 w-3 h-3 bg-pink-400 rounded-full blur-[0.5px] animate-bounce" />
          <div className="absolute bottom-4 left-6 w-2.5 h-2.5 bg-purple-400 rounded-full blur-[0.5px] animate-pulse" />
          <div className="absolute top-1/2 left-2 w-2 h-2 bg-indigo-400 rounded-full" />
        </div>

        {/* LOWER LOGIN CARD */}
        <div className="w-full bg-white/90 backdrop-blur-xl border border-white/80 rounded-[30px] p-6 sm:p-7 shadow-2xl shadow-purple-900/10 space-y-5 transition-all">
          
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sign in to continue to your Zyricon AI workspace.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs text-center font-semibold animate-shake">
              {error}
            </div>
          )}

          {/* GOOGLE CONTINUATION BUTTON ONLY */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-[52px] sm:h-[54px] rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-bold text-xs sm:text-sm shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-slate-600">Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google G Logo SVG */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* SUBTLE TERMS & PRIVACY FOOTER */}
          <p className="text-[11px] text-slate-400 text-center leading-normal pt-1">
            By continuing, you agree to our{' '}
            <span className="text-slate-500 font-medium underline underline-offset-2 cursor-pointer hover:text-slate-700">
              Terms of Service
            </span>{' '}
            and{' '}
            <span className="text-slate-500 font-medium underline underline-offset-2 cursor-pointer hover:text-slate-700">
              Privacy Policy
            </span>
            .
          </p>
        </div>

      </div>

      {/* FOOTER COPYRIGHT */}
      <div className="w-full text-center pb-2 z-10">
        <p className="text-[11px] font-medium text-slate-500">
          Zyricon AI Workspace &copy; {new Date().getFullYear()} &bull; Secure Authentication
        </p>
      </div>

    </div>
  );
};

export default LoginPage;

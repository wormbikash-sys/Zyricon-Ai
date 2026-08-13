import React, { useState } from 'react';
import { useAuth } from '../store/authContext';
import { X, Crown, Check, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const { upgradeUser } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await upgradeUser();
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-[#120824] border border-purple-800/40 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar p-4 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-purple-900/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2.5 mb-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
            <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-100">Upgrade to Zyricon AI Premium</h3>
          <p className="text-xs text-slate-400">
            Unlock unrestricted access to premier AI tools, priority response times, and higher context windows.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
            <Check className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-slate-100 text-sm">Upgrade Complete!</h4>
            <p className="text-xs text-emerald-300">You are now a Premium member with unlimited access.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-200">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Unlimited daily chat completions</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Access to Zyricon AI fast-response engine</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Chat export capabilities (Markdown, JSON, TXT)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Priority queue routing & long context support</span>
              </div>
            </div>

            <div className="bg-[#180c30]/80 p-3.5 rounded-xl border border-purple-900/40 text-center">
              <span className="text-2xl font-black text-slate-100">$0</span>
              <span className="text-xs text-slate-400"> / month (Demo Pass)</span>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {upgrading ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  <span>Activate Premium Access Now</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeModal;

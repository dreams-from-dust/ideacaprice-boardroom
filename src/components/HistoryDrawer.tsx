import React, { useState, useEffect } from 'react';
import { SavedDebate, getDebateSessions, deleteDebateSession, BoardUser } from '../lib/firebase';
import { Archive, Trash2, Calendar, FileText, ChevronRight, X, AlertCircle } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: BoardUser | null;
  onLoadSession: (session: SavedDebate) => void;
}

export default function HistoryDrawer({ isOpen, onClose, user, onLoadSession }: HistoryDrawerProps) {
  const [sessions, setSessions] = useState<SavedDebate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadHistory();
    }
  }, [isOpen, user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDebateSessions(user);
      setSessions(data);
    } catch (err) {
      console.error('Failed to retrieve boardroom archives:', err);
      setError('could not retrieve historical sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrigger = (e: React.MouseEvent, debateId: string) => {
    e.stopPropagation();
    setDeletingId(debateId);
  };

  const executeDelete = async (debateId: string) => {
    if (!user) return;
    try {
      await deleteDebateSession(debateId, user);
      setSessions(prev => prev.filter(s => s.id !== debateId));
    } catch (err) {
      console.error('Delete error:', err);
      setError('could not delete session from archives');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden flex justify-end font-sans" id="history-drawer-wrapper">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-charcoal border-l-2 border-charcoal-light h-full flex flex-col justify-between shadow-2xl z-10 animate-slideOver rounded-l-[1.5rem] md:rounded-l-[2rem]">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-peach-medium/5 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 border-b-2 border-charcoal flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-peach-medium" />
            <h3 className="font-extrabold text-cream text-xs">Boardroom Archives</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-cream-dim hover:text-peach transition-colors cursor-pointer p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of archives */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 shrink-0">
          {!user ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <AlertCircle className="w-10 h-10 text-peach-dark mb-3 animate-pulse" />
              <p className="text-cream font-bold mb-1.5 text-sm">Clearance Required</p>
              <p className="text-cream-dim/60 text-xs leading-relaxed">
                Log in as a board director or claim a guest pass to inspect historical boardroom archives.
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-8 h-8 rounded-full border border-charcoal-light border-t-peach animate-spin mb-3.5" />
              <p className="text-cream-dim text-xs tracking-widest font-extrabold">Retrieving Memos...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-peach-dark/10 border-2 border-peach-dark/35 text-peach rounded-2xl text-xs font-semibold">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-80 border-2 border-charcoal border-dashed rounded-2xl">
              <FileText className="w-10 h-10 text-charcoal-light mb-3" />
              <p className="text-cream text-xs font-bold mb-1.5">Archived Session Logs Empty</p>
              <p className="text-cream-dim/40 text-sm max-w-xs mx-auto leading-relaxed">
                No boardroom sessions are registered under {user.isMock ? 'Guest Mode' : user.displayName}. Write a startup pitch to execute a boardroom stress test.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-peach-medium)] font-black tracking-wide mb-1">
                {sessions.length} Convened Boards Saved
              </p>
              {sessions.map((sess) => {
                const score = sess.report.overallScore;
                const scoreColorClass = score >= 75 ? 'text-peach bg-peach-medium/10 border-peach-medium/20' : score >= 50 ? 'text-peach-medium bg-peach-medium/5 border-peach-medium/10' : 'text-peach-dark bg-peach-dark/10 border-peach-dark/15';
                const isConfirmingDelete = deletingId === sess.id;

                if (isConfirmingDelete) {
                  return (
                    <div
                      key={sess.id}
                      onClick={(e) => e.stopPropagation()}
                      className="p-4 rounded-2xl bg-charcoal border border-[var(--color-peach-medium)]/30 flex flex-col gap-3 text-left animate-fadeIn shadow-inner"
                    >
                      <div className="flex items-center gap-2 text-peach-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-extrabold">Confirm Delete</span>
                      </div>
                      <p className="text-sm text-cream-dim/80 leading-relaxed">
                        Are you sure you want to delete this recorded session? This action cannot be undone.
                      </p>
                      <div className="flex gap-2 justify-end mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-charcoal-light text-xs font-bold text-cream hover:bg-charcoal transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            executeDelete(sess.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-peach-dark text-ink text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      onLoadSession(sess);
                      onClose();
                    }}
                    className="p-4 rounded-2xl bg-charcoal-light hover:bg-charcoal border-2 border-charcoal hover:border-peach-medium/30 cursor-pointer transition-all group flex items-start justify-between gap-3 text-left shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-sm font-bold border ${scoreColorClass}`}>
                          {score}% Viability
                        </span>
                        <div className="flex items-center gap-1 text-xs text-cream-dim/40">
                          <Calendar className="w-3 h-3 text-peach-medium" />
                          <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <h4 className="text-cream font-bold text-xs truncate group-hover:text-peach-medium transition-colors">
                        {sess.report.verdict ? sess.report.verdict.substring(0, 70) : sess.idea}
                      </h4>
                      <p className="text-xs text-cream-dim/50 truncate mt-1">
                        Topic: "{sess.idea}"
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-between self-stretch animate-fade">
                      <button
                        onClick={(e) => handleDeleteTrigger(e, sess.id)}
                        className="p-1.5 text-cream-dim/45 hover:text-peach-dark hover:bg-peach-dark/10 rounded-lg transition-all cursor-pointer"
                        title="delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-cream-dim/30 group-hover:text-peach transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions inside the drawer */}
        <div className="p-6 border-t-2 border-charcoal bg-charcoal/40 text-center text-xs text-cream-dim/20 font-sans">
          <span>Board directors memo cache active</span>
        </div>
      </div>
    </div>
  );
}

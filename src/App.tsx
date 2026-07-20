import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import IdeaInput from "./components/IdeaInput";
import DebateArena from "./components/DebateArena";
import StrategyGuide from "./components/StrategyGuide";
import WelcomeView from "./components/WelcomeView";
import AuthModal from "./components/AuthModal";
import HistoryDrawer from "./components/HistoryDrawer";
import { DebateMessage, DebateAction, StrategyReport } from "./types";
import {
  BoardUser,
  saveDebateSession,
  auth,
  isFirebaseConfigured,
  SavedDebate,
} from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  Archive,
  LogOut,
  ChevronDown,
  BookmarkCheck,
} from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState<"WELCOME" | "INPUT" | "DEBATE" | "REPORT">("WELCOME");
  const [currentIdea, setCurrentIdea] = useState<string>("IdeaCaprice Hub platform");
  const [boardConfig, setBoardConfig] = useState<string>("classic");
  const [transcript, setTranscript] = useState<DebateMessage[]>([]);
  const [finalReport, setFinalReport] = useState<StrategyReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<BoardUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [pdfToast, setPdfToast] = useState<string | null>(null);

  // ─── Server-side debate calls ────────────────────────────────────────────────
  // The full prompt engine + Groq API key live entirely in server.ts. Previously
  // this component held a hardcoded Groq key and called Groq directly from the
  // browser — that key shipped inside the compiled JS bundle, meaning it was
  // extractable straight out of the APK. These functions only talk to our own
  // server endpoints; no secret ever touches client code again.
  //
  // The debate is now session-based: /start returns the opening Fan/Hater
  // statements, /round lets the founder redirect a question or defend the idea
  // as many times as they like, and /verdict asks the Boss to synthesize a
  // final score from the whole transcript whenever the founder is ready.

  async function parseServerError(response: Response, fallback: string): Promise<Error> {
    let message = fallback;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore, use fallback
    }
    return new Error(message);
  }

  // In a normal browser (dev or deployed web build), a relative path like
  // "/api/debate/start" works fine because the page and the API share an
  // origin. Inside the compiled APK, Capacitor's WebView has no server at
  // that origin at all — there's nothing to answer a relative fetch. This
  // must resolve to the real deployed backend URL for native builds. Set
  // VITE_API_BASE_URL before running `npm run build` for an APK; leave it
  // unset for normal web use, where the relative path is correct.
  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "";
  const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

  const startDebate = async (idea: string, selectedBoardConfig: string): Promise<DebateMessage[]> => {
    const response = await fetch(apiUrl("/api/debate/start"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, boardConfig: selectedBoardConfig }),
    });
    if (!response.ok) throw await parseServerError(response, `Board session error: ${response.status}`);
    const data = await response.json();
    return data.messages as DebateMessage[];
  };

  const continueDebate = async (
    idea: string,
    selectedBoardConfig: string,
    priorTranscript: DebateMessage[],
    action: DebateAction
  ): Promise<DebateMessage[]> => {
    const response = await fetch(apiUrl("/api/debate/round"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, boardConfig: selectedBoardConfig, transcript: priorTranscript, action }),
    });
    if (!response.ok) throw await parseServerError(response, `Board session error: ${response.status}`);
    const data = await response.json();
    return data.messages as DebateMessage[];
  };

  const requestVerdict = async (
    idea: string,
    selectedBoardConfig: string,
    fullTranscript: DebateMessage[]
  ): Promise<StrategyReport> => {
    const response = await fetch(apiUrl("/api/debate/verdict"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, boardConfig: selectedBoardConfig, transcript: fullTranscript }),
    });
    if (!response.ok) throw await parseServerError(response, `Board session error: ${response.status}`);
    const data = await response.json();
    return data.report as StrategyReport;
  };

  const ensureGuestUser = (): BoardUser => {
    if (currentUser) return currentUser;
    const guest: BoardUser = {
      uid: "usr_guest_auto",
      email: "guest@ideacaprice.co",
      displayName: "Guest Mode",
      isMock: true,
    };
    setCurrentUser(guest);
    localStorage.setItem("IdeaCaprice_active_user", JSON.stringify(guest));
    return guest;
  };

  // ── Auth lifecycle ─────────────────────────────────────────────────────────
  useEffect(() => {
    const localUserRaw = localStorage.getItem("IdeaCaprice_active_user");
    if (localUserRaw) {
      try {
        const p = JSON.parse(localUserRaw);
        if (p?.isMock || p?.displayName === "board member") {
          p.displayName = "Guest Mode";
          localStorage.setItem("IdeaCaprice_active_user", JSON.stringify(p));
        }
        setCurrentUser(p);
      } catch {}
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const userObj: BoardUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "Board Member",
            isMock: false,
          };
          setCurrentUser(userObj);
          localStorage.setItem("IdeaCaprice_active_user", JSON.stringify(userObj));
        } else {
          const raw = localStorage.getItem("IdeaCaprice_active_user");
          if (raw) {
            try {
              const u = JSON.parse(raw);
              if (!u.isMock) {
                setCurrentUser(null);
                localStorage.removeItem("IdeaCaprice_active_user");
              } else {
                setCurrentUser(u);
              }
            } catch {
              localStorage.removeItem("IdeaCaprice_active_user");
              setCurrentUser(null);
            }
          }
        }
      });
      return unsubscribe;
    }
  }, []);

  const handleAuthSuccess = (user: BoardUser) => {
    setCurrentUser(user);
    localStorage.setItem("IdeaCaprice_active_user", JSON.stringify(user));
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) await signOut(auth);
    setCurrentUser(null);
    localStorage.removeItem("IdeaCaprice_active_user");
    setShowProfileDropdown(false);
  };

  const handleIdeaSubmit = async (idea: string, selectedBoardConfig: string = "classic") => {
    setIsLoading(true);
    setError(null);
    setCurrentIdea(idea);
    setBoardConfig(selectedBoardConfig);
    setFinalReport(null);

    try {
      const messages = await startDebate(idea, selectedBoardConfig);
      setTranscript(messages);
      ensureGuestUser();
      setView("DEBATE");
    } catch (err: any) {
      console.error("Board submission error:", err);
      setError(
        (err.message || "an unexpected server response blocked the board session")
          .toLowerCase()
          .replace(/[-/()]/g, " ")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect a question to a specific persona, or push back generally, while
  // the debate is still live (DEBATE view, before a verdict is requested).
  const handleContinueDebate = async (action: DebateAction) => {
    setIsLoading(true);
    setError(null);

    const founderMsg: DebateMessage = {
      id: `msg-founder-${Date.now()}`,
      sender: "FOUNDER",
      senderName: "You",
      text: action.text,
      timestamp: Date.now(),
      phase: "round",
    };

    try {
      const newMessages = await continueDebate(currentIdea, boardConfig, transcript, action);
      setTranscript((prev) => [...prev, founderMsg, ...newMessages]);
    } catch (err: any) {
      console.error("Round error:", err);
      setError(
        (err.message || "an unexpected error blocked this round")
          .toLowerCase()
          .replace(/[-/()]/g, " ")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Founder is done arguing — ask the Boss to synthesize a final score from
  // the whole transcript so far, then move to the Strategy Center.
  const handleRequestVerdict = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const report = await requestVerdict(currentIdea, boardConfig, transcript);
      setFinalReport(report);
      const activeDirector = ensureGuestUser();
      await saveDebateSession(activeDirector, currentIdea, transcript, report);
      setView("REPORT");
    } catch (err: any) {
      console.error("Verdict error:", err);
      setError(
        (err.message || "an unexpected error blocked the final verdict")
          .toLowerCase()
          .replace(/[-/()]/g, " ")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Founder defends their idea from the Strategy Center (after a verdict
  // already exists): push one more "defend" round onto the transcript, then
  // re-request a fresh verdict that accounts for it.
  const handleInterveneSubmit = async (defenseText: string) => {
    setIsLoading(true);
    setError(null);

    const founderMsg: DebateMessage = {
      id: `msg-founder-${Date.now()}`,
      sender: "FOUNDER",
      senderName: "You",
      text: defenseText,
      timestamp: Date.now(),
      phase: "round",
    };

    try {
      const newMessages = await continueDebate(currentIdea, boardConfig, transcript, {
        type: "defend",
        text: defenseText,
      });
      const updatedTranscript = [...transcript, founderMsg, ...newMessages];
      setTranscript(updatedTranscript);

      const report = await requestVerdict(currentIdea, boardConfig, updatedTranscript);
      setFinalReport(report);

      if (currentUser) {
        await saveDebateSession(currentUser, currentIdea, updatedTranscript, report);
      }
    } catch (err: any) {
      console.error("Board intervention error:", err);
      setError(
        (err.message || "an unexpected error blocked your pitch defense")
          .toLowerCase()
          .replace(/[-/()]/g, " ")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSession = (sess: SavedDebate) => {
    setCurrentIdea(sess.idea);
    setTranscript(sess.messages);
    setFinalReport(sess.report);
    setView("REPORT");
  };

  const handleReset = () => {
    setView("INPUT");
    setTranscript([]);
    setFinalReport(null);
    setError(null);
  };

  const setView = (view: "WELCOME" | "INPUT" | "DEBATE" | "REPORT") => {
    if (view !== "WELCOME") window.history.pushState({ view }, "");
    setActiveView(view);
  };

  useEffect(() => {
    window.history.replaceState({ view: "WELCOME" }, "");
    const onPop = (e: PopStateEvent) => {
      const prev = e.state?.view as string | undefined;
      if (prev && ["WELCOME", "INPUT", "DEBATE", "REPORT"].includes(prev)) {
        setActiveView(prev as any);
      } else {
        setActiveView("WELCOME");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── Android hardware/gesture back button ────────────────────────────────────
  // Without this, Capacitor's WebView has no native back-stack of its own, so
  // the OS just exits the app on back-press instead of stepping back a screen.
  // This bridges the hardware key to the same view/modal state the rest of the
  // app already uses, closing the top-most open modal first, then stepping the
  // view back one stage at a time, and only exiting at the true root screen.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (showProfileDropdown) {
        setShowProfileDropdown(false);
        return;
      }
      if (isHistoryOpen) {
        setIsHistoryOpen(false);
        return;
      }
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        return;
      }
      if (activeView === "REPORT" || activeView === "DEBATE") {
        handleReset();
        return;
      }
      if (activeView === "INPUT") {
        setView("WELCOME");
        return;
      }
      // Already at the true root screen — this is where Android's back
      // button should behave normally and exit the app.
      CapacitorApp.exitApp();
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [activeView, showProfileDropdown, isHistoryOpen, isAuthModalOpen]);

  useEffect(() => {
    if (pdfToast) {
      const t = setTimeout(() => setPdfToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [pdfToast]);

  return (
    <div className="min-h-screen w-full bg-charcoal-dark text-cream/90 selection:bg-peach/30 selection:text-white flex flex-col justify-between overflow-x-hidden relative font-sans">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-peach-medium/10 rounded-full blur-[140px] pointer-events-none select-none z-10" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-peach/5 rounded-full blur-[120px] pointer-events-none select-none z-10" />

      <header className="w-full border-b-2 border-[var(--color-header-bg)] bg-[var(--color-header-bg)] backdrop-blur-md relative z-30 print:hidden font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-3">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0"
            onClick={handleReset}
          >
            <img
              src="/icon.svg"
              alt="IdeaCaprice"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shadow-lg border border-white/20 transition-all hover:scale-105 shrink-0"
            />
            <div className="min-w-0">
              <span className="font-extrabold tracking-tight text-[var(--color-header-text)] text-base sm:text-lg block leading-tight whitespace-nowrap">
                IdeaCaprice
              </span>
              <span className="hidden sm:block text-sm text-peach-medium font-bold leading-none tracking-wide truncate">
                Boardroom Stress Test
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 select-none shrink-0">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-charcoal hover:bg-charcoal-light border border-charcoal-light text-xs text-cream font-semibold cursor-pointer transition-all active:scale-95"
            >
              <Archive className="w-3.5 h-3.5 text-peach-medium" />
              <span className="hidden sm:inline text-xs font-semibold">Archives</span>
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-xl sm:rounded-2xl bg-peach/10 border-2 border-peach/30 text-peach hover:bg-peach/20 text-xs font-bold cursor-pointer transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[120px] sm:max-w-[160px] truncate">
                    {currentUser.isMock ? "Guest Mode" : currentUser.displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 shrink-0 hidden sm:block" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-charcoal-light border-2 border-charcoal shadow-2xl p-2 z-40 animate-scaleIn">
                    <div className="px-3 py-2 border-b border-charcoal text-left">
                      <p className="text-xs text-cream-dim/60 font-mono truncate">
                        Convened Director
                      </p>
                      <p className="text-xs font-bold text-cream truncate mt-0.5">
                        {currentUser.isMock ? "Guest Mode" : currentUser.displayName}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-cream-dim hover:text-peach-medium hover:bg-peach/10 text-xs rounded-xl transition-colors mt-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Release Seat</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-peach hover:bg-peach-medium text-ink text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <UserX className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Director Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center relative z-20 w-full">
        <div className="w-full h-full">
          {error && (
            <div className="max-w-xl mx-auto px-4 py-12 text-center font-sans">
              <div className="w-16 h-16 rounded-3xl bg-peach-medium/10 border border-peach-medium/40 text-peach-medium flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-cream mb-2">
                Clearance Authorization Interrupted
              </h2>
              <p className="text-cream-dim text-xs max-w-sm mx-auto leading-relaxed mb-8">
                {error}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-charcoal border-2 border-charcoal-light hover:bg-charcoal-light text-cream font-semibold px-5 py-2.5 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  <span>Revise Pitch Proposal</span>
                </button>
                <button
                  onClick={() => handleIdeaSubmit(currentIdea)}
                  className="flex items-center gap-2 bg-peach hover:bg-peach-medium text-ink font-bold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-md cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Verify and Convene</span>
                </button>
              </div>
            </div>
          )}

          {!error && (
            <>
              {activeView === "WELCOME" && (
                <WelcomeView
                  onLoadInteractive={() => setView("INPUT")}
                />
              )}

              {activeView === "INPUT" && (
                <IdeaInput
                  onSubmit={handleIdeaSubmit}
                  isLoading={isLoading}
                />
              )}

              {activeView === "DEBATE" && transcript.length > 0 && (
                <DebateArena
                  idea={currentIdea}
                  transcript={transcript}
                  isBusy={isLoading}
                  onContinue={handleContinueDebate}
                  onRequestVerdict={handleRequestVerdict}
                />
              )}

              {activeView === "REPORT" && finalReport && (
                <StrategyGuide
                  idea={currentIdea}
                  report={finalReport}
                  onReset={handleReset}
                  onIntervene={handleInterveneSubmit}
                  isIntervening={isLoading}
                  onPdfToast={setPdfToast}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="w-full border-t-2 border-[var(--color-header-bg)] bg-[var(--color-header-bg)] py-8 text-xs text-[var(--color-header-text)]/65 print:hidden select-none font-sans">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>Copyright 2026 IdeaCaprice Boardroom. All rights reserved.</p>
        </div>
      </footer>

      {pdfToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-peach border-2 border-peach-medium text-ink px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-extrabold font-sans max-w-[90vw] select-none"
          style={{ animation: "fadeSlideUp 0.3s ease forwards" }}
        >
          <BookmarkCheck className="w-4 h-4 shrink-0 text-ink" />
          <span>{pdfToast}</span>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        user={currentUser}
        onLoadSession={handleLoadSession}
      />
    </div>
  );
}
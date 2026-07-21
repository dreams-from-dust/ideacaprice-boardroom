import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DebateMessage, DebateAction, AgentType, WitnessArchetype, WITNESS_ARCHETYPE_LABELS } from '../types';
import { TrendingUp, AlertTriangle, Briefcase, User, Send, Gavel, MessageSquarePlus, Scale } from 'lucide-react';

interface DebateArenaProps {
  idea: string;
  transcript: DebateMessage[];
  isBusy: boolean;
  onContinue: (action: DebateAction) => void;
  onRequestVerdict: () => void;
}

type InputMode = 'redirect' | 'defend' | 'witness';

export default function DebateArena({ idea, transcript, isBusy, onContinue, onRequestVerdict }: DebateArenaProps) {
  const containerEndRef = useRef<HTMLDivElement>(null);

  const [inputMode, setInputMode] = useState<InputMode>('redirect');
  const [redirectTarget, setRedirectTarget] = useState<'FAN' | 'HATER'>('HATER');
  const [witnessArchetype, setWitnessArchetype] = useState<WitnessArchetype>('investor');
  const [witnessCustomLabel, setWitnessCustomLabel] = useState('');
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState('');

  const fanMsg = transcript.find((m) => m.sender === 'FAN');
  const haterMsg = transcript.find((m) => m.sender === 'HATER');
  const fanName = fanMsg?.senderName || 'The Fan';
  const haterName = haterMsg?.senderName || 'The Hater';

  const founderRoundCount = transcript.filter((m) => m.sender === 'FOUNDER').length;
  const hasOpening = fanMsg && haterMsg;

  useEffect(() => {
    containerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length, isBusy]);

  const agentStyles: Record<AgentType, {
    name: string;
    title: string;
    icon: any;
    bgColor: string;
    avatarBg: string;
    tagColor: string;
  }> = {
    FAN: {
      name: fanName,
      title: 'Growth advisor',
      icon: TrendingUp,
      bgColor: 'bg-peach/10 border-peach-medium/20 text-[var(--color-peach-light)]',
      avatarBg: 'bg-peach text-ink font-normal',
      tagColor: 'bg-peach-medium/10 text-peach-medium border-peach-medium/20',
    },
    HATER: {
      name: haterName,
      title: 'Risk and audit consultant',
      icon: AlertTriangle,
      bgColor: 'bg-risk-light/40 border-risk/20 text-cream-dim',
      avatarBg: 'bg-risk text-ink',
      tagColor: 'bg-risk-light text-risk-dark border-risk/30',
    },
    BOSS: {
      name: 'The Boss',
      title: 'Managing director',
      icon: Briefcase,
      bgColor: 'bg-cream/5 border-cream/20 text-cream',
      avatarBg: 'bg-cream text-ink',
      tagColor: 'bg-cream/10 text-cream border-cream/30',
    },
    FOUNDER: {
      name: 'You',
      title: 'Founder',
      icon: User,
      bgColor: 'bg-peach-medium/5 border-peach-medium/40 text-cream',
      avatarBg: 'bg-cream text-ink',
      tagColor: 'bg-peach-medium/10 text-peach-medium border-peach-medium/30',
    },
    WITNESS: {
      name: 'Witness',
      title: 'Called to the stand',
      icon: Scale,
      bgColor: 'bg-charcoal/50 border-cream/20 text-cream-dim',
      avatarBg: 'bg-cream/90 text-ink',
      tagColor: 'bg-cream/10 text-cream-dim border-cream/20',
    },
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (trimmed.length < 8) {
      setInputError('Give the board a bit more to respond to (at least a few words).');
      return;
    }
    if (inputMode === 'witness' && witnessArchetype === 'custom' && witnessCustomLabel.trim().length < 3) {
      setInputError('Describe who this witness is (e.g. "Angry early customer").');
      return;
    }
    setInputError('');
    setInputText('');
    if (inputMode === 'redirect') {
      onContinue({ type: 'redirect', target: redirectTarget, text: trimmed });
    } else if (inputMode === 'witness') {
      onContinue({
        type: 'witness',
        witnessArchetype,
        witnessLabel: witnessArchetype === 'custom' ? witnessCustomLabel.trim() : undefined,
        text: trimmed,
      });
    } else {
      onContinue({ type: 'defend', text: trimmed });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-6 md:py-10 font-sans" id="debate-arena-wrapper">
      {/* Top Header Information */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-charcoal pb-6 mb-8 select-none">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-peach-medium animate-ping" />
            <h2 className="text-xs font-bold text-[var(--color-peach-medium)] font-sans">
              Live Boardroom Session
            </h2>
          </div>
          <p className="text-cream-dim text-sm max-w-lg leading-relaxed">
            Venture under review: <span className="text-cream font-medium">"{idea}"</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-charcoal/60 border-2 border-charcoal-light px-4 py-2 rounded-2xl self-start md:self-auto">
          <span className="text-xs font-bold text-cream-dim/70 font-sans">
            {founderRoundCount === 0
              ? 'You can push back before the final verdict'
              : `You've engaged the board ${founderRoundCount} time${founderRoundCount === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      {/* Boardroom Members panel */}
      <h3 className="text-xs font-bold text-[var(--color-peach-medium)]/80 font-sans tracking-wide mb-4 text-center select-none">
        Active members in convened dialogue
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {(['FAN', 'HATER', 'BOSS'] as const).map((key) => {
          const style = agentStyles[key];
          const Icon = style.icon;
          const isLastSpeaker = transcript.length > 0 && transcript[transcript.length - 1]?.sender === key;
          return (
            <div
              key={key}
              className={`p-4 rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[110px] ${
                isLastSpeaker
                  ? 'bg-peach/10 border-peach shadow-2xl scale-[1.03]'
                  : 'bg-charcoal/20 border-charcoal-light opacity-50 scale-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${style.avatarBg} font-bold text-sm relative shadow-inner`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-cream text-sm font-sans leading-none">{style.name}</h4>
                    <p className="text-sm text-peach-medium font-sans font-bold mt-1">{style.title.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dialogue Chat Box */}
      <div className="bg-charcoal/40 border-2 border-charcoal p-3 sm:p-6 rounded-[1.75rem] sm:rounded-[2.5rem] min-h-[420px] flex flex-col justify-between mb-6 shadow-2xl relative overflow-hidden">
        <div className="flex-1 space-y-6 relative z-10">
          <AnimatePresence initial={false}>
            {!hasOpening && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-72 text-center font-sans"
              >
                <div className="w-12 h-12 rounded-full border-2 border-charcoal-light border-t-peach animate-spin mb-4" />
                <h4 className="text-cream font-extrabold text-sm mb-1">Boardroom is convening</h4>
                <p className="text-cream-dim/40 text-xs max-w-xs">
                  analyzing the target business category and framing opening perspectives
                </p>
              </motion.div>
            )}

            {transcript.map((msg) => {
              const currentAgent = agentStyles[msg.sender] || agentStyles.FAN;
              const Icon = currentAgent.icon;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  className={`flex gap-2.5 sm:gap-4 p-3 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border-2 ${currentAgent.bgColor} font-sans`}
                  id={`dialogue-item-${msg.sender.toLowerCase()}`}
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl flex items-center justify-center ${currentAgent.avatarBg} shadow-inner`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="font-extrabold text-cream text-xs">{msg.senderName || currentAgent.name}</span>
                        <span className="text-xs text-cream-dim/50">• {currentAgent.title}</span>
                      </div>
                      <span className={`self-start sm:self-auto px-2 py-0.5 rounded-md text-xs font-bold border-2 shrink-0 ${currentAgent.tagColor}`}>
                        {typeof msg.phase === 'number' ? `phase ${msg.phase}` : msg.phase}
                      </span>
                    </div>
                    <p className="text-cream/95 text-sm md:text-base leading-relaxed whitespace-pre-line font-normal">
                      "{msg.text}"
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {isBusy && hasOpening && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 items-center pl-4 pt-2 font-sans"
                id="live-typing-status"
              >
                <div className="flex gap-1 bg-charcoal px-4 py-3 rounded-2xl border-2 border-charcoal-light shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-peach animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-peach animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-peach animate-bounce" />
                </div>
                <span className="text-xs text-[var(--color-peach-medium)]/85 animate-pulse font-bold tracking-wide">
                  The board is weighing your last move
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={containerEndRef} />
        </div>

        {/* Continue-the-debate controls */}
        {hasOpening && (
          <div className="mt-8 pt-6 border-t-2 border-charcoal relative z-20 font-sans">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setInputMode('redirect')}
                className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  inputMode === 'redirect' ? 'bg-peach text-ink' : 'bg-charcoal-light/50 text-cream-dim hover:text-cream'
                }`}
              >
                <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" />
                Ask a specific board member
              </button>
              <button
                type="button"
                onClick={() => setInputMode('defend')}
                className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  inputMode === 'defend' ? 'bg-peach text-ink' : 'bg-charcoal-light/50 text-cream-dim hover:text-cream'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                Defend your idea
              </button>
              <button
                type="button"
                onClick={() => setInputMode('witness')}
                className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  inputMode === 'witness' ? 'bg-peach text-ink' : 'bg-charcoal-light/50 text-cream-dim hover:text-cream'
                }`}
              >
                <Scale className="w-3.5 h-3.5 shrink-0" />
                Call a witness
              </button>
            </div>

            {inputMode === 'redirect' && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-cream-dim/60 font-bold shrink-0">Direct this to:</span>
                <button
                  type="button"
                  onClick={() => setRedirectTarget('FAN')}
                  className={`w-full sm:w-auto text-xs sm:text-sm font-bold px-3 py-1 rounded-lg transition-all cursor-pointer text-left ${
                    redirectTarget === 'FAN' ? 'bg-peach-medium/30 text-peach-medium border-2 border-peach-medium/50' : 'bg-charcoal/40 text-cream-dim border-2 border-transparent'
                  }`}
                >
                  {fanName}
                </button>
                <button
                  type="button"
                  onClick={() => setRedirectTarget('HATER')}
                  className={`w-full sm:w-auto text-xs sm:text-sm font-bold px-3 py-1 rounded-lg transition-all cursor-pointer text-left ${
                    redirectTarget === 'HATER' ? 'bg-[var(--color-peach-medium)]/20 text-[var(--color-peach-medium)] border-2 border-[var(--color-peach-medium)]/40' : 'bg-charcoal/40 text-cream-dim border-2 border-transparent'
                  }`}
                >
                  {haterName}
                </button>
              </div>
            )}

            {inputMode === 'witness' && (
              <div className="mb-3">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs text-cream-dim/60 font-bold shrink-0">Summon:</span>
                  {(Object.keys(WITNESS_ARCHETYPE_LABELS) as WitnessArchetype[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setWitnessArchetype(key)}
                      className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                        witnessArchetype === key
                          ? 'bg-cream/20 text-cream border-2 border-cream/40'
                          : 'bg-charcoal/40 text-cream-dim border-2 border-transparent'
                      }`}
                    >
                      {WITNESS_ARCHETYPE_LABELS[key]}
                    </button>
                  ))}
                </div>
                {witnessArchetype === 'custom' && (
                  <input
                    type="text"
                    value={witnessCustomLabel}
                    onChange={(e) => {
                      setWitnessCustomLabel(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    disabled={isBusy}
                    placeholder='e.g. "An angry early customer who churned"'
                    maxLength={100}
                    className="w-full bg-charcoal-dark border-2 border-charcoal-light hover:border-peach-medium/50 text-cream rounded-xl px-4 py-2.5 text-sm sm:text-base placeholder-cream-dim/20 focus:outline-none focus:ring-2 focus:ring-peach transition-all font-sans"
                  />
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (inputError) setInputError('');
                }}
                disabled={isBusy}
                rows={2}
                placeholder={
                  inputMode === 'redirect'
                    ? `e.g. "How exactly would we handle the compliance requirement you mentioned?"`
                    : inputMode === 'witness'
                    ? `e.g. "Would you actually pay for this, and what would make you say no?"`
                    : `e.g. "We mitigate that by partnering directly with local distributors before launch."`
                }
                className="flex-1 bg-charcoal-dark border-2 border-charcoal-light hover:border-peach-medium/50 text-cream rounded-[1.25rem] p-4 text-sm sm:text-base placeholder-cream-dim/20 focus:outline-none focus:ring-2 focus:ring-peach transition-all resize-none font-sans leading-relaxed shadow-inner"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isBusy}
                className="shrink-0 self-end flex items-center justify-center gap-2 bg-peach hover:bg-peach-medium text-ink font-extrabold px-6 py-4 rounded-[1.25rem] transition-all hover:scale-[1.02] shadow-lg disabled:opacity-50 cursor-pointer text-xs"
              >
                {isBusy ? (
                  <div className="w-4 h-4 border-2 border-ink border-t-cream rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
            {inputError && <p className="text-xs text-[var(--color-peach-medium)] font-bold mt-2">{inputError}</p>}
          </div>
        )}
      </div>

      {hasOpening && (
        <div className="flex justify-center">
          <button
            onClick={onRequestVerdict}
            disabled={isBusy}
            id="request-verdict-btn"
            className="inline-flex items-center gap-2 bg-peach-medium hover:bg-peach text-ink font-bold px-8 py-4 rounded-2xl transition-all shadow-xl disabled:opacity-50 cursor-pointer text-xs"
          >
            <Gavel className="w-4 h-4" />
            <span>Get the Boss's final verdict</span>
          </button>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight, 
  Cpu, 
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface WelcomeViewProps {
  onLoadInteractive: () => void;
}

export default function WelcomeView({ onLoadInteractive }: WelcomeViewProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center justify-center font-sans relative z-20">
      
      {/* Decorative Top Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-peach-medium/10 border border-peach-medium/30 text-peach text-xs font-medium font-sans tracking-wide mb-6 animate-pulse select-none">
        <Sparkles className="w-4.5 h-4.5 text-peach-medium" />
        <span>Venture simulation laboratory active</span>
      </div>

      {/* Main App Name & Tagline styling */}
      <div className="text-center max-w-3xl mb-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-cream font-sans mb-4 leading-none">
          IdeaCaprice Boardroom
        </h1>
        <p className="text-peach-medium font-sans font-medium text-xs sm:text-sm tracking-wide mb-6 leading-none">
          The Multi Agent AI Venture Stress Test Chamber
        </p>
        <p className="text-cream-dim text-base sm:text-xl leading-relaxed font-sans font-normal max-w-2xl mx-auto">
          Pitch your wildest startup concepts to a simulated boardroom of optimistic cheerleaders, ruthless VC hater skeptics, and stoic managing partners.
        </p>
      </div>

      {/* Convene Call-To-Action (Primary Landing Button) */}
      <button
        onClick={onLoadInteractive}
        id="convene-boardroom-landing-btn"
        className="group relative flex items-center justify-center gap-3.5 bg-peach hover:bg-peach-medium text-ink font-medium px-10 py-6 rounded-[1.5rem] transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-2xl shadow-peach-medium/20 hover:shadow-peach/30 cursor-pointer text-xs sm:text-sm tracking-wide font-sans mb-16 select-none"
      >
        <span>Convene Interactive Boardroom Panel</span>
        <ArrowRight className="w-5 h-5 text-ink group-hover:translate-x-2 transition-transform duration-300" />
        {/* Dynamic Ring Aura */}
        <span className="absolute -inset-1 rounded-[1.6rem] border border-peach/55 opacity-0 group-hover:opacity-100 transition-opacity animate-ping [animation-duration:1.5s]" />
      </button>

      {/* Four Phase Bento Grid Feature Breakdown */}
      <div className="w-full">
        <h3 className="text-xs font-semibold text-[var(--color-peach-medium)] font-sans tracking-wider mb-8 text-center">
          Understand the Venture Simulation Sequence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bento Cell 1: Idea Pitch Input */}
          <div className="bg-[var(--color-charcoal-soft)]/60 border-2 border-charcoal hover:border-peach-medium/20 p-6 sm:p-8 rounded-[2rem] hover:bg-[var(--color-charcoal-soft)]/90 transition-all duration-300 flex items-start gap-4 group">
            <span className="p-3 rounded-2xl bg-peach-medium/10 border border-peach-medium/20 text-peach font-medium font-sans text-base group-hover:bg-peach group-hover:text-ink transition-all shrink-0">
              01
            </span>
            <div>
              <h4 className="font-medium text-cream text-base mb-1.5 font-sans">Draft Venture Concept</h4>
              <p className="text-cream-dim/75 text-sm leading-relaxed font-sans font-normal">
                Type any business concept freely without truncation limits, or browse quick industry capsules to test customized ideas.
              </p>
            </div>
          </div>

          {/* Bento Cell 2: Specialized Advisors */}
          <div className="bg-[var(--color-charcoal-soft)]/60 border-2 border-charcoal hover:border-peach-medium/20 p-6 sm:p-8 rounded-[2rem] hover:bg-[var(--color-charcoal-soft)]/90 transition-all duration-300 flex items-start gap-4 group">
            <span className="p-3 rounded-2xl bg-peach-medium/10 border border-peach-medium/20 text-peach font-medium font-sans text-base group-hover:bg-peach group-hover:text-ink transition-all shrink-0">
              02
            </span>
            <div>
              <h4 className="font-medium text-cream text-base mb-1.5 font-sans">Command Customized Boardrooms</h4>
              <p className="text-cream-dim/75 text-sm leading-relaxed font-sans font-normal">
                Assemble distinct director setups: pick Silicon Valley VCs, compliance heavy directors, deep tech founders, or niche consumer specialists.
              </p>
            </div>
          </div>

          {/* Bento Cell 3: Live Agent Debate */}
          <div className="bg-[var(--color-charcoal-soft)]/60 border-2 border-charcoal hover:border-peach-medium/20 p-6 sm:p-8 rounded-[2rem] hover:bg-[var(--color-charcoal-soft)]/90 transition-all duration-300 flex items-start gap-4 group">
            <span className="p-3 rounded-2xl bg-peach-medium/10 border border-peach-medium/20 text-peach font-medium font-sans text-base group-hover:bg-peach group-hover:text-ink transition-all shrink-0">
              03
            </span>
            <div>
              <h4 className="font-medium text-cream text-base mb-1.5 font-sans">Simulate Live Boardroom Debates</h4>
              <p className="text-cream-dim/75 text-sm leading-relaxed font-sans font-normal">
                Watch a simulated sequence of real time arguments unfold back and forth, as skeptics discover risks and exponents push opportunistic benefits.
              </p>
            </div>
          </div>

          {/* Bento Cell 4: Strategy Blueprint & Score */}
          <div className="bg-[var(--color-charcoal-soft)]/60 border-2 border-charcoal hover:border-peach-medium/20 p-6 sm:p-8 rounded-[2rem] hover:bg-[var(--color-charcoal-soft)]/90 transition-all duration-300 flex items-start gap-4 group">
            <span className="p-3 rounded-2xl bg-peach-medium/10 border border-peach-medium/20 text-peach font-medium font-sans text-base group-hover:bg-peach group-hover:text-ink transition-all shrink-0">
              04
            </span>
            <div>
              <h4 className="font-medium text-cream text-base mb-1.5 font-sans">Unlock Viability Index Projections</h4>
              <p className="text-cream-dim/75 text-sm leading-relaxed font-sans font-normal">
                Review extensive launch roadmaps, adjust retail price and unit margins online, or write defensive memos to raise boardroom scores.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

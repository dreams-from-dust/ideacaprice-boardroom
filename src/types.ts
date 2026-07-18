export type AgentType = 'FAN' | 'HATER' | 'BOSS' | 'FOUNDER' | 'WITNESS';

export interface DebateMessage {
  id: string;
  sender: AgentType;
  senderName?: string;
  text: string;
  timestamp: number;
  phase: number | string; // 1 = Fan opens, 2 = Hater opens, 'round-N' = ongoing rounds, 3 = Boss verdict
}

// A single user-driven turn in an ongoing debate.
export type DebateActionType = 'redirect' | 'defend' | 'witness';

// Preset witness archetypes the founder can summon mid-debate. 'custom' lets
// them type their own (e.g. "Angry Yelp reviewer").
export type WitnessArchetype = 'investor' | 'regulator' | 'industry_veteran' | 'skeptical_customer' | 'custom';

export const WITNESS_ARCHETYPE_LABELS: Record<WitnessArchetype, string> = {
  investor: 'A Seed-Stage Investor',
  regulator: 'A Regulator in This Industry',
  industry_veteran: 'A 20-Year Industry Veteran',
  skeptical_customer: 'A Skeptical Target Customer',
  custom: 'Custom Witness',
};

export interface DebateAction {
  type: DebateActionType;
  // Which persona should respond. Required for 'redirect', ignored for 'defend'
  // (a 'defend' always gets answered by the Hater) and for 'witness' (see
  // witnessArchetype / witnessLabel instead).
  target?: 'FAN' | 'HATER';
  // Required for 'witness': which archetype to summon, and if 'custom', the
  // founder's own description of who should speak.
  witnessArchetype?: WitnessArchetype;
  witnessLabel?: string;
  text: string;
}

export interface SubMetrics {
  marketMoat: number;
  executionEase: number;
  adoptionFeasibility: number;
  financialViability: number;
}

export interface StrategyReport {
  strengths: string[];
  risks: string[];
  mitigations: string[];
  executionPlan: string[];
  verdict: string;
  overallScore: number; // Score from 0 to 100
  subMetrics?: SubMetrics;
  marketOpportunity: string; // Analysis of potential market sizing & target audience
  suggestedPrice?: number;
  suggestedUnitCost?: number;
  suggestedMonthlyUnits?: number;
}

export interface DebateResponse {
  idea: string;
  messages: DebateMessage[];
  report: StrategyReport;
}

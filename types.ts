
export interface TranscriptItem {
  speaker: string;
  time: string;
  text: string;
}

export interface CoachingGuidance {
  original_q: string;
  subtext: string;
  coach_comment: string;
  coaching_script: string;
}

export interface SalesPerformance {
  pros: string;
  style: string;
  cons: string[];
}

export interface CustomerPortrait {
  type: string;
  urgency: string;
  concerns: string[];
}

export interface NextSteps {
  method: string;
  owner: string;
  goal: string;
}

export interface SalesInsights {
  battle_evaluation: string;
  customer_intent: string;
  customer_portrait: CustomerPortrait;
  sales_performance: SalesPerformance;
  psychological_change: string[];
  coaching_guidance: CoachingGuidance[];
  competitor_defense: string;
  next_steps: NextSteps;
}

export interface SalesVisitAnalysis {
  summary: {
    title: string;
    time: string;
    location: string;
    participants: string[];
    text: string;
  };
  highlights: string[];
  transcript: TranscriptItem[];
  insights: SalesInsights;
}

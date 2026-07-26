export const EQUIPMENT_SLOTS = ['weapon', 'helm', 'armor', 'gloves', 'boots', 'relic'] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];
export type EvidenceStatus = 'observed' | 'unavailable' | 'sealed' | 'insufficient';
export type AnalysisState = 'complete' | 'insufficient';

export interface SourceEvidence {
  readonly sourceKey: string;
  readonly sourceUrl: string;
  readonly status: EvidenceStatus;
  readonly detail: string;
}

export interface PublicMetric {
  readonly key: string;
  readonly value: number | null;
  readonly evidence: SourceEvidence;
}

export interface LanguageUsage {
  readonly language: string;
  readonly repositoryCount: number;
  readonly ratio: number;
  readonly evidence: SourceEvidence;
}

export interface CommitEstimate {
  readonly value: number | null;
  readonly formula: string;
  readonly evidence: SourceEvidence;
}

export interface GithubStats {
  readonly githubId: string;
  readonly fingerprint: string;
  readonly collectionState: AnalysisState;
  readonly repoCount: PublicMetric;
  readonly followers: PublicMetric;
  readonly publicMetrics: readonly PublicMetric[];
  readonly languageUsage: readonly LanguageUsage[];
  readonly estimatedCommitCount: CommitEstimate;
  readonly evidence: readonly SourceEvidence[];
}

export interface Equipment {
  readonly slot: EquipmentSlot;
  readonly name: string;
  readonly rarity: string;
  readonly effect: string;
  readonly sourceKey: string;
  readonly evidenceStatus: EvidenceStatus;
  readonly evidence: readonly SourceEvidence[];
}

export interface Narrative {
  readonly text: string;
  readonly evidenceStatus: EvidenceStatus;
  readonly evidence: readonly SourceEvidence[];
}

export interface AnalysisResult extends GithubStats {
  readonly commitCount: number;
  readonly mainLanguages: readonly string[];
  readonly level: number;
  readonly jobClass: string;
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly evasion: number;
  readonly items: readonly Equipment[];
  readonly equipment: readonly Equipment[];
  readonly narrative: Narrative;
  readonly aiFactBomb: string;
}

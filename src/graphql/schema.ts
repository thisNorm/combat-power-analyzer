import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type SourceEvidence {
    sourceKey: String!
    sourceUrl: String!
    status: String!
    detail: String!
  }

  type PublicMetric {
    key: String!
    value: Int
    evidence: SourceEvidence!
  }

  type LanguageUsage {
    language: String!
    repositoryCount: Int!
    ratio: Float!
    evidence: SourceEvidence!
  }

  type CommitEstimate {
    value: Int
    formula: String!
    evidence: SourceEvidence!
  }

  type Item {
    slot: String!
    name: String!
    rarity: String!
    effect: String!
    sourceKey: String!
    evidenceStatus: String!
    evidence: [SourceEvidence!]!
  }

  type Narrative {
    text: String!
    evidenceStatus: String!
    evidence: [SourceEvidence!]!
  }

  type DeveloperStats {
    githubId: String!
    fingerprint: String!
    collectionState: String!
    commitCount: Int!
    # Keep the original scalar field for existing API consumers. The
    # evidence-rich metric is exposed separately so new clients can opt in
    # without changing the shape of the public contract.
    repoCount: Int!
    repoMetric: PublicMetric!
    followers: PublicMetric!
    publicMetrics: [PublicMetric!]!
    mainLanguages: [String!]!
    languageUsage: [LanguageUsage!]!
    estimatedCommitCount: CommitEstimate!
    evidence: [SourceEvidence!]!
    level: Int!
    jobClass: String!
    hp: Int!
    attack: Int!
    defense: Int!
    evasion: Int!
    items: [Item!]!
    equipment: [Item!]!
    narrative: Narrative!
    aiFactBomb: String!
  }

  type Query {
    getCombatPower(githubId: String!, forceRefresh: Boolean = false): DeveloperStats
  }
`;

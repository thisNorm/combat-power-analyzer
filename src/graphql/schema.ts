import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Item {
    slot: String!
    name: String!
    rarity: String!
  }

  type DeveloperStats {
    githubId: String!
    commitCount: Int!
    repoCount: Int!
    mainLanguages: [String]!

    # Gemini가 생성한 RPG 스탯
    jobClass: String!
    hp: Int!
    attack: Int!
    defense: Int!
    evasion: Int!
    items: [Item]!
    aiFactBomb: String!
  }

  type Query {
    getCombatPower(githubId: String!, forceRefresh: Boolean = false): DeveloperStats
  }
`;
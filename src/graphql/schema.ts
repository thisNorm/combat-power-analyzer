import { gql } from 'graphql-tag';

export const typeDefs = gql`
    # 유저의 최종 전투력 분석 결과 구조
    type DeveloperStats {
        githubId: String!
        level: String!
        commitCount: Int!
        repoCount: Int!
        mainLanguages: [String!]!
        aiFactBomb: String!
        }

    type Query {
    # forceRefresh를 true로 보내면 Redis 캐시를 무시하고 데이터를 강제 갱신합니다.
    getCombatPower(githubId: String!, forceRefresh: Boolean = false): DeveloperStats!
    }
`;
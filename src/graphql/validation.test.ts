import { buildASTSchema, parse, validate } from 'graphql';
import { describe, expect, it } from 'vitest';
import { typeDefs } from './schema';
import { singleAnalysisFieldRule } from './validation';

const schema = buildASTSchema(typeDefs);

function validationErrors(source: string) {
  return validate(schema, parse(source), [singleAnalysisFieldRule]);
}

describe('singleAnalysisFieldRule', () => {
  it('allows one analysis in each independently executable operation', () => {
    expect(validationErrors(`
      query First { getCombatPower(githubId: "octocat") { githubId } }
      query Second { getCombatPower(githubId: "torvalds") { githubId } }
    `)).toEqual([]);
  });

  it('reports only the operation that requests multiple analyses', () => {
    const errors = validationErrors(`
      query Safe { getCombatPower(githubId: "octocat") { githubId } }
      query Unsafe {
        first: getCombatPower(githubId: "octocat") { githubId }
        second: getCombatPower(githubId: "torvalds") { githubId }
      }
    `);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Only one GitHub analysis may be requested per operation.');
  });

  it('counts a reachable analysis in a fragment for its operation', () => {
    expect(validationErrors(`
      query One { ...Analysis }
      fragment Analysis on Query {
        getCombatPower(githubId: "octocat") { githubId }
      }
    `)).toEqual([]);

    const errors = validationErrors(`
      query Two { ...First ...Second }
      fragment First on Query {
        getCombatPower(githubId: "octocat") { githubId }
      }
      fragment Second on Query {
        getCombatPower(githubId: "torvalds") { githubId }
      }
    `);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Only one GitHub analysis may be requested per operation.');
  });

  it('counts repeated spreads of the same fragment instead of deduplicating the fragment definition', () => {
    const errors = validationErrors(`
      query Repeated { ...Analysis ...Analysis }
      fragment Analysis on Query {
        getCombatPower(githubId: "octocat") { githubId }
      }
    `);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Only one GitHub analysis may be requested per operation.');
  });

  it('counts nested fragment spreads and keeps fragment traversal bounded for cycles', () => {
    const errors = validationErrors(`
      query Nested { ...Outer }
      fragment Outer on Query { ...Inner }
      fragment Inner on Query {
        first: getCombatPower(githubId: "octocat") { githubId }
        second: getCombatPower(githubId: "torvalds") { githubId }
        ...Outer
      }
    `);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('Only one GitHub analysis may be requested per operation.');
  });
});

import { GraphQLError, type ValidationRule } from 'graphql';

export const singleAnalysisFieldRule: ValidationRule = (context) => {
  let analysisFieldCount = 0;

  return {
    Field(node) {
      if (node.name.value !== 'getCombatPower') return;
      analysisFieldCount += 1;
      if (analysisFieldCount > 1) {
        context.reportError(new GraphQLError(
          'Only one GitHub analysis may be requested per operation.',
          { nodes: node },
        ));
      }
    },
  };
};

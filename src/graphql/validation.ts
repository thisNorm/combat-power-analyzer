import {
  GraphQLError,
  type ASTVisitor,
  type DocumentNode,
  type FragmentDefinitionNode,
  type SelectionSetNode,
  type ValidationRule,
} from 'graphql';

const ANALYSIS_FIELD_NAME = 'getCombatPower';
const ANALYSIS_LIMIT_ERROR = 'Only one GitHub analysis may be requested per operation.';

/**
 * Counts provider-backed analysis fields reachable from one selection set.
 *
 * Fragment spreads are counted per occurrence, rather than once per fragment
 * definition. This mirrors the cost of an operation that spreads the same
 * fragment more than once and prevents a fragment from being used to bypass
 * the one-analysis limit. The active-fragment set also keeps malformed cyclic
 * documents from making this custom rule recurse forever; GraphQL's standard
 * fragment-cycle rule reports those documents separately.
 */
function countAnalysisFields(
  selectionSet: SelectionSetNode,
  fragments: ReadonlyMap<string, FragmentDefinitionNode>,
  activeFragments: ReadonlySet<string> = new Set(),
): number {
  let count = 0;

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      if (selection.name.value === ANALYSIS_FIELD_NAME) count += 1;
      if (selection.selectionSet) {
        count += countAnalysisFields(selection.selectionSet, fragments, activeFragments);
      }
      continue;
    }

    if (selection.kind === 'InlineFragment') {
      count += countAnalysisFields(selection.selectionSet, fragments, activeFragments);
      continue;
    }

    const fragmentName = selection.name.value;
    if (activeFragments.has(fragmentName)) continue;
    const fragment = fragments.get(fragmentName);
    if (!fragment) continue;

    const nextActiveFragments = new Set(activeFragments);
    nextActiveFragments.add(fragmentName);
    count += countAnalysisFields(fragment.selectionSet, fragments, nextActiveFragments);
  }

  return count;
}

function collectFragments(document: DocumentNode): ReadonlyMap<string, FragmentDefinitionNode> {
  const fragments = new Map<string, FragmentDefinitionNode>();
  for (const definition of document.definitions) {
    if (definition.kind === 'FragmentDefinition') {
      fragments.set(definition.name.value, definition);
    }
  }
  return fragments;
}

export const singleAnalysisFieldRule: ValidationRule = (context): ASTVisitor => {
  let fragments: ReadonlyMap<string, FragmentDefinitionNode> = new Map();

  return {
    Document: {
      enter(node) {
        fragments = collectFragments(node);
      },
    },
    OperationDefinition(node) {
      const analysisFieldCount = countAnalysisFields(node.selectionSet, fragments);
      if (analysisFieldCount > 1) {
        context.reportError(new GraphQLError(ANALYSIS_LIMIT_ERROR, { nodes: node }));
      }
    },
  };
};

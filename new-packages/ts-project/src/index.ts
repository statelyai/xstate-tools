import { applyPatches, enablePatches, type Patch } from 'immer';
import type {
  CallExpression,
  Program,
  PropertyAssignment,
  SourceFile,
} from 'typescript';
import {
  c,
  createCodeChanges,
  InsertionElement,
  InsertionPriority,
} from './codeChanges';
import { shallowEqual } from './shallowEqual';
import { extractState } from './state';
import type {
  DeleteTextEdit,
  Edge,
  EventTypeData,
  ExtractionContext,
  ExtractionError,
  ExtractorDigraphDef,
  InsertTextEdit,
  LineAndCharacterPosition,
  LinesAndCharactersRange,
  Node,
  ProjectMachineState,
  Range,
  ReplaceTextEdit,
  TextEdit,
  TreeNode,
  XStateVersion,
} from './types';
import {
  assert,
  assertUnreachable,
  findNodeByAstPath,
  findProperty,
  invert,
  last,
} from './utils';

enablePatches();

const DEFAULT_ROOT_ID = '(machine)';

function findCreateMachineCalls(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
) {
  const createMachineCalls: CallExpression[] = [];

  sourceFile.forEachChild(function visitor(node) {
    if (ts.isTypeNode(node)) {
      return;
    }

    if (
      ts.isCallExpression(node) &&
      ((ts.isIdentifier(node.expression) &&
        ts.idText(node.expression) === 'createMachine') ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.name) &&
          ts.idText(node.expression.name) === 'createMachine'))
    ) {
      createMachineCalls.push(node);
    }
    node.forEachChild(visitor);
  });

  return createMachineCalls;
}

function resolvePathOrigin(
  ctx: ExtractionContext,
  sourceId: string,
  origin: string | undefined,
): TreeNode | undefined {
  if (origin === undefined) {
    return;
  }
  if (origin === '') {
    return ctx.treeNodes[sourceId];
  }
  if (origin[0] === '#') {
    const originId = ctx.idToNodeIdMap[origin.slice(1)];
    return ctx.treeNodes[originId];
  }

  const source = ctx.treeNodes[sourceId];
  if (!source.parentId) {
    return;
  }
  const parent = ctx.treeNodes[source.parentId];
  return parent.children[origin];
}

function resolveTargetId(
  ctx: ExtractionContext,
  sourceId: string,
  target: string,
) {
  // TODO: handle escaping once we land it in XState
  const [origin, ...path] = target.split('.');
  const resolvedOrigin = resolvePathOrigin(ctx, sourceId, origin);
  if (!resolvedOrigin) {
    ctx.errors.push({
      type: 'transition_target_unresolved',
    });
    return;
  }

  let marker = resolvedOrigin;
  let segment: string | undefined;
  while ((segment = path.shift())) {
    marker = marker.children[segment];
    if (!marker) {
      ctx.errors.push({
        type: 'transition_target_unresolved',
      });
      return;
    }
  }
  return marker.uniqueId;
}

function resolveTargets(ctx: ExtractionContext) {
  for (const [edgeId, edgeTargets] of Object.entries(ctx.originalTargets)) {
    for (const edgeTarget of edgeTargets) {
      const sourceId = ctx.digraph.edges[edgeId].source;
      const resolvedTargetId = resolveTargetId(ctx, sourceId, edgeTarget);
      if (!resolvedTargetId) {
        ctx.errors.push({
          type: 'transition_property_unhandled',
        });
        continue;
      }
      ctx.digraph.edges[edgeId].targets.push(resolvedTargetId);
    }
  }
}

function extractMachineConfig(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  createMachineCall: CallExpression,
): readonly [ExtractorDigraphDef | undefined, ExtractionError[]] {
  const rootState = createMachineCall.arguments[0];
  const rootNode = extractState(ctx, ts, rootState, {
    parentId: undefined,
    key: '(machine)', // acts as a default that might be overriden by `rootState.id`
  });

  if (!rootNode) {
    return [undefined, ctx.errors];
  }

  resolveTargets(ctx);

  return [
    {
      root: rootNode.uniqueId,
      blocks: ctx.digraph.blocks,
      nodes: ctx.digraph.nodes,
      edges: ctx.digraph.edges,
      edgeRefs: ctx.digraph.edgeRefs,
      implementations: ctx.digraph.implementations,
      data: ctx.digraph.data,
    },
    ctx.errors,
  ];
}

export interface TSProjectOptions {
  xstateVersion?: XStateVersion | undefined;
}

function extractProjectMachine(
  host: ProjectHost,
  sourceFile: SourceFile,
  call: CallExpression,
  oldState: ProjectMachineState | undefined,
): ProjectMachineState {
  const ctx: ExtractionContext = {
    sourceFile,
    xstateVersion: host.xstateVersion,
    oldState,
    errors: [],
    digraph: {
      nodes: {},
      edges: {},
      edgeRefs: [],
      blocks: {},
      implementations: {
        actions: {},
        actors: {},
        guards: {},
      },
      data: {
        context: {},
      },
    },
    treeNodes: {},
    idToNodeIdMap: {},
    originalTargets: {},
    currentAstPath: [],
    astPaths: {
      nodes: {},
      edges: {},
    },
  };
  const [digraph, errors] = extractMachineConfig(ctx, host.ts, call);
  return {
    digraph,
    errors,
    astPaths: ctx.astPaths,
    idMap: invert(ctx.idToNodeIdMap),
  };
}

function getPathNodes(digraph: ExtractorDigraphDef, node: Node) {
  const nodes: Node[] = [node];
  let current = node;
  while (current.parentId) {
    current = digraph.nodes[current.parentId];
    nodes.push(current);
  }
  return nodes;
}

function getBestTargetDescriptor(
  sourceId: string,
  targetId: string,
  projectMachineState: ProjectMachineState,
): string {
  const digraph = projectMachineState.digraph;
  assert(digraph);
  const source = digraph.nodes[sourceId];
  const target = digraph.nodes[targetId];

  if (!target.parentId) {
    return `#${projectMachineState.idMap[targetId] || DEFAULT_ROOT_ID}`;
  }

  if (sourceId === targetId) {
    return source.data.key;
  }

  const targetPathNodes = getPathNodes(digraph, target);
  const sourcePathNodes = getPathNodes(digraph, source);
  const sourcePathNodesSet = new Set(sourcePathNodes);

  const commonNode = targetPathNodes.find((ancestor) =>
    sourcePathNodesSet.has(ancestor),
  )!;

  if (commonNode === source) {
    return (
      '.' +
      targetPathNodes
        .slice(0, -sourcePathNodes.length)
        .map((n) => n.data.key)
        .reverse()
        .join('.')
    );
  }

  if (source.parentId && commonNode === digraph.nodes[source.parentId]) {
    return targetPathNodes
      .slice(0, -(sourcePathNodes.length - 1))
      .map((n) => n.data.key)
      .reverse()
      .join('.');
  }

  // short circuit
  if (projectMachineState.idMap[targetId]) {
    return `#${projectMachineState.idMap[targetId]}`;
  }

  let current = target;

  for (let i = 0; i < targetPathNodes.length; i++) {
    const id = projectMachineState.idMap[current.uniqueId];
    if (id || !current.parentId) {
      return [`#${id || DEFAULT_ROOT_ID}`]
        .concat(
          targetPathNodes
            .slice(0, i)
            .map((n) => n.data.key)
            .reverse(),
        )
        .join('.');
    }

    current = digraph.nodes[current.parentId];
  }

  assertUnreachable();
}

const toTransitionElement = (
  edge: Edge,
  projectMachineState: ProjectMachineState,
): InsertionElement => {
  const transition: Record<string, InsertionElement> = {
    target: !edge.targets.length
      ? c.undefined()
      : edge.targets.length === 1
      ? c.string(
          getBestTargetDescriptor(
            edge.source,
            edge.targets[0],
            projectMachineState,
          ),
        )
      : c.array(
          edge.targets.map((t) =>
            c.string(
              getBestTargetDescriptor(edge.source, t, projectMachineState),
            ),
          ),
        ),
  };

  if (edge.data.guard) {
    transition.guard = c.string(
      projectMachineState.digraph!.blocks[edge.data.guard].sourceId,
    );
  }

  if (edge.data.internal === false) {
    transition.reenter = c.boolean(true);
  }

  if (edge.data.description) {
    transition.description = c.string(edge.data.description, {
      allowMultiline: true,
    });
  }

  if (Object.keys(transition).length === 1) {
    // just target
    return transition.target;
  }

  return c.object(Object.entries(transition).map(([k, v]) => c.property(k, v)));
};

/** @internal */
export function getEdgeGroup(
  digraph: Pick<ExtractorDigraphDef, 'edges' | 'edgeRefs'>,
  eventTypeData: EventTypeData,
) {
  return digraph.edgeRefs.filter((id) =>
    shallowEqual(digraph.edges[id].data.eventTypeData, eventTypeData),
  );
}

function getTransitionInsertionPath(
  edge: Edge,
  projectMachineState: ProjectMachineState,
) {
  const digraph = projectMachineState.digraph;
  assert(digraph);
  const source = digraph.nodes[edge.source];
  const eventTypeData = edge.data.eventTypeData;
  const edgeIndex = getEdgeGroup(digraph, eventTypeData).indexOf(edge.uniqueId);
  switch (eventTypeData.type) {
    case 'after':
      throw new Error('Not implemented');
    case 'named':
      return ['on', eventTypeData.eventType, edgeIndex];
    case 'invocation.done':
      return [
        'invoke',
        source.data.invoke.indexOf(eventTypeData.invocationId),
        'onDone',
        edgeIndex,
      ];
    case 'invocation.error':
      return [
        'invoke',
        source.data.invoke.indexOf(eventTypeData.invocationId),
        'onError',
        edgeIndex,
      ];
    case 'state.done':
      return ['onDone', edgeIndex];
    case 'always':
      return ['always', edgeIndex];
    case 'wildcard':
      return ['on', '*', edgeIndex];
    case 'init':
      throw new Error('Not implemented');
  }
}

function areAboutSameArray(a: unknown[], b: unknown[]) {
  if (a.length !== b.length) {
    return false;
  }
  // we ignore the last element since it's the affected index
  // it's a variable information in each patch
  for (let i = 0; i < a.length - 1; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function consumeArrayInsertionAtIndex(
  patches: Patch[],
  start: number,
  data: unknown[],
) {
  const first = patches[start];
  // currently this function is only meant to be used from within replace handlers
  // insertions at the last index are handled by the add handler and they don't require any special handling
  assert(first.op === 'replace');
  const firstIndex = last(first.path)!;
  assert(typeof firstIndex === 'number');

  for (let i = start + 1; i < patches.length; i++) {
    const patch = patches[i];
    if (!areAboutSameArray(first.path, patch.path)) {
      if (i === 0) {
        // if the very next patch after the first one doesn't have the same path
        // it means that it's a simple change and we return from here immediately
        // letting the caller to handle the replacing logic
        return;
      }
      // the logic here is not prepared for any other situations
      // e.g. it wouldn't handle well a shuffled array or some multi-item insertions
      assertUnreachable();
    }

    if (patch.op !== 'replace' && patch.op !== 'add') {
      assertUnreachable();
    }
    // to be extra sure that we are consuming the correct type of change
    // we could also take the previous state of the array into consideration
    // currently we just check if all of the latter items are at increasing indices
    const currentIndex = last(patch.path);
    const distance = i - start;
    assert(currentIndex === firstIndex + distance);

    if (patch.op === 'add') {
      // this should be the very last item in the array
      assert(currentIndex === data.length - 1);
      return { index: firstIndex, value: first.value, skipped: distance };
    }
  }

  assertUnreachable();
}

function createProjectMachine({
  host,
  fileName,
  machineIndex,
}: {
  host: ProjectHost;
  fileName: string;
  machineIndex: number;
}) {
  let state: ProjectMachineState | undefined;

  const findOwnCreateMachineCall = () => {
    const sourceFile = host.getCurrentProgram().getSourceFile(fileName);

    if (!sourceFile) {
      throw new Error('File not found');
    }

    const createMachineCall = findCreateMachineCalls(host.ts, sourceFile)[
      machineIndex
    ];

    if (!createMachineCall) {
      throw new Error('Machine not found');
    }
    return { sourceFile, createMachineCall };
  };

  return {
    fileName,
    machineIndex,
    getDigraph() {
      const { sourceFile, createMachineCall } = findOwnCreateMachineCall();
      state = extractProjectMachine(host, sourceFile, createMachineCall, state);
      return [state.digraph, state.errors] as const;
    },
    applyPatches(patches: Patch[]): TextEdit[] {
      const codeChanges = createCodeChanges(host.ts);
      const { sourceFile, createMachineCall } = findOwnCreateMachineCall();
      const currentState = state!;

      // TODO: currently it throws when running with the Studio open - presumably because the patch might contain data that are not part of this local `digraph`
      currentState.digraph = applyPatches(
        currentState.digraph!,
        patches,
      ) as any;

      const deferredArrayPatches: Patch[] = [];

      for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];

        switch (patch.op) {
          case 'add':
            switch (patch.path[0]) {
              case 'nodes': {
                // if the path is longer than 2 then we are adding something within an existing state
                // if it's 2 then we are adding a new state itself
                if (patch.path.length > 2) {
                  if (
                    patch.path[2] === 'data' &&
                    (patch.path[3] === 'entry' || patch.path[3] === 'exit')
                  ) {
                    deferredArrayPatches.push(patch);
                  }
                  break;
                }
                assert(patch.path.length === 2);
                // we only support adding empty states here right now
                // this might become a problem, especially when dealing with copy-pasting
                // the implementation will have to account for that in the future
                const newNode: Node = patch.value;
                const parentNode = findNodeByAstPath(
                  host.ts,
                  createMachineCall,
                  currentState.astPaths.nodes[newNode.parentId!],
                );
                assert(host.ts.isObjectLiteralExpression(parentNode));

                codeChanges.insertAtOptionalObjectPath(
                  parentNode,
                  ['states', newNode.data.key],
                  c.object([]),
                  InsertionPriority.States,
                );
                break;
              }
              case 'edges': {
                // if the path is longer than 2 then we are adding something within an existing edge
                // if it's 2 then we are adding a new edge itself
                if (patch.path.length > 2) {
                  if (patch.path[2] === 'data' && patch.path[3] === 'actions') {
                    deferredArrayPatches.push(patch);
                  }
                  break;
                }
                assert(patch.path.length === 2);
                const sourceNode = findNodeByAstPath(
                  host.ts,
                  createMachineCall,
                  currentState.astPaths.nodes[patch.value.source],
                );
                const newEdge: Edge = patch.value;

                assert(host.ts.isObjectLiteralExpression(sourceNode));

                codeChanges.insertAtOptionalObjectPath(
                  sourceNode,
                  getTransitionInsertionPath(newEdge, currentState),
                  toTransitionElement(newEdge, currentState),
                );
              }
            }
            break;
          case 'remove':
            break;
          case 'replace':
            switch (patch.path[0]) {
              case 'nodes':
                if (
                  patch.path[2] === 'data' &&
                  (patch.path[3] === 'entry' || patch.path[3] === 'exit')
                ) {
                  deferredArrayPatches.push(patch);
                  break;
                }
                const nodeId = patch.path[1];
                const node = findNodeByAstPath(
                  host.ts,
                  createMachineCall,
                  currentState.astPaths.nodes[nodeId],
                );
                assert(host.ts.isObjectLiteralExpression(node));

                if (patch.path[2] === 'data' && patch.path[3] === 'key') {
                  const parentNode = findNodeByAstPath(
                    host.ts,
                    createMachineCall,
                    currentState.astPaths.nodes[nodeId].slice(0, -1),
                  );
                  assert(host.ts.isObjectLiteralExpression(parentNode));
                  const prop = parentNode.properties.find(
                    (p): p is PropertyAssignment =>
                      host.ts.isPropertyAssignment(p) && p.initializer === node,
                  )!;
                  codeChanges.replacePropertyName(prop, patch.value);
                  break;
                }
                if (patch.path[2] === 'data' && patch.path[3] === 'initial') {
                  const initialProp = findProperty(
                    undefined,
                    host.ts,
                    node,
                    'initial',
                  );
                  if (patch.value === undefined) {
                    // this check is defensive, it should always be there
                    if (initialProp) {
                      codeChanges.removeProperty(initialProp);
                    }
                    break;
                  }

                  if (initialProp) {
                    codeChanges.replaceRange(sourceFile, {
                      range: {
                        start: initialProp.initializer.getStart(),
                        end: initialProp.initializer.getEnd(),
                      },
                      element: c.string(patch.value),
                    });
                    break;
                  }

                  const statesProp = findProperty(
                    undefined,
                    host.ts,
                    node,
                    'states',
                  );

                  if (statesProp) {
                    codeChanges.insertPropertyBeforeProperty(
                      statesProp,
                      'initial',
                      c.string(patch.value),
                    );
                    break;
                  }

                  codeChanges.insertPropertyIntoObject(
                    node,
                    'initial',
                    c.string(patch.value),
                    InsertionPriority.Initial,
                  );
                }
                if (patch.path[2] === 'data' && patch.path[3] === 'type') {
                  const typeProp = findProperty(
                    undefined,
                    host.ts,
                    node,
                    'type',
                  );
                  if (patch.value === 'normal') {
                    if (typeProp) {
                      codeChanges.removeProperty(typeProp);
                    }
                    break;
                  }

                  if (typeProp) {
                    codeChanges.replaceRange(sourceFile, {
                      range: {
                        start: typeProp.initializer.getStart(),
                        end: typeProp.initializer.getEnd(),
                      },
                      element: c.string(patch.value),
                    });
                    break;
                  }

                  codeChanges.insertPropertyIntoObject(
                    node,
                    'type',
                    c.string(patch.value),
                    InsertionPriority.StateType,
                  );
                }
                if (patch.path[2] === 'data' && patch.path[3] === 'history') {
                  const historyProp = findProperty(
                    undefined,
                    host.ts,
                    node,
                    'history',
                  );
                  if (patch.value === undefined || patch.value === 'shallow') {
                    if (historyProp) {
                      codeChanges.removeProperty(historyProp);
                    }
                    break;
                  }

                  if (historyProp) {
                    codeChanges.replaceRange(sourceFile, {
                      range: {
                        start: historyProp.initializer.getStart(),
                        end: historyProp.initializer.getEnd(),
                      },
                      element: c.string(patch.value),
                    });
                    break;
                  }

                  // TODO: insert it after the existing `type` property
                  codeChanges.insertPropertyIntoObject(
                    node,
                    'history',
                    c.string(patch.value),
                    InsertionPriority.History,
                  );
                }
                if (
                  patch.path[2] === 'data' &&
                  patch.path[3] === 'description'
                ) {
                  const descriptionProp = findProperty(
                    undefined,
                    host.ts,
                    node,
                    'description',
                  );
                  if (!patch.value) {
                    if (descriptionProp) {
                      codeChanges.removeProperty(descriptionProp);
                    }
                    break;
                  }

                  const element = c.string(patch.value, {
                    allowMultiline: true,
                  });

                  if (descriptionProp) {
                    codeChanges.replaceRange(sourceFile, {
                      range: {
                        start: descriptionProp.initializer.getStart(),
                        end: descriptionProp.initializer.getEnd(),
                      },
                      element,
                    });
                    break;
                  }

                  codeChanges.insertPropertyIntoObject(
                    node,
                    'description',
                    element,
                  );
                }
              case 'edges': {
                if (patch.path[2] === 'data' && patch.path[3] === 'actions') {
                  deferredArrayPatches.push(patch);
                  break;
                }
              }
            }
            break;
        }
      }

      const sortedArrayPatches = [...deferredArrayPatches].sort((a, b) => {
        if (areAboutSameArray(a.path, b.path)) {
          return (last(a.path) as number) - (last(b.path) as number);
        }
        return 0;
      });

      for (let i = 0; i < sortedArrayPatches.length; i++) {
        const patch = sortedArrayPatches[i];

        switch (patch.op) {
          case 'add':
            switch (patch.path[0]) {
              case 'nodes': {
                const nodeId = patch.path[1];
                const node = findNodeByAstPath(
                  host.ts,
                  createMachineCall,
                  currentState.astPaths.nodes[nodeId],
                );
                assert(host.ts.isObjectLiteralExpression(node));

                if (
                  patch.path[2] === 'data' &&
                  (patch.path[3] === 'entry' || patch.path[3] === 'exit')
                ) {
                  const index = patch.path[4];
                  assert(typeof index === 'number');
                  // effectively the current implementation can only receive an `add` patch about this when it corresponds to a simple push
                  // insertions at index are handled by the replace handler and multi-item insertions are not handled at all
                  assert(
                    index ===
                      currentState.digraph!.nodes[nodeId].data[patch.path[3]]
                        .length -
                        1,
                  );
                  assert(typeof index === 'number');
                  const actionId = patch.value;
                  assert(typeof actionId === 'string');

                  codeChanges.insertAtOptionalObjectPath(
                    node,
                    [patch.path[3], index],
                    c.string(currentState.digraph!.blocks[actionId].sourceId),
                  );
                }
                break;
              }
              case 'edges': {
                const edgeId = patch.path[1];
                const edge = findNodeByAstPath(
                  host.ts,
                  createMachineCall,
                  currentState.astPaths.edges[edgeId],
                );
                // TODO: this isn't always true, it's a temporary assertion
                assert(host.ts.isObjectLiteralExpression(edge));
                if (patch.path[2] === 'data' && patch.path[3] === 'actions') {
                  const index = patch.path[4];
                  assert(typeof index === 'number');
                  // effectively the current implementation can only receive an `add` patch about this when it corresponds to a simple push
                  // insertions at index are handled by the replace handler and multi-item insertions are not handled at all
                  assert(
                    index ===
                      currentState.digraph!.edges[edgeId].data.actions.length -
                        1,
                  );
                  assert(typeof index === 'number');
                  const actionId = patch.value;
                  assert(typeof actionId === 'string');

                  codeChanges.insertAtOptionalObjectPath(
                    edge,
                    [patch.path[3], index],
                    c.string(currentState.digraph!.blocks[actionId].sourceId),
                  );
                }
                break;
              }
            }
            break;
          case 'remove':
            break;
          case 'replace':
            switch (patch.path[0]) {
              case 'nodes': {
                const nodeId = patch.path[1];
                const node = findNodeByAstPath(
                  host.ts,
                  createMachineCall,
                  currentState.astPaths.nodes[nodeId],
                );
                assert(host.ts.isObjectLiteralExpression(node));
                if (
                  patch.path[2] === 'data' &&
                  (patch.path[3] === 'entry' || patch.path[3] === 'exit')
                ) {
                  const insertion = consumeArrayInsertionAtIndex(
                    sortedArrayPatches,
                    i,
                    currentState.digraph!.nodes[nodeId].data[patch.path[3]],
                  );

                  if (insertion) {
                    i += insertion.skipped;

                    codeChanges.insertAtOptionalObjectPath(
                      node,
                      [patch.path[3], insertion.index],
                      c.string(
                        currentState.digraph!.blocks[insertion.value].sourceId,
                      ),
                    );
                    break;
                  }
                  break;
                }
                break;
              }
              case 'edges': {
                const edgeId = patch.path[1];
                const edge = findNodeByAstPath(
                  host.ts,
                  createMachineCall,
                  currentState.astPaths.edges[edgeId],
                );
                // TODO: this isn't always true, it's a temporary assertion
                assert(host.ts.isObjectLiteralExpression(edge));
                if (patch.path[2] === 'data' && patch.path[3] === 'actions') {
                  const insertion = consumeArrayInsertionAtIndex(
                    sortedArrayPatches,
                    i,
                    currentState.digraph!.edges[edgeId].data[patch.path[3]],
                  );

                  if (insertion) {
                    i += insertion.skipped;

                    codeChanges.insertAtOptionalObjectPath(
                      edge,
                      [patch.path[3], insertion.index],
                      c.string(
                        currentState.digraph!.blocks[insertion.value].sourceId,
                      ),
                    );
                    break;
                  }
                  break;
                }
                break;
              }
            }
            break;
        }
      }

      return codeChanges.getTextEdits();
    },
  };
}

type ProjectMachine = ReturnType<typeof createProjectMachine>;

interface ProjectHost {
  ts: typeof import('typescript');
  xstateVersion: XStateVersion;
  getCurrentProgram: () => Program;
}

export function createProject(
  ts: typeof import('typescript'),
  tsProgram: Program,
  { xstateVersion = '5' }: TSProjectOptions = {},
) {
  const projectMachines: Record<string, ProjectMachine[]> = {};

  let currentProgram = tsProgram;

  const host: ProjectHost = {
    ts,
    xstateVersion,
    getCurrentProgram() {
      return currentProgram;
    },
  };

  return {
    findMachines: (fileName: string): Range[] => {
      const sourceFile = currentProgram.getSourceFile(fileName);
      if (!sourceFile) {
        return [];
      }
      return findCreateMachineCalls(ts, sourceFile).map((call) => {
        return {
          start: call.getStart(),
          end: call.getEnd(),
        };
      });
    },
    getMachinesInFile(fileName: string) {
      const existing = projectMachines[fileName];
      if (existing) {
        return existing.map((machine) => machine.getDigraph());
      }
      const sourceFile = currentProgram.getSourceFile(fileName);
      if (!sourceFile) {
        return [];
      }
      const calls = findCreateMachineCalls(ts, sourceFile);
      const created = calls.map((call, machineIndex) =>
        createProjectMachine({ host, fileName, machineIndex }),
      );
      projectMachines[fileName] = created;
      return created.map((machine) => machine.getDigraph());
    },
    applyPatches({
      fileName,
      machineIndex,
      patches,
    }: {
      fileName: string;
      machineIndex: number;
      patches: Patch[];
    }): TextEdit[] {
      const machine = projectMachines[fileName]?.[machineIndex];
      if (!machine) {
        throw new Error('Machine not found');
      }
      return machine.applyPatches(patches);
    },
    updateTsProgram(tsProgram: Program) {
      currentProgram = tsProgram;
    },
    getLineAndCharacterOfPosition(
      fileName: string,
      position: number,
    ): LineAndCharacterPosition {
      const sourceFile = currentProgram.getSourceFile(fileName);
      assert(sourceFile);
      return sourceFile.getLineAndCharacterOfPosition(position);
    },
    getLinesAndCharactersRange(
      fileName: string,
      range: Range,
    ): LinesAndCharactersRange {
      const sourceFile = currentProgram.getSourceFile(fileName);
      assert(sourceFile);
      return {
        start: sourceFile.getLineAndCharacterOfPosition(range.start),
        end: sourceFile.getLineAndCharacterOfPosition(range.end),
      };
    },
  };
}

export type XStateProject = ReturnType<typeof createProject>;

export {
  DeleteTextEdit,
  ExtractorDigraphDef,
  InsertTextEdit,
  LineAndCharacterPosition,
  LinesAndCharactersRange,
  Patch,
  Range,
  ReplaceTextEdit,
  TextEdit,
};

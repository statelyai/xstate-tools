import { INLINE_IMPLEMENTATION_TYPE } from '@xstate/machine-extractor';
import * as XState from 'xstate';
import { InvokeDefinition } from 'xstate';

type AnyStateNode = XState.StateNode<any, any, any, any, any, any>;

export interface StateSchema extends Record<string, StateSchema> {}

function getRelevantFinalStates(node: AnyStateNode): AnyStateNode[] {
  switch (node.type) {
    case 'compound':
      return getChildren(node)
        .map((childNode) =>
          childNode.type === 'final'
            ? [childNode]
            : getRelevantFinalStates(childNode),
        )
        .flat();
    case 'parallel':
      const finalStatesPerRegion = getChildren(node).map(
        getRelevantFinalStates,
      );
      return finalStatesPerRegion.every((perRegion) => !!perRegion.length)
        ? finalStatesPerRegion.flat()
        : [];
    default:
      return [];
  }
}

function getAllNodesToNodes(nodes: AnyStateNode[]) {
  const seen = new Set<AnyStateNode>();
  const result = new Set<AnyStateNode>();
  for (const node of nodes) {
    let marker: typeof node | undefined = node;
    while (marker) {
      if (seen.has(marker)) {
        break;
      }

      result.add(marker);

      seen.add(marker);
      marker = marker.parent;
    }
  }
  return result;
}

function getChildren(node: AnyStateNode) {
  return Object.keys(node.states)
    .map((key) => node.states[key])
    .filter((state) => state.type !== 'history');
}

function isWithin(nodeA: AnyStateNode, nodeB: AnyStateNode) {
  let marker: typeof nodeB | undefined = nodeB;
  while (marker) {
    if (nodeA === marker) {
      return true;
    }
    marker = marker.parent;
  }
  return false;
}

function findLeastCommonAncestor(
  machine: AnyStateNode,
  nodeA: AnyStateNode,
  nodeB: AnyStateNode,
): AnyStateNode {
  if (!nodeA.path.length || !nodeB.path.length) {
    return machine;
  }

  let i = 0;
  while (true) {
    if (nodeA.path[i] === nodeB.path[i]) {
      i++;
      continue;
    }
    const leastCommonAncestorPath = nodeA.path.slice(0, i);

    let leastCommonAncestor = machine;
    let segment: string | undefined;
    while ((segment = leastCommonAncestorPath.shift())) {
      leastCommonAncestor = leastCommonAncestor.states[segment];
    }
    return leastCommonAncestor;
  }
}

const makeStateSchema = (node: AnyStateNode): StateSchema => {
  return Object.fromEntries(
    getChildren(node).map((child) => [child.key, makeStateSchema(child)]),
  );
};

class ItemMap {
  /**
   * The internal map that we use to keep track
   * of all of the items
   */
  private map: {
    [name: string]: { events: Set<string> };
  };

  /**
   * Check if one of these items is optional -
   * passed in from above via a prop
   */
  private checkIfOptional: (name: string) => boolean;

  constructor(props: { checkIfOptional: (name: string) => boolean }) {
    this.checkIfOptional = props.checkIfOptional;
    this.map = {};
  }

  /**
   * Add an item to the cache, along with the path of the node
   * it occurs on
   */
  addItem(itemName: string) {
    if (!this.map[itemName]) {
      this.map[itemName] = {
        events: new Set(),
      };
    }
  }

  /**
   * Add a triggering event to an item in the cache, for
   * instance the event type which triggers a guard/action/service
   */
  addEventToItem(itemName: string, eventType: string | Iterable<string>) {
    this.addItem(itemName);
    if (typeof eventType === 'string') {
      this.map[itemName].events.add(eventType);
      return;
    }
    for (const event of eventType) {
      this.map[itemName].events.add(event);
    }
  }

  /**
   * Transform the data into the shape required for index.d.ts
   */
  toDataShape() {
    let isRequiredInTotal = false;
    const lines = Object.entries(this.map)
      .filter(([name]) => {
        return !(name === INLINE_IMPLEMENTATION_TYPE);
      })
      .map(([name, data]) => {
        const optional = this.checkIfOptional(name);
        if (!optional) {
          isRequiredInTotal = true;
        }
        return {
          name,
          required: !optional,
          events: Array.from(data.events),
        };
      });
    return {
      lines,
      required: isRequiredInTotal,
    };
  }
}

function collectInvokes(ctx: TraversalContext, node: AnyStateNode) {
  node.invoke.forEach((service) => {
    const serviceSrc = getServiceSrc(service);
    if (
      typeof serviceSrc !== 'string' ||
      serviceSrc === INLINE_IMPLEMENTATION_TYPE
    ) {
      return;
    }
    ctx.services.addItem(serviceSrc);

    const serviceSrcToIdItem = ctx.serviceSrcToIdMap.get(serviceSrc);
    if (serviceSrcToIdItem) {
      serviceSrcToIdItem.add(service.id);
      return;
    }
    ctx.serviceSrcToIdMap.set(serviceSrc, new Set([service.id]));
  });
}

function collectAction(
  ctx: TraversalContext,
  eventType: string | Iterable<string>,
  actionObject: XState.ActionObject<any, XState.EventObject>,
) {
  if (
    actionObject.type === 'xstate.choose' &&
    Array.isArray(actionObject.conds)
  ) {
    actionObject.conds.forEach(({ cond, actions: condActions }) => {
      if (typeof cond === 'string') {
        ctx.guards.addEventToItem(cond, eventType);
      }
      if (Array.isArray(condActions)) {
        condActions.forEach((condAction) => {
          if (typeof condAction === 'string') {
            ctx.actions.addEventToItem(condAction, eventType);
          }
        });
      } else if (typeof condActions === 'string') {
        ctx.actions.addEventToItem(condActions, eventType);
      }
    });
  } else {
    ctx.actions.addEventToItem(actionObject.type, eventType);
  }
}

// TODO: this doesn't handle
// createMachine(
//   { on: { FOO: { actions: "foo" } } },
//   {
//     actions: {
//       foo: choose([{ cond: "test", actions: "bar" }]),
//       bar: choose([{ cond: "test2", actions: "baz" }]),
//       baz: () => {},
//     },
//   }
// );
// when implementing this consider how it should handle cycles
function collectActions(
  ctx: TraversalContext,
  eventType: string | Iterable<string>,
  actionObjects: XState.ActionObject<any, XState.EventObject>[],
) {
  actionObjects.forEach((actionObject) => {
    collectAction(ctx, eventType, actionObject);
    const actionInOptions = ctx.machine.options.actions?.[actionObject.type];
    if (actionInOptions && typeof actionInOptions === 'object') {
      collectAction(ctx, eventType, actionInOptions);
    }
  });
}

function enterState(
  ctx: TraversalContext,
  node: AnyStateNode,
  eventType: string,
) {
  let nodeIdToSourceEventItem = ctx.nodeIdToSourceEventsMap.get(node.id);
  if (nodeIdToSourceEventItem) {
    nodeIdToSourceEventItem.add(eventType);
    return;
  }
  ctx.nodeIdToSourceEventsMap.set(node.id, new Set([eventType]));
}

function exitChildren(
  ctx: TraversalContext,
  node: AnyStateNode,
  eventType: string,
  entered: Set<AnyStateNode> = new Set(),
) {
  getChildren(node).forEach((child) => {
    if (entered.has(child)) {
      return;
    }
    collectActions(ctx, eventType, child.onExit);
    exitChildren(ctx, child, eventType, entered);
  });
}

function collectTransitions(ctx: TraversalContext, node: AnyStateNode) {
  node.transitions.forEach((transition) => {
    if (transition.cond && transition.cond.name) {
      if (transition.cond.name !== 'cond') {
        ctx.guards.addEventToItem(transition.cond.name, transition.eventType);
      }
    }

    collectActions(ctx, transition.eventType, transition.actions);

    if (!transition.target || !transition.target.length) {
      return;
    }

    transition.target.forEach((target) => {
      if (isWithin(node, target)) {
        const enteredSet = new Set<AnyStateNode>();
        let marker: typeof target = target;

        while (marker) {
          if (marker === node) {
            break;
          }
          enteredSet.add(marker);
          marker = marker.parent!;
        }
        if (!transition.internal) {
          enteredSet.add(marker);
        }

        enteredSet.forEach((entered) => {
          enterState(ctx, entered, transition.eventType);
        });

        exitChildren(ctx, node, transition.eventType, enteredSet);

        if (!transition.internal) {
          collectActions(ctx, transition.eventType, node.onExit);
        }
      } else {
        exitChildren(ctx, node, transition.eventType);
        collectActions(ctx, transition.eventType, node.onExit);

        const leastCommonAncestor = findLeastCommonAncestor(
          ctx.machine,
          node,
          target,
        );

        let marker = node;
        while (true) {
          if (marker === leastCommonAncestor) {
            break;
          }
          collectActions(ctx, transition.eventType, marker.onExit);
          marker = marker.parent!;
        }

        const enteringPath = target.path.slice(leastCommonAncestor.path.length);

        let segment: string | undefined;
        marker = leastCommonAncestor;
        while ((segment = enteringPath.shift())) {
          marker = marker.states[segment];
          enterState(ctx, marker, transition.eventType);
        }
      }
    });
  });
}

export type IntrospectMachineResult = ReturnType<typeof introspectMachine>;

function createTraversalContext(machine: AnyStateNode) {
  return {
    machine,

    serviceSrcToIdMap: new Map<string, Set<string>>(),
    nodeIdToSourceEventsMap: new Map<string, Set<string>>(),

    actions: new ItemMap({
      checkIfOptional: (name) => Boolean(machine.options?.actions?.[name]),
    }),
    delays: new ItemMap({
      checkIfOptional: (name) => Boolean(machine.options?.delays?.[name]),
    }),
    guards: new ItemMap({
      checkIfOptional: (name) => Boolean(machine.options?.guards?.[name]),
    }),
    services: new ItemMap({
      checkIfOptional: (name) => Boolean(machine.options?.services?.[name]),
    }),
  };
}

type TraversalContext = ReturnType<typeof createTraversalContext>;

// simple information is an information that doesn't need dereferencing target states
function collectSimpleInformation(ctx: TraversalContext, node: AnyStateNode) {
  // TODO: history states are not handled yet
  collectInvokes(ctx, node);
  collectActions(ctx, 'xstate.stop', node.onExit);
  collectTransitions(ctx, node);

  getChildren(node).forEach((childNode) =>
    collectSimpleInformation(ctx, childNode),
  );
}

function collectEnterables(ctx: TraversalContext, node: AnyStateNode) {
  const sourceEvents = ctx.nodeIdToSourceEventsMap.get(node.id);

  if (!sourceEvents) {
    getChildren(node).forEach((child) => collectEnterables(ctx, child));
    return;
  }

  const enterableNodes = new Set([node]);
  const initialLeafNodes = node.initialStateNodes;

  let current: typeof node | undefined;
  while ((current = initialLeafNodes.pop())) {
    let marker = current;
    while (marker !== node) {
      enterableNodes.add(marker);
      marker = marker.parent!;
    }
  }

  enterableNodes.forEach((enterableNode) => {
    enterableNode.invoke.forEach((service) => {
      const serviceSrc = getServiceSrc(service);
      if (typeof serviceSrc !== 'string') {
        return;
      }
      sourceEvents.forEach((eventType) => {
        ctx.services.addEventToItem(serviceSrc, eventType);
      });
    });

    enterableNode.after.forEach(({ delay }) => {
      if (typeof delay === 'string') {
        sourceEvents.forEach((source) => {
          ctx.delays.addEventToItem(delay, source);
        });
      }
    });

    collectActions(ctx, sourceEvents, enterableNode.onEntry);
  });

  getChildren(node).forEach((child) => collectEnterables(ctx, child));
}

function collectEventsLeadingToFinalStates(ctx: TraversalContext) {
  const relevantFinalStates = new Set(getRelevantFinalStates(ctx.machine));
  const leafParallelSeenMap = new Map<
    AnyStateNode,
    { events: Set<string>; nodes: Set<AnyStateNode> }
  >();

  for (const finalState of relevantFinalStates) {
    const sourceEvents = ctx.nodeIdToSourceEventsMap.get(finalState.id);

    if (!sourceEvents) {
      continue;
    }

    const seenEvents = new Set<string>();
    const seenStates = new Set<AnyStateNode>();

    for (const eventType of sourceEvents) {
      seenEvents.add(eventType);
    }

    let marker: typeof finalState | undefined = finalState;

    while (marker) {
      seenStates.add(marker);

      collectActions(ctx, sourceEvents, marker.onExit);

      if (marker.parent?.type === 'parallel') {
        leafParallelSeenMap.set(marker, {
          events: seenEvents,
          nodes: seenStates,
        });
        break;
      }

      marker = marker.parent;
    }
  }
  for (const [leafParallel, seen] of leafParallelSeenMap) {
    for (const [otherParallel, otherSeen] of leafParallelSeenMap) {
      if (otherParallel === leafParallel) {
        continue;
      }
      for (const node of otherSeen.nodes) {
        collectActions(ctx, seen.events, node.onExit);
      }
    }
  }
  const eventsLeadingToFinalStates = new Set(
    Array.from(leafParallelSeenMap.values()).flatMap(({ events }) =>
      Array.from(events),
    ),
  );
  getAllNodesToNodes(Array.from(leafParallelSeenMap.keys())).forEach((node) => {
    collectActions(ctx, eventsLeadingToFinalStates, node.onExit);
  });
}

export const introspectMachine = (machine: AnyStateNode) => {
  const ctx = createTraversalContext(machine);

  collectSimpleInformation(ctx, machine);

  enterState(ctx, machine, 'xstate.init');
  collectEnterables(ctx, machine);

  collectEventsLeadingToFinalStates(ctx);

  return {
    states: machine.stateIds.map((id) => ({
      id,
      sources: ctx.nodeIdToSourceEventsMap.get(id) || new Set(),
    })),
    stateSchema: makeStateSchema(machine),
    guards: ctx.guards.toDataShape(),
    actions: ctx.actions.toDataShape(),
    services: ctx.services.toDataShape(),
    delays: ctx.delays.toDataShape(),
    serviceSrcToIdMap: ctx.serviceSrcToIdMap,
  };
};

const getServiceSrc = (invoke: InvokeDefinition<any, any>) => {
  if (typeof invoke.src === 'string') {
    return invoke.src;
  }

  return invoke.src.type;
};

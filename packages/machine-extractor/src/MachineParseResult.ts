import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import * as recast from 'recast';
import { Action, Condition, MachineOptions } from 'xstate';
import { choose } from 'xstate/lib/actions';
import { DeclarationType } from '.';
import { ActionNode, ParsedChooseCondition } from './actions';
import { TMachineCallExpression } from './machineCallExpression';
import { RecordOfArrays } from './RecordOfArrays';
import { StateNodeReturn } from './stateNode';
import {
  toMachineConfig,
  ToMachineConfigParseOptions,
} from './toMachineConfig';
import { TransitionConfigNode } from './transitions';
import { Comment } from './types';

function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

const DEFAULT_ROOT_ID = '(machine)';

const b = recast.types.builders;
const n: typeof recast.types.namedTypes = recast.types.namedTypes;

type RecastFile = ReturnType<typeof b.file>;
type RecastExpression = ReturnType<typeof b.throwStatement>['argument'];
type RecastObjectExpression = ReturnType<typeof b.objectExpression>;
type RecastObjectProperty = ReturnType<typeof b.objectProperty>;
// andarist: I'm not 100% sure about this but this might only be relevant for other parsers
// so perhaps we don't even have to handle this here
type RecastProperty = ReturnType<typeof b.property>;
type RecastObjectMethod = ReturnType<typeof b.objectMethod>;
type RecastNode = InstanceType<typeof recast.types.NodePath>['node'];

type TransitionPath =
  | [type: 'always', transitionIndex: number]
  | [type: 'after', delay: string | number, transitionIndex: number]
  | [type: 'on', event: string, transitionIndex: number]
  | [type: 'onDone', transitionIndex: number]
  | [
      type: 'invoke',
      invokeIndex: number,
      event: 'onDone',
      transitionIndex: number,
    ]
  | [
      type: 'invoke',
      invokeIndex: number,
      event: 'onError',
      transitionIndex: number,
    ];

type ActionPath =
  | [..._: TransitionPath, actionIndex: number]
  | [type: 'entry', actionIndex: number]
  | [type: 'exit', actionIndex: number];

type MachineEdit =
  | { type: 'add_state'; path: string[]; name: string }
  | { type: 'remove_state'; path: string[] }
  | { type: 'rename_state'; path: string[]; name: string }
  | { type: 'reparent_state'; path: string[]; newParentPath: string[] }
  | { type: 'set_initial_state'; path: string[]; initialState: string }
  | {
      type: 'add_transition';
      sourcePath: string[];
      targetPath: string[] | undefined;
      transitionPath: TransitionPath;
      external: boolean;
      guard?: string;
    }
  | {
      type: 'remove_transition';
      sourcePath: string[];
      transitionPath: TransitionPath;
    }
  | {
      type: 'reanchor_transition';
      sourcePath: string[];
      newSourcePath?: string[] | undefined;
      newTargetPath?: string[] | undefined;
      transitionPath: TransitionPath;
    }
  | {
      type: 'change_transition_path';
      sourcePath: string[];
      transitionPath: TransitionPath;
      newTransitionPath: TransitionPath;
    }
  | {
      type: 'add_action';
      path: string[];
      actionPath: ActionPath;
      name: string;
    }
  | {
      type: 'remove_action';
      path: string[];
      actionPath: ActionPath;
    }
  | {
      type: 'edit_action';
      path: string[];
      actionPath: ActionPath;
      name: string;
    }
  | {
      type: 'add_guard';
      path: string[];
      transitionPath: TransitionPath;
      name: string;
    }
  | {
      type: 'remove_guard';
      path: string[];
      transitionPath: TransitionPath;
    }
  | {
      type: 'edit_guard';
      path: string[];
      transitionPath: TransitionPath;
      name: string;
    }
  | {
      type: 'add_invoke';
      path: string[];
      invokeIndex: number;
      source: string;
      id?: string | undefined;
    }
  | {
      type: 'remove_invoke';
      path: string[];
      invokeIndex: number;
    }
  | {
      type: 'edit_invoke';
      path: string[];
      invokeIndex: number;
      source?: string | undefined;
      id?: string | undefined;
    };

export interface MachineParseResultStateNode {
  path: string[];
  ast: StateNodeReturn;
}

/**
 * Matches '@xstate-layout awdh123jbawdjhbawd'
 */
const layoutRegex = /@xstate-layout [^\s]{1,}/;

const getLayoutString = (commentString: string): string | undefined => {
  const result = commentString.match(layoutRegex)?.[0];

  return result?.slice(`@xstate-layout `.length);
};

/**
 * Gives some helpers to the user of the lib
 */
export class MachineParseResult {
  ast: TMachineCallExpression;
  public fileComments: Comment[];
  private stateNodes: MachineParseResultStateNode[];
  private _fileContent: string;
  private _fileAst: t.File;
  private _idMap: Map<string, string[]> = new Map();
  public scope: NodePath['scope'];

  constructor(props: {
    fileAst: t.File;
    fileContent: string;
    ast: TMachineCallExpression;
    fileComments: Comment[];
    scope: NodePath['scope'];
  }) {
    this.ast = props.ast;
    this.fileComments = props.fileComments;
    this.scope = props.scope;
    this._fileAst = props.fileAst;
    this._fileContent = props.fileContent;

    this.stateNodes = this._getAllStateNodes();
  }

  private _getAllStateNodes = (): MachineParseResultStateNode[] => {
    this._idMap = new Map([
      // this is the default for the root
      // if we find the explicitly defined ID for the root then this will be overriden
      [DEFAULT_ROOT_ID, []],
    ]);
    const nodes: MachineParseResultStateNode[] = [];

    const getSubNodes = (
      definition: StateNodeReturn | undefined,
      path: string[],
    ) => {
      if (!definition) {
        return;
      }

      nodes.push({
        ast: definition,
        path,
      });

      if (definition.id) {
        this._idMap.set(definition.id.value, path);
      }

      definition.states?.properties.forEach((stateNode) => {
        getSubNodes(stateNode.result, [...path, stateNode.key]);
      });
    };

    getSubNodes(this.ast.definition, []);

    return nodes;
  };

  getIsIgnored = () => {
    if (!this.ast.callee?.loc) return false;
    const isIgnored = this.fileComments.some((comment) => {
      if (comment.type !== 'xstate-ignore-next-line') return false;

      return comment.node.loc!.end.line === this.ast.callee.loc!.start.line - 1;
    });

    return isIgnored;
  };

  public getChooseActionsToAddToOptions = () => {
    const actions: MachineOptions<any, any, any>['actions'] = {};

    const chooseActions = this.getChooseActionsInOptions();

    chooseActions.forEach((action) => {
      if (action.node.chooseConditions) {
        actions[action.node.name] = choose(
          action.node.chooseConditions.map((chooseCondition) => ({
            actions: chooseCondition.actionNodes.map((action) => action.name),
            cond: chooseCondition.condition.cond,
          })),
        );
      }
    });

    return actions;
  };

  private getChooseActionsInOptions = (): {
    node: ActionNode;
    statePath: string[];
  }[] => {
    const chooseActions: { node: ActionNode; statePath: string[] }[] = [];
    const allActionsInConfig = this.getAllActionsInConfig();

    this.ast.options?.actions?.properties.forEach((actionProperty) => {
      if (
        actionProperty.result &&
        'action' in actionProperty.result &&
        actionProperty.result.chooseConditions
      ) {
        const actionInConfig = allActionsInConfig.find(
          (a) => a.node.name === actionProperty.key,
        );

        if (actionInConfig) {
          chooseActions.push({
            node: Object.assign(actionProperty.result, {
              /**
               * Give it the name of the action in the config
               */
              name: actionInConfig.node.name,
            }),
            statePath: actionInConfig.statePath,
          });
        }
      }
    });

    return chooseActions;
  };

  /**
   * Returns the raw value of a comment marked with @xstate-layout.
   *
   * For instance: '@xstate-layout 1234' will return '1234'
   */
  getLayoutComment = (): { value: string; comment: Comment } | undefined => {
    if (!this.ast.callee?.loc) return undefined;
    const layoutComment = this.fileComments.find((comment) => {
      if (comment.type !== 'xstate-layout') return false;

      return comment.node.loc!.end.line === this.ast.callee.loc!.start.line - 1;
    });

    if (!layoutComment) return undefined;

    const comment = layoutComment?.node.value || '';

    const value = getLayoutString(comment);

    if (!value) return undefined;

    return { comment: layoutComment, value };
  };

  getTransitions = () => {
    const targets: {
      config: TransitionConfigNode;
      fromPath: string[];
      transitionPath: TransitionPath;
    }[] = [];

    this.stateNodes.forEach((stateNode) => {
      stateNode.ast.on?.properties.forEach((on) => {
        on.result.forEach((transition, index) => {
          targets.push({
            config: transition,
            fromPath: stateNode.path,
            transitionPath: ['on', on.key, index],
          });
        });
      });
      stateNode.ast.after?.properties.forEach((after) => {
        after.result.forEach((transition, index) => {
          targets.push({
            config: transition,
            fromPath: stateNode.path,
            transitionPath: ['after', after.key, index],
          });
        });
      });
      stateNode.ast.onDone?.forEach((transition, index) => {
        targets.push({
          config: transition,
          fromPath: stateNode.path,
          transitionPath: ['onDone', index],
        });
      });
      stateNode.ast.invoke?.forEach((invoke, invokeIndex) => {
        invoke.onDone?.forEach((transition, index) => {
          targets.push({
            config: transition,
            fromPath: stateNode.path,
            transitionPath: ['invoke', invokeIndex, 'onDone', index],
          });
        });
        invoke.onError?.forEach((transition, index) => {
          targets.push({
            config: transition,
            fromPath: stateNode.path,
            transitionPath: ['invoke', invokeIndex, 'onError', index],
          });
        });
      });
      stateNode.ast.always?.forEach((transition, index) => {
        targets.push({
          config: transition,
          fromPath: stateNode.path,
          transitionPath: ['always', index],
        });
      });
    });

    return targets;
  };

  getTransitionTargets = () => {
    return this.getTransitions()
      .map((transition) => {
        if (!transition.config?.target) {
          return;
        }
        return {
          target: transition.config.target,
          fromPath: transition.fromPath,
          transitionPath: transition.transitionPath,
          targetPath: transition.config.target.map((target) => {
            if (target.value.startsWith('#')) {
              const targetedId = target.value.split('.')[0].slice(1);
              const idPath = this._idMap.get(targetedId);
              if (!idPath) {
                return;
              }
              return idPath.concat(target.value.split('.').slice(1));
            }
            if (target.value.startsWith('.')) {
              return transition.fromPath.concat(
                target.value.slice(1).split('.'),
              );
            }
            return transition.fromPath
              .slice(0, -1)
              .concat(target.value.split('.'));
          }),
        };
      })
      .filter((transition): transition is NonNullable<typeof transition> =>
        Boolean(transition),
      );
  };

  getStateNodeByPath = (path: string[]) => {
    return this.stateNodes.find((node) => {
      return node.path.join('') === path.join('');
    });
  };

  getAllStateNodes = () => this.stateNodes;

  toConfig = (opts?: ToMachineConfigParseOptions) => {
    return toMachineConfig(this.ast, opts);
  };

  getAllConds = (
    declarationTypes: DeclarationType[] = [
      'identifier',
      'inline',
      'unknown',
      'named',
    ],
  ) => {
    const conds: {
      node: t.Node;
      cond: Condition<any, any>;
      statePath: string[];
      name: string;
      inlineDeclarationId: string;
    }[] = [];

    this.getTransitions().forEach((transition) => {
      if (
        transition.config.cond?.declarationType &&
        declarationTypes.includes(transition.config.cond?.declarationType)
      ) {
        conds.push({
          name: transition.config.cond.name,
          node: transition.config.cond.node,
          cond: transition.config.cond.cond,
          statePath: transition.fromPath,
          inlineDeclarationId: transition.config.cond.inlineDeclarationId,
        });
      }
    });

    this.getChooseActionsInOptions()
      .concat(this.getAllActionsInConfig())
      .forEach((action) => {
        action.node.chooseConditions?.forEach((chooseCondition) => {
          if (
            chooseCondition.conditionNode?.declarationType &&
            declarationTypes.includes(
              chooseCondition.conditionNode?.declarationType,
            )
          ) {
            conds.push({
              name: chooseCondition.conditionNode.name,
              node: chooseCondition.conditionNode.node,
              cond: chooseCondition.conditionNode.cond,
              statePath: action.statePath,
              inlineDeclarationId:
                chooseCondition.conditionNode.inlineDeclarationId,
            });
          }
        });
      });

    return conds;
  };

  private getAllActionsInConfig = () => {
    const actions: {
      node: ActionNode;
      statePath: string[];
    }[] = [];

    const addAction = (action: ActionNode, statePath: string[]) => {
      actions.push({
        node: action,
        statePath,
      });

      action.chooseConditions?.forEach((chooseCondition) => {
        chooseCondition.actionNodes.forEach((action) => {
          addAction(action, statePath);
        });
      });
    };

    this.getTransitions().forEach((transition) => {
      transition.config?.actions?.forEach((action) =>
        addAction(action, transition.fromPath),
      );
    });

    this.getAllStateNodes().forEach((node) => {
      node.ast.entry?.forEach((action) => {
        addAction(action, node.path);
      });
      node.ast.onEntry?.forEach((action) => {
        addAction(action, node.path);
      });
      node.ast.exit?.forEach((action) => {
        addAction(action, node.path);
      });
      node.ast.onExit?.forEach((action) => {
        addAction(action, node.path);
      });
    });

    return actions;
  };

  getAllActions = (
    declarationTypes: DeclarationType[] = [
      'identifier',
      'inline',
      'unknown',
      'named',
    ],
  ) => {
    const actions: {
      node: t.Node;
      action: Action<any, any>;
      statePath: string[];
      chooseConditions?: ParsedChooseCondition[];
      name: string;
      inlineDeclarationId: string;
    }[] = [];

    const addActionIfHasName = (action: ActionNode, statePath: string[]) => {
      if (action && declarationTypes.includes(action.declarationType)) {
        actions.push({
          name: action.name,
          node: action.node,
          action: action.action,
          statePath,
          chooseConditions: action.chooseConditions,
          inlineDeclarationId: action.inlineDeclarationId,
        });
      }
    };

    this.getAllActionsInConfig().forEach((action) => {
      addActionIfHasName(action.node, action.statePath);
    });

    this.getChooseActionsInOptions().forEach((action) => {
      action.node.chooseConditions?.forEach((chooseCondition) => {
        chooseCondition.actionNodes.forEach((chooseAction) => {
          addActionIfHasName(chooseAction, action.statePath);
        });
      });
    });

    return actions;
  };

  getAllServices = (
    declarationTypes: DeclarationType[] = [
      'identifier',
      'inline',
      'unknown',
      'named',
    ],
  ) => {
    const services: {
      node: t.Node;
      src: string;
      id: string | undefined;
      statePath: string[];
      srcNode: t.Node | undefined;
      inlineDeclarationId: string;
    }[] = [];

    this.stateNodes.map((stateNode) => {
      stateNode.ast.invoke?.forEach((invoke) => {
        const invokeSrc =
          typeof invoke.src?.value === 'string' ? invoke.src.value : undefined;
        if (
          invoke.src?.declarationType &&
          declarationTypes.includes(invoke.src?.declarationType)
        ) {
          services.push({
            src: invokeSrc ?? invoke.src?.inlineDeclarationId,
            id: invoke.id?.value,
            node: invoke.node,
            statePath: stateNode.path,
            srcNode: invoke.src?.node,
            inlineDeclarationId: invoke.src?.inlineDeclarationId,
          });
        }
      });
    });

    return services;
  };

  getAllNamedDelays = () => {
    const delays = new RecordOfArrays<{
      node: t.Node;
      name: string;
      statePath: string[];
    }>();

    this.stateNodes.map((stateNode) => {
      stateNode.ast.after?.properties.forEach((property) => {
        if (t.isIdentifier(property.keyNode)) {
          const key = property.key;

          delays.add(key, {
            node: property.keyNode,
            name: key,
            statePath: stateNode.path,
          });
        }
      });
    });

    return delays.toObject();
  };

  getActionImplementation = (name: string) => {
    const node = this.ast.options?.actions?.properties.find((property) => {
      return property.key === name;
    });

    return node;
  };

  getServiceImplementation = (name: string) => {
    const node = this.ast.options?.services?.properties.find((property) => {
      return property.key === name;
    });

    return node;
  };

  getGuardImplementation = (name: string) => {
    const node = this.ast.options?.guards?.properties.find((property) => {
      return property.key === name;
    });

    return node;
  };

  modify(edits: Array<MachineEdit>) {
    // this ain't ideal because Recast mutates the input AST
    // so there is a risk that modifying multiple machines in a single file would lead to problems
    // however, we never modify multiple machines based on the same file content so this is somewhat safe
    // each modification updates the AST, that is printed and the file is re-parsed, so the next modification sees the next AST
    const ast: RecastFile = recast.parse(this._fileContent, {
      parser: {
        // this is a slight hack to defer the work done by `recast.parse`
        // we don't need to re-parse the file though, as we already have the AST
        parse: () => this._fileAst,
      },
    });

    const recastDefinitionNode = findRecastDefinitionNode(
      ast,
      this.ast.definition!.node,
    );

    for (const edit of edits) {
      switch (edit.type) {
        case 'add_state': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.path,
          );
          const statesProp = findObjectProperty(stateObj, 'states');
          if (statesProp) {
            const unwrapped = unwrapSimplePropValue(statesProp);
            n.ObjectExpression.assert(unwrapped);
            unwrapped.properties.push(
              b.objectProperty(
                safePropertyKey(edit.name),
                b.objectExpression([]),
              ),
            );
          } else {
            stateObj.properties.push(
              b.objectProperty(
                b.identifier('states'),
                b.objectExpression([
                  b.objectProperty(
                    safePropertyKey(edit.name),
                    b.objectExpression([]),
                  ),
                ]),
              ),
            );
          }
          break;
        }
        case 'remove_state': {
          removeState(recastDefinitionNode, edit.path);

          this.getTransitionTargets().forEach(
            ({ target, targetPath, fromPath, transitionPath }) => {
              target.forEach((_, index) => {
                if (
                  !targetPath[index] ||
                  !arePathsEqual(
                    targetPath[index]!.slice(0, edit.path.length),
                    edit.path,
                  )
                ) {
                  return;
                }

                const parentObj = getStateObjectByPath(
                  recastDefinitionNode,
                  fromPath,
                );

                removeTransitionAtPath(parentObj, transitionPath);
              });
            },
          );
          break;
        }
        case 'rename_state': {
          const stateProp = getStatePropByPath(recastDefinitionNode, edit.path);
          n.ObjectProperty.assert(stateProp);
          const oldName = n.Identifier.check(stateProp.key)
            ? stateProp.key.name
            : n.StringLiteral.check(stateProp.key)
            ? stateProp.key.value
            : null;

          stateProp.key = safePropertyKey(edit.name);

          if (oldName) {
            const initialProp = getPropByPath(recastDefinitionNode, [
              ...edit.path.slice(0, -1).flatMap((p) => ['states', p]),
              'initial',
            ]);
            if (initialProp) {
              const unwrapped = unwrapSimplePropValue(initialProp);
              if (unwrapped && getSimpleStringValue(unwrapped) === oldName) {
                setPropertyValue(initialProp, b.stringLiteral(edit.name));
              }
            }

            const targetableAncestorIds = collectAncestorIds(
              recastDefinitionNode,
              edit.path,
            );

            this.getTransitionTargets().forEach(
              ({ fromPath, target, transitionPath, targetPath }) => {
                // TODO: this doesn't support multiple targets, but Studio doesn't support that either
                target.forEach((t, index) => {
                  if (t.value.charAt(0) === '#') {
                    if (!targetPath[0] || !t.value.includes('.')) {
                      return;
                    }
                    const targetedId = t.value.split('.')[0].slice(1);

                    if (
                      !targetableAncestorIds.has(targetedId) ||
                      !arePathsEqual(
                        targetPath[0].slice(0, edit.path.length),
                        edit.path,
                      )
                    ) {
                      return;
                    }

                    const idPath = this._idMap.get(targetedId)!;

                    const segmentedValue = t.value.split('.').slice(1);
                    const affectedSegment =
                      edit.path.length - idPath.length - 1;
                    segmentedValue[affectedSegment] = edit.name;
                    const newValue = `#${targetedId}.${segmentedValue.join(
                      '.',
                    )}`;

                    updateTargetAtObjectPath(
                      recastDefinitionNode,
                      [
                        ...fromPath.flatMap((p) => ['states', p]),
                        ...transitionPath,
                      ],
                      newValue,
                    );
                    return;
                  }

                  if (t.value.charAt(0) === '.') {
                    if (
                      !arePathsEqual(
                        targetPath[index]!.slice(0, edit.path.length),
                        edit.path,
                      )
                    ) {
                      return;
                    }
                    const segmentedValue = t.value.slice(1).split('.');
                    const affectedSegment =
                      edit.path.length - fromPath.length - 1;
                    segmentedValue[affectedSegment] = edit.name;
                    const newValue = `.${segmentedValue.join('.')}`;

                    updateTargetAtObjectPath(
                      recastDefinitionNode,
                      [
                        ...fromPath.flatMap((p) => ['states', p]),
                        ...transitionPath,
                      ],
                      newValue,
                    );
                    return;
                  }

                  // root has no siblings so for `fromPath: []` we don't need to check for siblings
                  // `[].slice(0, -1)` gives us `[]` back, so while the intention is to check the parent path...
                  // for the root we'd just stay at the root
                  if (!fromPath.length) {
                    return;
                  }

                  if (
                    !arePathsEqual(
                      targetPath[index]!.slice(0, edit.path.length),
                      edit.path,
                    )
                  ) {
                    return;
                  }

                  const segmentedValue = t.value.split('.');
                  const affectedSegment = edit.path.length - fromPath.length;
                  segmentedValue[affectedSegment] = edit.name;
                  const newValue = segmentedValue.join('.');

                  updateTargetAtObjectPath(
                    recastDefinitionNode,
                    [
                      ...fromPath.flatMap((p) => ['states', p]),
                      ...transitionPath,
                    ],
                    newValue,
                  );
                  return;
                });
              },
            );
          } else {
            throw new Error('Could not find the old name of the state');
          }
          break;
        }
        case 'reparent_state': {
          if (edit.path.length === 0) {
            throw new Error(`Root state can't be moved.`);
          }
          if (edit.newParentPath.length === 0) {
            throw new Error(`State can't be moved to the root.`);
          }
          if (
            arePathsEqual(
              edit.path,
              edit.newParentPath.slice(0, edit.path.length),
            )
          ) {
            throw new Error(
              `The new parent of a state has to be outside of that state.`,
            );
          }

          const targetRecomputeCandidates: {
            sourcePath: string[];
            targetPath: string[];
            transitionPath: TransitionPath;
          }[] = [];

          for (const t of this.getTransitionTargets()) {
            const targetPath = t.targetPath[0];

            if (!targetPath) {
              continue;
            }

            if (
              // if source is an ancestor of the reparented state
              t.fromPath.length !== edit.path.length &&
              arePathsEqual(t.fromPath, edit.path.slice(0, t.fromPath.length))
            ) {
              if (
                // and it's targeting a state in the reparented state
                arePathsEqual(
                  t.fromPath,
                  targetPath.slice(0, t.fromPath.length),
                ) &&
                // we don't need to touch self-transitions though
                t.fromPath.length !== targetPath.length
              ) {
                targetRecomputeCandidates.push({
                  sourcePath: t.fromPath,
                  targetPath: [
                    ...edit.newParentPath,
                    ...targetPath.slice(
                      targetPath.length - edit.path.length - 1,
                    ),
                  ],
                  transitionPath: t.transitionPath,
                });
                continue;
              }

              continue;
            }

            if (
              // if the source is within the reparented state
              arePathsEqual(edit.path, t.fromPath.slice(0, edit.path.length))
            ) {
              // if the target lies outside of the reparented state
              if (
                !arePathsEqual(edit.path, targetPath.slice(0, edit.path.length))
              ) {
                // then we only need to adjust potential sibling targets
                if (
                  !t.target[0].value.startsWith('#') &&
                  !t.target[0].value.startsWith('.')
                ) {
                  targetRecomputeCandidates.push({
                    sourcePath: [
                      ...edit.newParentPath,
                      ...t.fromPath.slice(
                        t.fromPath.length - edit.path.length - 1,
                      ),
                    ],
                    targetPath,
                    transitionPath: t.transitionPath,
                  });
                  continue;
                }
                continue;
              }

              // if the source and target lies within the reparent state then we can assume that we don't have to adjust the target descriptor
              // unless it's using an ID-based descriptor, other descriptors can't "escape" the reparented state
              if (
                t.target[0].value.startsWith('#') &&
                // we can also leave alone ID-based targets without dots as the descriptor using only the ID won't need to be adjusted either
                t.target[0].value.includes('.')
              ) {
                targetRecomputeCandidates.push({
                  sourcePath: [
                    ...edit.newParentPath,
                    ...t.fromPath.slice(
                      t.fromPath.length - edit.path.length - 1,
                    ),
                  ],
                  targetPath: [
                    ...edit.newParentPath,
                    ...targetPath.slice(
                      targetPath.length - edit.path.length - 2,
                    ),
                  ],
                  transitionPath: t.transitionPath,
                });
                continue;
              }

              continue;
            }

            // by now we know that the source has no ancestor<->descendant relationship with the reparented state
            // so we only need to check if the target path lies within the reparent state
            if (
              arePathsEqual(edit.path, targetPath.slice(0, edit.path.length))
            ) {
              targetRecomputeCandidates.push({
                sourcePath: t.fromPath,
                targetPath: [
                  ...edit.newParentPath,
                  ...targetPath.slice(targetPath.length - edit.path.length - 1),
                ],
                transitionPath: t.transitionPath,
              });
              continue;
            }
          }

          const state = removeState(recastDefinitionNode, edit.path);
          const newParent = getStateObjectByPath(
            recastDefinitionNode,
            edit.newParentPath,
          );
          getStatesObjectInState(newParent).properties.push(
            b.objectProperty(safePropertyKey(last(edit.path)), state),
          );

          targetRecomputeCandidates.forEach((candidate) => {
            updateTargetAtObjectPath(
              recastDefinitionNode,
              [
                ...candidate.sourcePath.flatMap((p) => ['states', p]),
                ...candidate.transitionPath,
              ],
              getBestTargetDescriptor(recastDefinitionNode, candidate)!,
            );
          });

          const oldParent = getStateObjectByPath(
            recastDefinitionNode,
            edit.path.slice(0, -1),
          );

          const initialPropIndex = findObjectPropertyIndex(
            oldParent,
            'initial',
          );

          if (initialPropIndex === -1) {
            break;
          }
          const initialValue = getSimpleStringValue(
            unwrapSimplePropValue(oldParent.properties[initialPropIndex])!,
          );
          if (initialValue === last(edit.path)) {
            oldParent.properties.splice(initialPropIndex, 1);
          }
          break;
        }
        case 'set_initial_state': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.path,
          );

          const prop = findObjectProperty(stateObj, 'initial');
          if (prop) {
            n.ObjectProperty.assert(prop);
            setPropertyValue(prop, b.stringLiteral(edit.initialState));
          } else {
            stateObj.properties.push(
              b.objectProperty(
                b.identifier('initial'),
                b.stringLiteral(edit.initialState),
              ),
            );
          }
          break;
        }

        case 'add_transition': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.sourcePath,
          );

          const target = getBestTargetDescriptor(recastDefinitionNode, edit);

          // TODO: we could avoid adding `internal: true` for external transitions with no ancestor-descendant relationship between source and the target
          const transition = minifyTransitionObjectExpression(
            toObjectExpression({
              target,
              ...(edit.guard && { cond: edit.guard }),
              internal: !edit.external,
            }),
          );
          insertAtTransitionPath(stateObj, edit.transitionPath, transition);
          break;
        }
        case 'remove_transition': {
          removeTransitionAtPath(
            getStateObjectByPath(recastDefinitionNode, edit.sourcePath),
            edit.transitionPath,
          );
          break;
        }
        case 'reanchor_transition': {
          let sourceObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.sourcePath,
          );

          const oldTransition = this.getTransitionTargets().find(
            (t) =>
              arePathsEqual(t.fromPath, edit.sourcePath) &&
              arePathsEqual(t.transitionPath, edit.transitionPath),
          );
          // TODO: this doesn't handle multiple targets but Studio doesnt either
          const oldTargetPath = oldTransition?.targetPath[0];

          if (edit.newSourcePath) {
            const removed = removeTransitionAtPath(
              sourceObj,
              edit.transitionPath,
            );

            sourceObj = getStateObjectByPath(
              recastDefinitionNode,
              edit.newSourcePath,
            );

            insertAtTransitionPath(
              sourceObj,
              [
                ...edit.transitionPath.slice(0, -1),
                getIndexForTransitionPathAppendant(
                  sourceObj,
                  edit.transitionPath,
                ),
              ] as TransitionPath,
              removed,
            );
          }

          const newTargetPath =
            'newTargetPath' in edit ? edit.newTargetPath : oldTargetPath;
          const newSourcePath = edit.newSourcePath || edit.sourcePath;

          const transitionProp = getPropByPath(
            sourceObj,
            edit.transitionPath.slice(0, -1),
          )!;

          const index = last(edit.transitionPath) as number;

          const target = getBestTargetDescriptor(recastDefinitionNode, {
            sourcePath: newSourcePath,
            targetPath: newTargetPath,
          });

          const transitionObject = getTransitionAtIndex(
            unwrapSimplePropValue(transitionProp)!,
            index,
          );

          const finalExternal = getTransitionExternalValue(
            { source: edit.sourcePath, target: oldTargetPath },
            { source: newSourcePath, target: newTargetPath },
            transitionObject,
          );

          // TODO: this logic could maybe be somehow merged with `updateTransitionAtPathWith`
          const minifiedTransition = minifyTransitionObjectExpression(
            transitionObject,
            { target, internal: !finalExternal },
          );

          if (n.ArrayExpression.check(transitionProp.value)) {
            if (transitionProp.value.elements.length === 1) {
              transitionProp.value = minifiedTransition as any;
              break;
            }
            transitionProp.value.elements[index] = minifiedTransition as any;
          } else {
            transitionProp.value = minifiedTransition as any;
          }
          break;
        }
        case 'change_transition_path': {
          const sourceObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.sourcePath,
          );
          const removed = removeTransitionAtPath(
            sourceObj,
            edit.transitionPath,
          );
          insertAtTransitionPath(sourceObj, edit.newTransitionPath, removed);
          break;
        }
        case 'add_action': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.path,
          );
          insertAtActionPath(
            stateObj,
            edit.actionPath,
            t.stringLiteral(edit.name),
          );
          break;
        }
        case 'remove_action': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.path,
          );
          removeAtActionPath(stateObj, edit.actionPath);
          break;
        }
        case 'edit_action': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.path,
          );
          editAtActionPath(
            stateObj,
            edit.actionPath,
            t.stringLiteral(edit.name),
          );
          break;
        }
        case 'add_guard': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.path,
          );
          insertGuardAtTransitionPath(
            stateObj,
            edit.transitionPath,
            t.stringLiteral(edit.name),
          );
          break;
        }
        case 'remove_guard': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.path,
          );
          removeGuardFromTransition(stateObj, edit.transitionPath);
          break;
        }
        case 'edit_guard': {
          const stateObj = getStateObjectByPath(
            recastDefinitionNode,
            edit.path,
          );
          editGuardAtTransitionPath(
            stateObj,
            edit.transitionPath,
            t.stringLiteral(edit.name),
          );
          break;
        }
        case 'add_invoke': {
          insertAtArrayifiableProperty({
            obj: getStateObjectByPath(recastDefinitionNode, edit.path),
            property: 'invoke',
            index: edit.invokeIndex,
            value: toObjectExpression({
              src: edit.source,
              ...(edit.id && { id: edit.id }),
            }),
          });
          break;
        }
        case 'remove_invoke': {
          // transitions related to this invoke are already defined in that invoke so it's enough to remove the invoke itself
          removeAtArrayifiableProperty({
            obj: getStateObjectByPath(recastDefinitionNode, edit.path),
            property: 'invoke',
            index: edit.invokeIndex,
          });
          break;
        }
        case 'edit_invoke': {
          const state = getStateObjectByPath(recastDefinitionNode, edit.path);
          const invokeProp = getPropByPath(state, ['invoke'])!;
          const unwrapped = unwrapSimplePropValue(invokeProp);

          if (n.ArrayExpression.check(unwrapped)) {
            const invoke = unwrapped.elements[edit.invokeIndex];
            n.ObjectExpression.assert(invoke);
            updateInvoke(invoke, edit);
            break;
          }
          n.ObjectExpression.assert(unwrapped);
          updateInvoke(unwrapped, edit);
          break;
        }
      }
    }

    return recast.print(ast).code;
  }
}

function updateInvoke(
  invoke: RecastObjectExpression,
  data: Pick<Extract<MachineEdit, { type: 'edit_invoke' }>, 'id' | 'source'>,
) {
  if (typeof data.id === 'string') {
    const idProp = findObjectProperty(invoke, 'id')!;
    idProp.value = b.stringLiteral(data.id);
  } else if ('id' in data && data.id === undefined) {
    let propIndex = -1;
    while ((propIndex = findObjectPropertyIndex(invoke, 'id')!) !== -1) {
      invoke.properties.splice(propIndex, 1);
    }
  }

  if (typeof data.source === 'string') {
    const srcProp = findObjectProperty(invoke, 'src')!;
    srcProp.value = updateItemType(
      unwrapSimplePropValue(srcProp)!,
      b.stringLiteral(data.source),
    ) as any;
  }
}

function updateTargetAtObjectPath(
  obj: RecastObjectExpression,
  objPath: (string | number)[],
  newTarget: string,
) {
  const prop = getPropByPath(obj, objPath.slice(0, -1))!;
  if (n.ArrayExpression.check(prop.value)) {
    const index = last(objPath) as number;
    const element = prop.value.elements[index];
    if (!n.ObjectExpression.check(element)) {
      prop.value.elements.splice(index, 1, b.stringLiteral(newTarget));
    } else {
      const targetProp = findObjectProperty(element, 'target')!;
      setPropertyValue(targetProp, b.stringLiteral(newTarget));
    }
  } else if (!n.ObjectExpression.check(prop.value)) {
    setPropertyValue(prop, b.stringLiteral(newTarget));
  } else {
    const targetProp = findObjectProperty(prop.value, 'target')!;
    setPropertyValue(targetProp, b.stringLiteral(newTarget));
  }
}

function getPropertyKey(
  prop: RecastObjectProperty | RecastProperty | RecastObjectMethod,
): string | number {
  if (n.Identifier.check(prop.key)) {
    return prop.key.name;
  }
  if (n.StringLiteral.check(prop.key) || n.NumericLiteral.check(prop.key)) {
    return prop.key.value;
  }
  throw new Error('Unexpected property key type');
}

function findObjectPropertyIndex(
  obj: RecastObjectExpression,
  key: string | number,
) {
  // iterate from the back to find to handle cases like `{ a: 1, a: 2 }`
  for (let i = obj.properties.length - 1; i >= 0; i--) {
    const prop = obj.properties[i];
    if ('key' in prop && String(getPropertyKey(prop)) === String(key)) {
      return i;
    }
  }
  return -1;
}

function findObjectProperty(obj: RecastObjectExpression, key: string) {
  const index = findObjectPropertyIndex(obj, key);
  if (index === -1) {
    return;
  }
  const prop = obj.properties[findObjectPropertyIndex(obj, key)];

  if (prop && (n.SpreadElement.check(prop) || n.SpreadProperty.check(prop))) {
    throw new Error('Spread properties are not supported');
  }
  n.ObjectProperty.assert(prop);
  return prop;
}

function findArrayElementWithSingularFallback(node: RecastNode, index: number) {
  if (n.ArrayExpression.check(node)) {
    return node.elements[index];
  }

  // this is a singular fallback
  if (index === 0) {
    return node;
  }
}

// TODO: this kinda should accept `prop: RecastObjectProperty`
// investigate why it doesn't and if we can change that
const unwrapSimplePropValue = (prop: RecastNode) => {
  return n.Property.check(prop) || n.ObjectProperty.check(prop)
    ? prop.value
    : null;
};

function getSimpleStringValue(prop: RecastNode) {
  return n.StringLiteral.check(prop)
    ? prop.value
    : n.TemplateLiteral.check(prop) && prop.quasis.length === 1
    ? prop.quasis[0].value.cooked
    : null;
}

function getTargetValue(prop: RecastNode) {
  return n.Identifier.check(prop) && prop.name === 'undefined'
    ? undefined
    : getSimpleStringValue(prop);
}

function getBooleanValue(prop: RecastNode) {
  return n.BooleanLiteral.check(prop) ? prop.value : null;
}

function getStateObjectByPath(object: RecastObjectExpression, path: string[]) {
  if (path.length === 0) {
    return object;
  }
  const prop = getStatePropByPath(object, path);
  const value = unwrapSimplePropValue(prop);
  n.ObjectExpression.assert(value);
  return value;
}

function getPropByPath(ast: RecastObjectExpression, path: (string | number)[]) {
  if (path.length === 0) {
    throw new Error('As we have to return a *prop* path cannot be empty');
  }
  if (typeof last(path) !== 'string') {
    throw new Error(
      'As we have to return a *prop* the last element of the path must be a string',
    );
  }
  const pathCopy = [...path];
  let segment: typeof path[number] | undefined;
  let current: RecastNode | undefined | null = ast;
  while ((segment = pathCopy.shift()) !== undefined) {
    if (typeof segment === 'string') {
      const prop = findObjectProperty(
        current as RecastObjectExpression,
        segment,
      );
      if (!prop) {
        return;
      }
      if (pathCopy.length === 0) {
        n.ObjectProperty.assert(prop);
        return prop;
      }
      current = unwrapSimplePropValue(prop)!;
      continue;
    }
    current = findArrayElementWithSingularFallback(
      current as RecastObjectExpression,
      segment,
    );

    if (!current) {
      return;
    }
  }
}

function insertAtTransitionPath(
  ast: RecastObjectExpression,
  path: TransitionPath,
  value: RecastNode,
) {
  if (typeof last(path) !== 'number') {
    throw new Error(
      'The last element of the path must be a number as we might be adding an array element',
    );
  }
  const pathCopy = path.slice(0, -1);
  let segment: typeof path[number] | undefined;
  let current: RecastNode = ast;

  while ((segment = pathCopy.shift())) {
    const prop =
      typeof segment === 'string'
        ? findObjectProperty(current as RecastObjectExpression, segment)
        : findArrayElementWithSingularFallback(current, segment);

    if (!prop) {
      n.ObjectExpression.assert(current);

      if (!pathCopy.length) {
        current.properties.push(
          b.objectProperty(safePropertyKey(segment), value as any),
        );
        return;
      }
      const createdProp = b.objectProperty(
        safePropertyKey(segment),
        // non-trailing array elements should always be present
        // arrayed invokes should always preexist when adding transitions in them
        // so we can assume that we need to create an object here
        b.objectExpression([]),
      );
      current.properties.push(createdProp);
      current = createdProp.value;
      continue;
    }

    if (!pathCopy.length) {
      n.ObjectProperty.assert(prop);
      if (!n.ArrayExpression.check(prop.value)) {
        prop.value = b.arrayExpression([prop.value as any]);
      }
      prop.value.elements.splice(last(path) as number, 0, value as any);
      return;
    }
    let unwrapped = unwrapSimplePropValue(prop)!;
    if (typeof pathCopy[0] === 'number') {
      const index = pathCopy.shift() as number;
      if (n.ArrayExpression.check(unwrapped)) {
        current = unwrapped.elements[index]!;
        continue;
      }
    }
    current = unwrapped;
  }
}

function getTransitionObject(
  obj: RecastObjectExpression,
  path: TransitionPath,
) {
  const pathCopy = [...path];
  let segment: typeof path[number] | undefined;
  let current: RecastNode = obj;

  while ((segment = pathCopy.shift())) {
    const prop =
      typeof segment === 'string'
        ? findObjectProperty(current as RecastObjectExpression, segment)!
        : findArrayElementWithSingularFallback(current, segment)!;

    let unwrapped = unwrapSimplePropValue(prop)!;

    if (typeof pathCopy[0] === 'number') {
      const index = pathCopy.shift() as number;
      if (n.ArrayExpression.check(unwrapped)) {
        if (!pathCopy.length) {
          unwrapped.elements[index] = upgradeSimpleTarget(
            unwrapped.elements[index]!,
          );
        }
        current = unwrapped.elements[index]!;
        continue;
      }
      if (!pathCopy.length && !n.ObjectExpression.check(unwrapped)) {
        n.ObjectProperty.assert(prop);
        prop.value = upgradeSimpleTarget(unwrapped);
        current = prop.value;
        continue;
      }
    }
    current = unwrapped;
  }

  n.ObjectExpression.assert(current);
  return current;
}

function insertAtActionPath(
  obj: RecastObjectExpression,
  path: ActionPath,
  value: RecastNode,
) {
  if (typeof last(path) !== 'number') {
    throw new Error(
      'The last element of the path must be a number as we might be adding an array element',
    );
  }

  if (path[0] === 'entry' || path[0] === 'exit') {
    insertAtArrayifiableProperty({
      obj,
      property: path[0],
      index: path[1],
      value,
    });
    return;
  }

  const transition = getTransitionObject(
    obj,
    path.slice(0, -1) as TransitionPath,
  );

  insertAtArrayifiableProperty({
    obj: transition,
    property: 'actions',
    index: last(path) as number,
    value,
  });
}

function editAtActionPath(
  obj: RecastObjectExpression,
  path: ActionPath,
  value: RecastNode,
) {
  if (typeof last(path) !== 'number') {
    throw new Error(
      'The last element of the path must be a number as we might be adding an array element',
    );
  }

  if (path[0] === 'entry' || path[0] === 'exit') {
    editAtArrayifiableProperty({
      obj,
      property: path[0],
      index: path[1],
      value,
    });
    return;
  }

  const transition = getTransitionObject(
    obj,
    path.slice(0, -1) as TransitionPath,
  );

  editAtArrayifiableProperty({
    obj: transition,
    property: 'actions',
    index: last(path) as number,
    value,
  });
}

function removeAtActionPath(obj: RecastObjectExpression, path: ActionPath) {
  if (typeof last(path) !== 'number') {
    throw new Error(
      'The last element of the path must be a number as we might be removing from an array element',
    );
  }

  if (path[0] === 'entry' || path[0] === 'exit') {
    removeAtArrayifiableProperty({
      obj,
      property: path[0],
      index: path[1],
    });
    return;
  }
  const transition = getTransitionObject(
    obj,
    path.slice(0, -1) as TransitionPath,
  );
  const transitionIndex = last(path) as number;

  removeAtArrayifiableProperty({
    obj: transition,
    property: 'actions',
    index: transitionIndex,
  });

  updateTransitionAtPathWith(
    obj,
    path.slice(0, -1) as TransitionPath,
    transition,
  );
}

function insertGuardAtTransitionPath(
  obj: RecastObjectExpression,
  path: TransitionPath,
  value: RecastNode,
) {
  const transition = getTransitionObject(obj, path);
  transition.properties.push(
    b.objectProperty(b.identifier('cond'), value as any),
  );
}

function editGuardAtTransitionPath(
  obj: RecastObjectExpression,
  path: TransitionPath,
  value: RecastNode,
) {
  const transition = getTransitionObject(obj, path);
  const condIndex = findObjectPropertyIndex(transition, 'cond');
  if (condIndex === -1) {
    throw new Error(`"cond" should exist before attempting to remove it`);
  }

  const condProp = transition.properties[condIndex];
  n.ObjectProperty.assert(condProp);
  condProp.value = updateItemType(
    unwrapSimplePropValue(condProp)!,
    value,
  ) as any;
}

function removeGuardFromTransition(
  obj: RecastObjectExpression,
  path: TransitionPath,
) {
  const transition = getTransitionObject(obj, path);
  const condIndex = findObjectPropertyIndex(transition, 'cond');
  if (condIndex === -1) {
    throw new Error(`"cond" should exist before attempting to remove it`);
  }

  transition.properties.splice(condIndex, 1);

  updateTransitionAtPathWith(obj, path, transition);
}

function updateTransitionAtPathWith(
  obj: RecastObjectExpression,
  path: TransitionPath,
  transition: RecastObjectExpression,
) {
  const minified = minifyTransitionObjectExpression(transition);

  if (!n.ObjectExpression.check(minified)) {
    const transitionProp = getPropByPath(obj, path.slice(0, -1))!;
    if (n.ArrayExpression.check(transitionProp.value)) {
      if (transitionProp.value.elements.length === 1) {
        transitionProp.value = minified as any;
        return;
      }
      transitionProp.value.elements[last(path) as number] = minified as any;
    } else {
      transitionProp.value = minified as any;
    }
  }
}

function insertAtArrayifiableProperty({
  obj,
  property,
  index,
  value,
}: {
  obj: RecastObjectExpression;
  property: string;
  index: number;
  value: RecastNode;
}) {
  const propIndex = findObjectPropertyIndex(obj, property);
  if (propIndex === -1) {
    obj.properties.push(
      b.objectProperty(safePropertyKey(property), value as any),
    );
    return;
  }
  const unwrapped = unwrapSimplePropValue(obj.properties[propIndex]);
  if (!n.ArrayExpression.check(unwrapped)) {
    const prop = obj.properties[propIndex];
    n.ObjectProperty.assert(prop);
    prop.value = b.arrayExpression([unwrapped as any]);
  }
  const arr = unwrapSimplePropValue(obj.properties[propIndex]);
  n.ArrayExpression.assert(arr);
  arr.elements.splice(index, 0, value as any);
}

function removeAtArrayifiableProperty({
  obj,
  property,
  index,
}: {
  obj: RecastObjectExpression;
  property: string;
  index: number;
}) {
  const propIndex = findObjectPropertyIndex(obj, property);
  if (propIndex === -1) {
    throw new Error(
      `"${property}" should exist before attempting to remove an item from it`,
    );
  }
  const unwrapped = unwrapSimplePropValue(obj.properties[propIndex]);
  if (n.ArrayExpression.check(unwrapped)) {
    unwrapped.elements.splice(index, 1);
    if (unwrapped.elements.length === 0) {
      obj.properties.splice(propIndex, 1);
    }
  } else {
    obj.properties.splice(propIndex, 1);
  }
}

function editAtArrayifiableProperty({
  obj,
  property,
  index,
  value,
}: {
  obj: RecastObjectExpression;
  property: string;
  index: number;
  value: RecastNode;
}) {
  const propIndex = findObjectPropertyIndex(obj, property);
  if (propIndex === -1) {
    throw new Error(`"${property}" was expected to exist`);
  }

  const prop = obj.properties[propIndex];
  n.ObjectProperty.assert(prop);

  const unwrapped = unwrapSimplePropValue(obj.properties[propIndex])!;
  if (!n.ArrayExpression.check(unwrapped)) {
    prop.value = updateItemType(unwrapped, value) as any;
    return;
  }
  unwrapped.elements[index] = updateItemType(
    unwrapped.elements[index]!,
    value,
  ) as any;
}

function updateItemType(item: RecastNode, newName: RecastNode) {
  if (n.ObjectExpression.check(item)) {
    const prop = findObjectProperty(item, 'type')!;
    prop.value = newName as any;
    return item;
  }
  return newName;
}

function upgradeSimpleTarget(transition: RecastNode) {
  if (!n.ObjectExpression.check(transition)) {
    return b.objectExpression([
      b.objectProperty(b.identifier('target'), transition as any),
    ]);
  }
  return transition;
}

function getStatePropByPath(ast: RecastObjectExpression, path: string[]) {
  const prop = getPropByPath(
    ast,
    path.flatMap((segment) => ['states', segment]),
  );
  if (!prop) {
    throw new Error('Could not find state');
  }
  return prop;
}

const isValidIdentifier = (name: string) =>
  /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name);

function safePropertyKey(key: string | number) {
  return typeof key === 'number'
    ? b.numericLiteral(key)
    : isValidIdentifier(key)
    ? b.identifier(key)
    : b.stringLiteral(key);
}

function setPropertyValue(
  prop: RecastObjectProperty | RecastProperty,
  valueNode: RecastExpression,
) {
  if (n.Property.check(prop) || n.ObjectProperty.check(prop)) {
    prop.value = valueNode;
  } else {
    throw new Error('Unsupported property type');
  }
}

const ALLOWED_CALL_EXPRESSION_NAMES = new Set([
  'createMachine',
  'Machine',
  'createTestMachine',
]);

function findRecastDefinitionNode(ast: RecastFile, definitionNode: t.Node) {
  let recastNode: RecastObjectExpression | null = null;
  recast.types.visit(ast, {
    visitCallExpression(path) {
      const callee = path.node.callee;
      const argument0 = path.node.arguments[0];
      // this check matches the logic for extracting the definition
      if (
        ((n.MemberExpression.check(callee) &&
          n.Identifier.check(callee.property) &&
          ALLOWED_CALL_EXPRESSION_NAMES.has(callee.property.name)) ||
          (n.Identifier.check(callee) &&
            ALLOWED_CALL_EXPRESSION_NAMES.has(callee.name))) &&
        argument0.loc?.start.line === definitionNode.loc?.start.line &&
        argument0.loc?.start.column === definitionNode.loc?.start.column &&
        argument0.loc?.end.line === definitionNode.loc?.end.line &&
        argument0.loc?.end.column === definitionNode.loc?.end.column
      ) {
        recastNode = argument0 as RecastObjectExpression;
        return false;
      }

      this.traverse(path);
    },
  });
  return recastNode!;
}

function arePathsEqual(path1: (string | number)[], path2: (string | number)[]) {
  return path1.length === path2.length && path1.every((p, i) => p === path2[i]);
}

function getIdValue(obj: RecastObjectExpression) {
  const idProp = findObjectProperty(obj, 'id');
  if (!idProp) {
    return;
  }
  const idValue = unwrapSimplePropValue(idProp)!;
  if (!idValue) {
    return;
  }
  return getSimpleStringValue(idValue);
}

function collectAncestorIds(obj: RecastObjectExpression, path: string[]) {
  const rootId = getIdValue(obj) ?? DEFAULT_ROOT_ID;
  const ids = new Set<string>([rootId]);
  // we are collecting ids from the root to the current node, but exluding the current node
  const parentPath = path.slice(0, -1);
  for (let i = 0; i < parentPath.length; i++) {
    const segment = parentPath[i];
    obj = getStateObjectByPath(obj, [segment]);
    const id = getIdValue(obj);
    if (id) {
      ids.add(id);
    }
  }
  return ids;
}

function toObjectExpression(obj: Record<string | number, unknown>) {
  return b.objectExpression(
    Object.entries(obj).map(([key, value]) => {
      const valueNode =
        typeof value === 'string'
          ? b.stringLiteral(value)
          : typeof value === 'boolean'
          ? b.booleanLiteral(value)
          : typeof value === 'number'
          ? b.numericLiteral(value)
          : typeof value === 'undefined'
          ? b.identifier('undefined')
          : null;
      if (!valueNode) {
        throw new Error(
          'Converting this type of a value to a node has not been implemented',
        );
      }
      return b.objectProperty(safePropertyKey(key), valueNode);
    }),
  );
}

function getBestTargetDescriptor(
  root: RecastObjectExpression,
  {
    sourcePath,
    targetPath,
  }: { sourcePath: string[]; targetPath: string[] | undefined },
): string | undefined {
  if (!targetPath) {
    return;
  }

  if (!targetPath.length) {
    return `#${getIdValue(root) || DEFAULT_ROOT_ID}`;
  }

  if (arePathsEqual(sourcePath, targetPath)) {
    return last(targetPath);
  }

  if (arePathsEqual(sourcePath, targetPath.slice(0, sourcePath.length))) {
    return `.${targetPath.slice(sourcePath.length).join('.')}`;
  }

  if (
    arePathsEqual(
      sourcePath.slice(0, -1),
      targetPath.slice(0, sourcePath.length - 1),
    )
  ) {
    return targetPath.slice(sourcePath.length - 1).join('.');
  }

  const targetId = getIdValue(getStateObjectByPath(root, targetPath));

  if (targetId) {
    return `#${targetId}`;
  }

  const targetPathCopy = [...targetPath];
  let currentTargetPath = getIdValue(root) || DEFAULT_ROOT_ID;
  let current = root;
  let segment: string | undefined;

  while ((segment = targetPathCopy.shift())) {
    current = getStateObjectByPath(current, [segment]);
    const id = getIdValue(current);

    if (id) {
      currentTargetPath = id;
      continue;
    }

    currentTargetPath += `.${segment}`;
  }

  return `#${currentTargetPath}`;
}

function removeTransitionAtPath(
  obj: RecastObjectExpression,
  propPath: (string | number)[],
): RecastNode {
  if (typeof propPath[0] !== 'string') {
    throw new Error(
      '`removeTransitionAtPath` expected the first segmented of the path to be a string. Unwrapping arrays happens inside it',
    );
  }

  const index = findObjectPropertyIndex(obj, propPath[0]);
  const prop = obj.properties[index];
  const unwrapped = unwrapSimplePropValue(prop);

  if (typeof propPath[1] === 'string') {
    n.ObjectExpression.assert(unwrapped);
    const removed = removeTransitionAtPath(unwrapped, propPath.slice(1));
    if (unwrapped.properties.length === 0) {
      obj.properties.splice(index, 1);
    }
    return removed;
  }

  // the next segment is the last one (and it's always a number representing the index)
  // we are at the moment at the segment before it
  if (propPath.length === 2) {
    if (n.ArrayExpression.check(unwrapped)) {
      const removed = unwrapped.elements.splice(propPath[1], 1);
      switch (unwrapped.elements.length) {
        case 0: {
          obj.properties.splice(index, 1);
          return removed as any;
        }
        case 1: {
          const prop = obj.properties[index];
          n.ObjectProperty.assert(prop);
          // array elements should be expressions and property values should be expressions too
          // so this should always be valid in practice
          prop.value = unwrapped.elements[0] as any;
          return removed as any;
        }
        default: {
          return removed as any;
        }
      }
    }

    obj.properties.splice(index, 1)[0];
    return unwrapped!;
  }

  const element = findArrayElementWithSingularFallback(unwrapped!, propPath[1]);
  if (!element || !n.ObjectExpression.check(element)) {
    throw new Error('Array element was not an object expression');
  }
  // we are using `.slice(2)` and not `.slice(1)`
  // because we need to "jump over" the unwrapped array index
  return removeTransitionAtPath(element, propPath.slice(2));
}

function getTransitionAtIndex(
  transition: RecastNode,
  index?: number,
): RecastObjectExpression {
  if (n.ArrayExpression.check(transition)) {
    return getTransitionAtIndex(transition.elements[index!]!);
  }

  if (n.ObjectExpression.check(transition)) {
    return transition;
  }

  return wrapSimpleTargetIntoObjectExpression(transition);
}

function isExternalTransition(transition: RecastObjectExpression): boolean {
  const internalProp = findObjectProperty(transition, 'internal');

  // currently it's only safe to trust this value because we only call this function after checking if the transition is an internal candidate
  if (internalProp) {
    const internalValue = unwrapSimplePropValue(internalProp);
    n.BooleanLiteral.assert(internalValue);
    return !internalValue.value;
  }
  const targetProp = findObjectProperty(transition, 'target');

  if (!targetProp) {
    return false;
  }

  const target = getTargetValue(unwrapSimplePropValue(targetProp)!);
  if (target === null) {
    throw new Error('Unexpected transition target.');
  }
  return typeof target === 'string' ? !target.startsWith('.') : false;
}

// perhaps it's a little bit weird that we operate here on the AST level
// but this way we minimize what we touch in the preexisting object expression
function minifyTransitionObjectExpression(
  transitionObject: RecastObjectExpression,
  override?: { target?: string; internal?: boolean },
): RecastNode {
  const targetProp = findObjectProperty(transitionObject, 'target');
  const targetValue = targetProp
    ? getTargetValue(unwrapSimplePropValue(targetProp)!)
    : null;

  if (
    targetProp &&
    typeof targetValue !== 'string' &&
    targetValue !== undefined
  ) {
    throw new Error('Unexpected transition target');
  }

  const internalProp = findObjectProperty(transitionObject, 'internal');
  const internalValue = internalProp
    ? getBooleanValue(unwrapSimplePropValue(internalProp)!)
    : undefined;

  if (internalProp && typeof internalValue !== 'boolean') {
    throw new Error('Unexpected transition target');
  }

  const finalTargetValue =
    override && 'target' in override
      ? override.target
      : (targetValue as string | undefined);
  const finalInternalValue =
    override?.internal ?? (internalValue as boolean | undefined);

  const seen = new Set<string | number>();

  for (let i = transitionObject.properties.length - 1; i >= 0; i--) {
    const prop = transitionObject.properties[i];

    if (n.SpreadProperty.check(prop) || n.SpreadElement.check(prop)) {
      continue;
    }
    const key = getPropertyKey(prop);
    const wasAlreadySeen = seen.has(key);
    seen.add(key);

    switch (key) {
      case 'target': {
        if (wasAlreadySeen || finalTargetValue === undefined) {
          transitionObject.properties.splice(i, 1);
          break;
        }
        // don't touch the existing defined target if it didn't change
        if (typeof override?.target === 'string') {
          n.ObjectProperty.assert(prop);
          prop.value = b.stringLiteral(override.target);
          break;
        }
        break;
      }
      case 'internal': {
        if (
          wasAlreadySeen ||
          finalTargetValue === undefined ||
          !finalTargetValue.startsWith('.')
        ) {
          transitionObject.properties.splice(i, 1);
          break;
        }
        if (finalInternalValue === true) {
          transitionObject.properties.splice(i, 1);
          break;
        }
        n.ObjectProperty.assert(prop);
        prop.value = b.booleanLiteral(false);
        break;
      }
    }
  }

  if (typeof override?.target === 'string' && !seen.has('target')) {
    transitionObject.properties.push(
      b.objectProperty(
        b.identifier('target'),
        b.stringLiteral(override.target),
      ),
    );
  }

  if (
    typeof finalTargetValue === 'string' &&
    !finalTargetValue.startsWith('.') &&
    finalInternalValue
  ) {
    transitionObject.properties.push(
      b.objectProperty(b.identifier('internal'), b.booleanLiteral(true)),
    );
  }

  if (transitionObject.properties.length === 0) {
    return b.identifier('undefined');
  }

  if (transitionObject.properties.length === 1) {
    const targetProp = findObjectProperty(transitionObject, 'target');
    return targetProp ? targetProp.value : transitionObject;
  }

  return transitionObject;
}

function wrapSimpleTargetIntoObjectExpression(
  node: RecastNode,
): RecastObjectExpression {
  if (n.ObjectExpression.check(node)) {
    return node;
  }
  return b.objectExpression([
    b.objectProperty(b.identifier('target'), node as any),
  ]);
}

function getIndexForTransitionPathAppendant(
  ast: RecastObjectExpression,
  path: (string | number)[],
) {
  // this function is supposed to ignore the last element (the index)
  // we only want check max existing index of this path in the given state object
  const pathCopy = path.slice(0, -1);
  let segment: typeof path[number] | undefined;
  let current: RecastNode = ast;

  while ((segment = pathCopy.shift())) {
    const prop =
      typeof segment === 'string'
        ? findObjectProperty(current as RecastObjectExpression, segment)
        : findArrayElementWithSingularFallback(current, segment);

    if (!prop) {
      return 0;
    }

    if (!pathCopy.length) {
      n.ObjectProperty.assert(prop);
      if (!n.ArrayExpression.check(prop.value)) {
        return 1;
      }
      return prop.value.elements.length;
    }
    let unwrapped = unwrapSimplePropValue(prop)!;
    if (typeof pathCopy[0] === 'number') {
      const index = pathCopy.shift() as number;
      if (n.ArrayExpression.check(unwrapped)) {
        current = unwrapped.elements[index]!;
        continue;
      }
    }
    current = unwrapped;
  }

  throw new Error('It should be imposible to get here');
}

type TransitionAnchors = {
  source: string[];
  target?: string[] | undefined;
};

function getTransitionExternalValue(
  previous: TransitionAnchors,
  next: TransitionAnchors,
  transition: RecastObjectExpression,
) {
  if (!next.target) {
    return false;
  }

  const isInternalCandidate = arePathsEqual(
    next.source,
    next.target.slice(0, next.source.length),
  );

  if (!isInternalCandidate) {
    return true;
  }

  if (!previous.target || !arePathsEqual(previous.source, next.source)) {
    return false;
  }

  const wasAnInternalCandidate = arePathsEqual(
    previous.source,
    previous.target.slice(0, previous.source.length),
  );

  return wasAnInternalCandidate && isExternalTransition(transition);
}

function removeState(root: RecastObjectExpression, path: string[]) {
  const parentState = getStateObjectByPath(root, path.slice(0, -1));
  const statesProp = findObjectProperty(parentState, 'states')!;
  const unwrapped = unwrapSimplePropValue(statesProp);
  n.ObjectExpression.assert(unwrapped);

  const stateIndex = findObjectPropertyIndex(unwrapped, path[path.length - 1]);

  const removed = unwrapped.properties.splice(stateIndex, 1);

  if (unwrapped.properties.length === 0) {
    const statesIndex = findObjectPropertyIndex(parentState, 'states');
    parentState.properties.splice(statesIndex, 1);
  }
  const removedState = unwrapSimplePropValue(removed[0]);
  n.ObjectExpression.assert(removedState);
  return removedState;
}

function getStatesObjectInState(stateObj: RecastObjectExpression) {
  const statesProp = findObjectProperty(stateObj, 'states');
  if (statesProp) {
    const unwrapped = unwrapSimplePropValue(statesProp);
    n.ObjectExpression.assert(unwrapped);
    return unwrapped;
  }
  const statesObj = b.objectExpression([]);
  stateObj.properties.push(b.objectProperty(b.identifier('states'), statesObj));
  return statesObj;
}

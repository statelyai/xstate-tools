import { StateNode, pathToStateValue } from 'xstate5';
import { toStatePaths } from './toStatePaths';

export const getTransitionsFromNode = (node: StateNode): string[] => {
  const transitions = new Set<string>();

  if (node.parent) {
    Object.keys(node.parent.states).forEach((key) => transitions.add(key));
    Object.values(node.parent.states).forEach((siblingNode) => {
      getMatchesStates(siblingNode).forEach((key) => {
        if (key === siblingNode.path.join('.')) {
          return;
        }
        let relativeKey = key;

        if ((node.parent?.path.length || 0) > 0) {
          relativeKey = relativeKey.replace(
            new RegExp(`^${(node.parent as StateNode).path.join('.')}\.`),
            '',
          );
        }

        transitions.add(relativeKey);
      });
    });
  }
  Object.values(node.states).map((childNode) => {
    getMatchesStates(childNode).map((key) => {
      let relativeKey = key;

      if ((childNode.parent?.path.length || 0) > 0) {
        relativeKey = relativeKey.replace(
          new RegExp(`^${(childNode.parent as StateNode).path.join('.')}\.`),
          '',
        );
      }

      transitions.add(`.${relativeKey}`);
      transitions.add(`${relativeKey}`);
    });
  });

  const machine = node.machine;

  const nodesWithId = machine.root.stateIds
    .filter((id) => !/(\.|\(machine\))/.test(id))
    .map((id) => machine.getStateNodeById(id));

  nodesWithId.forEach((idNode) => {
    getMatchesStates(idNode).forEach((match) => {
      if (idNode.id === machine.root.id) {
        transitions.add(`#${idNode.id}.${match}`);
        return;
      }

      transitions.add(
        match.replace(new RegExp(`^${idNode.path.join('.')}`), `#${idNode.id}`),
      );
    });
  });

  toStatePaths(pathToStateValue(node.path)).forEach((path) => {
    if (path.length > 1) {
      transitions.delete(path.join('.'));
    }
  });

  return Array.from(transitions);
};

export const getMatchesStates = (node: StateNode) => {
  return node.stateIds.flatMap((id) =>
    toStatePaths(pathToStateValue(node.machine.getStateNodeById(id).path)).map(
      (path) => path.join('.'),
    ),
  );
};

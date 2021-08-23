import { IntrospectMachineResult } from "./introspectMachine";

const Interface = (name: string, result: IntrospectMachineResult) => `
interface ${name}<TContext, TEvent extends EventObject> {
	${Actions(result.actions)}
	${Services(result.services)}
	${Guards(result.guards)}
};
`;

const Actions = (params: IntrospectMachineResult["actions"]) => {
  if (params.lines.length === 0) {
    return ``;
  }
  return `
actions${Required(params)}: {
	${params.lines.map(Action).join("\n")}
};
`;
};

type Line = IntrospectMachineResult["actions"]["lines"][number];

const Required = (line: { required: boolean }) => (line.required ? "" : "?");

const Action = (line: Line) => `
${line.name}${Required(line)}: ActionObject<TContext, ${Event(
  line,
)}> | ActionFunction<TContext, ${Event(line)}>;
`;

const Event = (line: Line) => {
  if (line.events.length === 0) {
    return `TEvent`;
  }
  return `${ExtractEvent(line)} extends undefined ? TEvent : ${ExtractEvent(
    line,
  )}`;
};

const ExtractEvent = (line: Line) => `
Extract<TEvent, ${line.events
  .map((event) => `{ type: '${event}' }`)
  .join(" | ")}>
`;

const Services = (params: IntrospectMachineResult["actions"]) => {
  if (params.lines.length === 0) {
    return ``;
  }
  return `
services${Required(params)}: {
	${params.lines.map(Service).join("\n")}
};
`;
};

const Service = (line: Line) => {
  if (line.events.length === 0) {
    return `${line.name}${Required(
      line,
    )}: InvokeCreator<TContext, DoneEventObject, ${InvokeCreatorThirdGeneric(
      line,
    )}> | StateMachine<any, any, any>`;
  }
  return `
${line.name}: InvokeCreator<TContext, ${Event(
    line,
  )}, ${InvokeCreatorThirdGeneric(line)}> | StateMachine<any, any, any>;
`;
};

const InvokeCreatorThirdGeneric = (line: Line) => {
  return `
Extract<
	TEvent,
	{ type: 'done.invoke.${line.name}' }
> extends { 'data': infer T } ? T : any
`;
};

const Guards = (params: IntrospectMachineResult["actions"]) => {
  if (params.lines.length === 0) {
    return ``;
  }
  return `
guards${Required(params)}: {
	${params.lines.map(Guard).join("\n")}
};
`;
};

const Guard = (line: Line) => `
${line.name}${Required(line)}: (context: TContext, event: ${Event(
  line,
)}) => boolean;
`;

const OptionsFunction = (funcName: string, interfaceName: string) => {
  return `
const ${funcName} = <TContext, TEvent extends EventObject>(options: ${interfaceName}<TContext, TEvent>) => {
  return options as Partial<MachineOptions<TContext, TEvent>>;
};
`;
};

export const makeInterfaceFromIntrospectionResult = (
  introspectionResult: IntrospectMachineResult,
) => {
  return `
import {
  MachineOptions,
  EventObject,
  ActionObject,
  ActionFunction,
  InvokeCreator,
  StateMachine,
} from 'xstate';

export ${Interface(`GeneratedMachineOptions`, introspectionResult)}

export ${OptionsFunction(`makeMachineOptions`, `GeneratedMachineOptions`)}
`;
};

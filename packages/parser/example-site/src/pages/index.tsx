import React, { useMemo, useState } from "react";
import { parseMachinesFromFile } from "@xstate/machine-extractor";

function App() {
  const [text, setText] = useState(`createMachine({ initial: 'wow' })`);
  const result = useMemo(() => {
    try {
      return parseMachinesFromFile(text).machines.map((machine) => {
        return machine.toConfig() || "could not compile";
      });
    } catch (e) {
      return "Could not parse";
    }
  }, [text]);

  return (
    <main className="w-screen h-screen bg-gray-100 flex items-center justify-center overflow-hidden">
      <div className="flex-1 h-screen p-4 overflow-y-auto flex flex-col">
        <h1 className="font-bold mb-4 text-lg">Copy XState code in here...</h1>
        <textarea
          value={text}
          className="h-full w-full p-4 font-mono bg-transparent bg-white overflow-y-auto resize-none text-sm focus:outline-none focus:ring-4"
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex-1 h-screen flex flex-col p-4">
        <h1 className="font-bold mb-4 text-lg">
          ...and see the parse result here
        </h1>
        <pre className="font-mono h-full w-full overflow-y-auto ">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </main>
  );
}

export default App;

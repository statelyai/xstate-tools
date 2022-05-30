const baseUrl = "https://xstate.js.org/docs/guides";

interface DocumentationLink {
  keyWords: string[];
  description: string;
  link: string;
}

const documentationLinks: DocumentationLink[] = [
  {
    keyWords: ["actions"],
    description: "Actions",
    link: `${baseUrl}/actions.html`,
  },
  {
    keyWords: ["context"],
    description: "Context",
    link: `${baseUrl}/context.html`,
  },
  {
    keyWords: ["initial"],
    description: "Initial Context",
    link: `${baseUrl}/context.html#initial-context`,
  },
  {
    keyWords: ["events"],
    description: "Events",
    link: `${baseUrl}/events.html`,
  },
  {
    keyWords: ["states"],
    description: "States",
    link: `${baseUrl}/states.html`,
  },
  {
    keyWords: ["tsTypes", "typegen"],
    description: "Typegen",
    link: `${baseUrl}/typescript.html#typegen`,
  },
  {
    keyWords: ["schema"],
    description: "Using TypeScript",
    link: `${baseUrl}/typescript.html#using-typescript`,
  },
];

export const getDocumentationLink = (
  word: string
): DocumentationLink | undefined => {
  return documentationLinks.find((link) => link.keyWords.includes(word));
};

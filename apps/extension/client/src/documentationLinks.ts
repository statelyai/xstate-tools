const baseUrl = "https://graph-docs.vercel.app";

interface DocumentationLink {
  keyWords: string[];
  description: string;
  link: string;
}

// TODO: Can we create these links using the frontmatter from our docs in a build step?
const documentationLinks: DocumentationLink[] = [
  {
    keyWords: ["actions"],
    description: "Actions",
    link: `${baseUrl}/actions/actions`,
  },
  {
    keyWords: ["context", "initial"],
    description: "Context",
    link: `${baseUrl}/actions/context`,
  },
  {
    keyWords: ["invoke", "services"],
    description: "Services",
    link: `${baseUrl}/services/intro`,
  },
  {
    keyWords: ["event", "events"],
    description: "Events",
    link: `${baseUrl}/basics/what-is-a-statechart#events`,
  },
  {
    keyWords: ["states"],
    description: "States",
    link: `${baseUrl}/basics/what-is-a-statechart#states`,
  },
  {
    keyWords: ["on"],
    description: "Transitions and events",
    link: `${baseUrl}/what-is-a-statechart#transitions-and-events`,
  },
  {
    keyWords: ["assign"],
    description: "Updating context",
    link: `${baseUrl}/actions/context#updating-context`,
  },
  {
    keyWords: ["tsTypes", "typegen"],
    description: "Typegen",
    link: `${baseUrl}/typescript/typegen`,
  },
  {
    keyWords: ["schema"],
    description: "TypeScript",
    link: `${baseUrl}/actions/context#type-script`,
  },
  {
    keyWords: ["guards"],
    description: "Guards",
    link: `${baseUrl}/transitions-and-choices/guards`,
  },
  {
    keyWords: ["createMachine"],
    description: "Running machines",
    link: `${baseUrl}/running-machines/intro`,
  },
  {
    keyWords: ["createTestMachine"],
    description: "Model-based testing",
    link: `${baseUrl}/model-based-testing/intro`,
  },
];

export const getDocumentationLink = (
  word: string
): DocumentationLink | undefined => {
  return documentationLinks.find((link) => link.keyWords.includes(word));
};

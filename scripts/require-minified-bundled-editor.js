const fs = require('fs/promises');

(async () => {
  await Promise.all(
    process.argv.slice(2).map(async (fileName) => {
      const content = await fs.readFile(fileName, 'utf8');
      // lines at the top might be comments or something
      const [lastLine] = content.trim().split('\n').slice(-1);

      // this is obviously rather a poor check for a minified file
      // but in practice it should usually be enough
      if (lastLine.length < 100) {
        throw new Error(
          `It looks like "${fileName}" might not be minified. \`bundled-editor\` scripts should always be minified when comitted.`,
        );
      }
    }),
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

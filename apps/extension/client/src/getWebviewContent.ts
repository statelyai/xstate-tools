import * as vscode from 'vscode';

export const getWebviewContent = (scriptsSrc: vscode.Uri, title: string) => {
  return `
          <!DOCTYPE html>
          <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${title}</title>
                  <style>
                  
                  * {
                      
                  }
                  
                  body {
                      padding: 0;
                      margin: 0;
                      box-sizing: border-box;
                      height: calc(100vh - 5px);
                      width: calc(100vw - 10px);
                      margin: auto;
                  }
                  
                  .iframe-wrapper {
                      height: 100%;
                      width: 100%;
                  }
                  #iframe {
                      height: 100%;
                      width: 100%;
					  border: none;
                  }
                  
                  </style>
              </head>
              
              <body>
                  <div class="iframe-wrapper">
                      <iframe id="iframe" title="${title} Iframe"></iframe>
                  </div>
                  <script src="${scriptsSrc}">
              </body>
          </html>
      `;
};

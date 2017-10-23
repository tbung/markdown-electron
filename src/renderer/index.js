import {ipcRenderer} from 'electron';
import chokidar from 'chokidar';
import path from 'path';

import * as mume from '@shd101wyy/mume';

// set some style values for the app div
// TODO: Export to style.css
const appDiv = document.getElementById('app');
appDiv.style.width = '100vw';
appDiv.style.height = '100vh';
appDiv.style.margin = '0';
appDiv.style.padding = '0';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

// Webview for markdown preview.
const webview = document.createElement('webview');
webview.style.height = '100%';
webview.style.width = '100%';
webview.style.border = 'none';
webview.style.display = 'inline-flex';

webview.src = `file://${app.getAppPath()}/static/loading.html`;

appDiv.appendChild(webview);


/**
 * This method renders a markdown file in the webview created above
 * @param {string} path - The path of the file to load
 */
async function renderMd(path) {
  await mume.init();
  const info = await mume.utility.tempOpen({prefix: 'mpe_preview',
    suffix: '.html'});
  let htmlFilePath = info.path;

  const engine = new mume.MarkdownEngine({
    filePath: path,
    config: {
      previewTheme: 'github-light.css',
      codeBlockTheme: 'default.css',
      printBackground: true,
      mathRenderingOption: 'MathJax',
    },
  });

  const html = await engine.generateHTMLTemplateForPreview({
    head: '',
    body: ' ',
  });
  await mume.utility.writeFile(htmlFilePath, html, {encoding: 'utf-8'});

  if (webview.getURL() === htmlFilePath) {
    webview.reload();
  } else {
    webview.loadURL(mume.utility.addFileProtocol(htmlFilePath));
  }
}

// emitted when the main process wants us to open and display a file
ipcRenderer.on('file-opened', (event, file, content) => {
  renderMd(file);

  let watcher = chokidar.watch(file, {
    peristent: true,
  });

  watcher.on('change', (file) => {
    renderMd(file);
  });
});

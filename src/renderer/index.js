import {ipcRenderer} from 'electron';
import chokidar from 'chokidar';
import path from 'path';

import * as mume from '@shd101wyy/mume';

const appDiv = document.getElementById('app')
appDiv.style.width = '100vw';
appDiv.style.height = '100vh';
appDiv.style.margin = '0';
appDiv.style.padding = '0';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
// Webview for markdown preview.
// Please note that the webview will load
// the controller script at:
// https://github.com/shd101wyy/mume/blob/master/src/webview.ts
const webview = document.createElement('webview');
webview.style.height = '100%';
webview.style.width = '100%';
webview.style.border = 'none';
webview.style.display = 'inline-flex';
// webview.style.overflow = 'hidden';

const index = path.join(__dirname, "..", "static", "loading.html");
webview.src = `file://${index}`;
// webview.preload = mume.utility.addFileProtocol(path.resolve(
//   mume.utility.extensionDirectoryPath,
//   './dependencies/electron-webview/preload.js'));

appDiv.appendChild(webview);

// let _webviewDOMReady = false;
// webview.addEventListener('dom-ready', () => {
//   _webviewDOMReady = true;
// });

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

ipcRenderer.on('file-opened', (event, file, content) => {
  renderMd(file);

  let watcher = chokidar.watch(file, {
    peristent: true,
  });

  watcher.on('change', (file) => {
    renderMd(file);
  });
});

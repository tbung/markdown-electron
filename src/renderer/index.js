import {ipcRenderer, remote} from 'electron';
import chokidar from 'chokidar';

import * as mume from '@shd101wyy/mume';


// Webview for markdown preview.
const webview = document.getElementById('md-render');

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
    config: mume.utility.getExtensionConfig(),
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

let curFile;
let scrollPos = 0;

let watcher = new chokidar.FSWatcher({
  usePolling: true,
});

watcher.on('add', (f) => {
  scrollPos = 0;
  renderMd(f);
});

watcher.on('change', (f) => {
  webview.executeJavaScript(
    `document.getElementsByClassName('mume markdown-preview')[1].scrollTop`,
    false,
    (n) => {
      scrollPos = n;
      console.log(n);
    }
  );

  renderMd(f);
});

webview.addEventListener('dom-ready', () => {
  webview.executeJavaScript(
    `document.getElementsByClassName('mume markdown-preview')[1].scrollTop =
    ${scrollPos}`
  );
});

// emitted when the main process wants us to open and display a file
ipcRenderer.on('file-opened', (event, file) => {
  if (curFile) {
    watcher.unwatch(curFile);
  }
  curFile = file;
  watcher.add(file);
});


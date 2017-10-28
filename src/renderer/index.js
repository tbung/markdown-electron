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

let watcher = new chokidar.FSWatcher({
  usePolling: true,
});

watcher.on('add', (f) => {
  renderMd(f);
});

watcher.on('change', (f) => {
  renderMd(f);
});

// emitted when the main process wants us to open and display a file
ipcRenderer.on('file-opened', (event, file) => {
  if (curFile) {
    watcher.unwatch(curFile);
  }
  curFile = file;
  watcher.add(file);
});


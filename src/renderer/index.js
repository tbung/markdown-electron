import {ipcRenderer} from 'electron';
import chokidar from 'chokidar';
import path from 'path';

import * as mume from '@shd101wyy/mume';

mume.init();
const NODE_ENV = require('electron').remote.process.env.NODE_ENV;
console.log(NODE_ENV);

// Webview for markdown preview.
const webview = document.getElementById('md-render');

// Loads communication methods: webview <-> renderer process
webview.preload = mume.utility.addFileProtocol(path.resolve(
  mume.utility.extensionDirectoryPath,
  './dependencies/electron-webview/preload.js'
));

// Current mume engine, each new file gets a new engine
let engine;

// The currently viewed file
// TODO: find better solution than global reference
let curFile;

// The file watcher for the current file
let watcher = new chokidar.FSWatcher({
  usePolling: true,
});


/**
 * This method renders a markdown file in the webview created above
 * @param {string} path - The path of the file to load
 */
async function renderMd(path) {
  await mume.init();
  const info = await mume.utility.tempOpen({prefix: 'mpe_preview',
    suffix: '.html'});
  let htmlFilePath = info.path;


  let html = await engine.generateHTMLTemplateForPreview({
  });
  html = html.replace(
        /<script type=\"text\/javascript\"[^><]*?contextmenu.*?><\/script>/g,
        ''
  );
  await mume.utility.writeFile(htmlFilePath, html, {encoding: 'utf-8'});

  if (webview.getURL() === htmlFilePath) {
    webview.reload();
  } else {
    webview.loadURL(mume.utility.addFileProtocol(htmlFilePath));
  }
}


watcher.on('add', (f) => {
  engine = new mume.MarkdownEngine({
    filePath: f,
    config: mume.utility.getExtensionConfig(),
  });
  console.log(mume.utility.getExtensionConfig());
  renderMd(f);
});

watcher.on('change', (f) => {
  let scrollPos = 0;
  webview.executeJavaScript(
    `document.getElementsByClassName('mume markdown-preview')[1].scrollTop`,
    false,
    (n) => {
      scrollPos = n;
      console.log(n);
    }
  );

  engine.clearCaches();

  renderMd(f);

  // Everytime the dom is ready we scroll to the saved position
  webview.addEventListener('dom-ready', () => {
    // webview.openDevTools();
    webview.executeJavaScript(
      `document.getElementsByClassName('mume markdown-preview')[1].scrollTop =
    ${scrollPos}`
    );
  });
});


// Handle mume export menu requests
webview.addEventListener('ipc-message', (event) => {
  console.log(event);
  const command = event.args[0].data['command'];
  if (command === 'chromeExport') {
    console.log('It werks!');
    engine.chromeExport({filetype: event.args[0].data['args'][1]});
  }
});

// emitted when the main process wants us to open and display a file
ipcRenderer.on('file-opened', (event, file) => {
  if (curFile) {
    watcher.unwatch(curFile);
  }
  curFile = file;
  watcher.add(file);
});

ipcRenderer.on('exportPDF', (event, file) => {
    engine.chromeExport({
        filetype: 'pdf',
    });
});

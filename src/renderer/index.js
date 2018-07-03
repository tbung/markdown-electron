import {ipcRenderer} from 'electron';
import chokidar from 'chokidar';

import * as path from 'path';
import * as fs from 'fs';

import * as mume from '@shd101wyy/mume';

mume.init();
const NODE_ENV = require('electron').remote.process.env.NODE_ENV;
console.log(NODE_ENV);

// Webview for markdown preview.
const webview = document.getElementById('md-render');

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

// emitted when the main process wants us to open and display a file
ipcRenderer.on('file-opened', (event, file) => {
  if (curFile) {
    watcher.unwatch(curFile);
  }
  curFile = file;
  watcher.add(file);
});

async function exportPDF() {
  const basename = path.basename(curFile, '.md');
  const basepath = path.join(path.dirname(curFile), basename);
  const pdfPath = `${basepath}.pdf`;

  let webviewPrint = document.getElementById('md-render-print');

  const inputString = await mume.utility.readFile(engine.filePath, {
    encoding: 'utf-8',
  });
  let html;
  let yamlConfig;
  ({html, yamlConfig} = await engine.parseMD(inputString, {
    useRelativeFilePath: false,
    hideFrontMatter: true,
    isForPreview: false,
    runAllCodeChunks: false,
  }));

  html = await engine.generateHTMLTemplateForExport(html, yamlConfig, {
    isForPrint: true,
    isForPrince: false,
    embedLocalImages: false,
    offline: true,
  });

  const info = await mume.utility.tempOpen({prefix: 'mume', suffix: '.html'});
  await mume.utility.writeFile(info.path, html);

  webviewPrint.loadURL(mume.utility.addFileProtocol(info.path));

  webviewPrint.addEventListener('dom-ready', () => {
    webviewPrint.printToPDF(
      {
        pageSize: 'A4',
        printBackground: false,
        fitToPageEnabled: true,
      },
      (error, data) => {
        if (error) throw error;

        fs.writeFile(pdfPath, data, error_fs => {
          console.log('PDF exported');
        });
    });
    webviewPrint.loadURL('about:blank');
    webviewPrint = null;
  });
};

ipcRenderer.on('exportPDF', (event, file) => {
  exportPDF();
});

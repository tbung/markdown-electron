import {ipcRenderer} from 'electron';
import chokidar from 'chokidar';
import path from 'path';

import * as mume from '@shd101wyy/mume';

mume.init();
const NODE_ENV = require('electron').remote.process.env.NODE_ENV;
console.log(NODE_ENV);
const appPath = NODE_ENV === 'production' ?
  path.join(require('electron').remote.app.getAppPath(), '..') :
  require('electron').remote.app.getAppPath();
const extensionDirectoryPath = path.join(
  appPath,
  'node_modules',
  '@shd101wyy',
  'mume'
);
const pdf = require('@shd101wyy/mume/dependencies/node-html-pdf/index.js');

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


  const html = await engine.generateHTMLTemplateForPreview({
  });
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
  if (command === 'phantomjsExport') {
    phantomjsExport(engine, {fileType: 'pdf', openFileAfterGeneration: true});
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

/**
 * Method compied from @shd101wyy/mume because I do not know how else to change
 * the script path
 *
 * @param {MarkdownEngine} engine - the markdown engine to print to PDF
 *
 * @return {Promise}
 */
async function phantomjsExport(engine, {
  fileType='pdf',
  runAllCodeChunks=false,
  openFileAfterGeneration=false,
}) {
  const inputString = await mume.utility.readFile(
    engine.filePath,
    {encoding: 'utf-8'}
  );
  let {html, yamlConfig} = await engine.parseMD(
    inputString,
    {
      useRelativeFilePath: false,
      hideFrontMatter: true,
      isForPreview: false,
      runAllCodeChunks,
    }
  );
  let dest = engine.filePath;
  let extname = path.extname(dest);
  dest = dest.replace(new RegExp(extname + '$'), '.' + fileType);

  html = await engine.generateHTMLTemplateForExport(html, yamlConfig, {
    isForPrint: true,
    isForPrince: false,
    embedLocalImages: false,
    offline: true,
    phantomjsType: fileType,
  });

  // TODO: phantomjs reveal.js export directly.
  if (yamlConfig['isPresentationMode']) { // reveal.js presentation
    const info = await mume.utility.tempOpen({prefix: 'mume', suffix: '.html'});
    await mume.utility.writeFile(info.fd, html);
    const url = 'file:///' + info.path + '?print-pdf';
    return url;
  }

  const phantomjsConfig = Object.assign({
    type: fileType,
    border: '1cm',
    quality: '75',
    script: path.join(
      extensionDirectoryPath,
      './dependencies/phantomjs/pdf_a4_portrait.js'
    ),
  },
    await mume.utility.getPhantomjsConfig(),
    yamlConfig['phantomjs'] || yamlConfig['phantom'] || {}
  );
  if (!phantomjsConfig['phantomPath']) {
    phantomjsConfig['phantomPath'] = engine.config.phantomPath;
  }

  return await new Promise((resolve, reject)=> {
    try {
      pdf.create(html, phantomjsConfig)
        .toFile(dest, (error, res)=> {
          if (error) {
            return reject(error);
          } else {
            if (openFileAfterGeneration) mume.utility.openFile(dest);
            return resolve(dest);
          }
        });
    } catch (error) {
      let errorMessage = error.toString();
      if (errorMessage.indexOf('Error: write EPIPE') >= 0) {
        errorMessage = `"phantomjs" is required to be installed.`;
      }
      return reject(errorMessage);
    }
  });
}

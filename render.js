const electron = require('electron');
const ipc = electron.ipcRenderer;

const mume = require('@shd101wyy/mume');

// Webview for markdown preview.
// Please note that the webview will load
// the controller script at:
// https://github.com/shd101wyy/mume/blob/master/src/webview.ts
webview = document.createElement('webview')
webview.style.width = '100%'
webview.style.height = '100%'
webview.style.border = 'none'
webview.src = './loading.html'
document.body.appendChild(webview)

webview.addEventListener('dom-ready', ()=> {_webviewDOMReady = true})

async function renderMd(path) {
    await mume.init();
    const info = await mume.utility.tempOpen({prefix: 'mpe_preview', suffix: '.html'})
    let htmlFilePath = info.path

    const engine = new mume.MarkdownEngine({
        filePath: path,
        config: {
            previewTheme: "github-light.css",
            codeBlockTheme: "default.css",  
            printBackground: true,
            mathRenderingOption: "MathJax"
        }
    })

    const html = await engine.generateHTMLTemplateForPreview({
        head: '',
        body: ' ',
    })
    await mume.utility.writeFile(htmlFilePath, html, {encoding: 'utf-8'})

    // await waitUtilWebviewDOMReady()
    // document.body.innerHTML = html;
    if (webview.getURL() === htmlFilePath) {
      webview.reload()
    } else {
      webview.loadURL(mume.utility.addFileProtocol(htmlFilePath))
    }
}

// async function waitUtilWebviewDOMReady() {
//     return new Promise ((resolve, reject) => {
//         if (_webviewDOMReady) return
//         while (true) {
//             await mume.utility.sleep(500)
//             if (_webviewDOMReady) return
//         }
//     })
// }

ipc.on('file-opened', (event, file, content) => {
    renderMd(file);
})

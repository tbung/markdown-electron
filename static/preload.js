const {ipcRenderer} = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('webview-disable-external-navigate', true);
});

window.onbeforeunload = function() {
  ipcRenderer.send('webview-disable-external-navigate', false);
};

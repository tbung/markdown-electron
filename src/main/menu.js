import {dialog} from 'electron';

/**
 * Show openFile dialog and send the opend file to the renderer process
 * @param {BrowserWindow} win - the currently active window
 */
function openFile(win) {
  const files = dialog.showOpenDialog(win, {
    filters: [
      {name: 'Markdown Files', extensions: ['md']},
      {name: 'All Files', extensions: ['*']},
    ],
    properties: ['openFile'],
  });

  if (!files) return;

  const file = files[0];
  win.webContents.send('file-opened', file);
  win.setTitle(file);
}

export function menuTemplate(win) {
  return [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openFile(win);
          },
        },
        {
          label: 'Export PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            win.webContents.send('exportPDF');
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        },
      ],
    },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin'
          ? 'Alt+Command+I'
          : 'Ctrl+Shift+I',
          click: () => {
            win.webContents.toggleDevTools();
          },
        },
      ],
    },
  ];
};
// if (process.platform === 'darwin') {
//     const name = app.getName()
//     template.unshift({
//         label: name,
//         submenu: [
//             {
//                 label: 'About ' + name,
//                 role: 'about'
//             },
//             {
//                 type: 'separator'
//             },
//             {
//                 label: 'Services',
//                 role: 'services',
//                 submenu: []
//             },
//             {
//                 type: 'separator'
//             },
//             {
//                 label: 'Hide ' + name,
//                 accelerator: 'Command+H',
//                 role: 'hide'
//             },
//             {
//                 label: 'Hide Others',
//                 accelerator: 'Command+Alt+H',
//                 role: 'hideothers'
//             },
//             {
//                 label: 'Show All',
//                 role: 'unhide'
//             },
//             {
//                 type: 'separator'
//             },
//             {
//                 label: 'Quit',
//                 accelerator: 'Command+Q',
//                 click () { app.quit() }
//             }
//         ]
//     })
// }

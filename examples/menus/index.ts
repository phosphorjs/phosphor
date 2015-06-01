/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import connect = phosphor.core.connect;

import Menu = phosphor.widgets.Menu;
import MenuBar = phosphor.widgets.MenuBar;
import MenuItem = phosphor.widgets.MenuItem;


var handler = {
  cut: () => console.log('Cut'),
  copy: () => console.log('Copy'),
  paste: () => console.log('Paste'),
  newTab: () => console.log('New Tab'),
  close: () => console.log('Close'),
  closeTab: () => console.log('Close Tab'),
  undo: () => console.log('Undo'),
  repeat: () => console.log('Repeat'),
  toggleSave: (sender: MenuItem, checked: boolean) => console.log('Save on exit:', checked),
};


function main(): void {
  var copyItem = new MenuItem({
    text: 'Copy',
    mnemonic: 'c',
    shortcut: 'Ctrl+C',
    className: 'copy',
  });

  var cutItem = new MenuItem({
    text: 'Cut',
    mnemonic: 'x',
    shortcut: 'Ctrl+X',
    className: 'cut',
  });

  var pasteItem = new MenuItem({
    text: 'Paste',
    mnemonic: 'v',
    shortcut: 'Ctrl+V',
    className: 'paste',
  });

  var newTabItem = new MenuItem({
    text: 'New Tab',
    mnemonic: 'n',
  });

  var closeTabItem = new MenuItem({
    text: 'Close Tab',
    mnemonic: 'c',
  });

  connect(copyItem, MenuItem.triggered, handler, handler.copy);
  connect(cutItem, MenuItem.triggered, handler, handler.cut);
  connect(pasteItem, MenuItem.triggered, handler, handler.paste);
  connect(newTabItem, MenuItem.triggered, handler, handler.newTab);
  connect(closeTabItem, MenuItem.triggered, handler, handler.closeTab);

  var saveOnExitItem = new MenuItem({
    text: 'Save On Exit',
    type: 'check',
    checked: true,
    mnemonic: 's',
  });

  connect(saveOnExitItem, MenuItem.toggled, handler, handler.toggleSave);

  var taskMgrItem = new MenuItem({
    text: 'Task Manager',
    enabled: false,
  });

  var moreItem = new MenuItem({
    text: 'More...',
    submenu: new Menu([
      new MenuItem({ text: 'One' }),
      new MenuItem({ text: 'Two' }),
      new MenuItem({ text: 'Three' }),
      new MenuItem({ text: 'Four' }),
      new MenuItem({ text: 'Five' }),
    ]),
  });

  var closeItem = new MenuItem({
    text: 'Close',
    className: 'close',
  });

  connect(closeItem, MenuItem.triggered, handler, handler.close);

  function separator(): MenuItem {
    return new MenuItem({ type: 'separator' });
  }

  var newFileItem = new MenuItem({
    text: 'New File',
    shortcut: 'Ctrl+N',
  });

  var openFileItem = new MenuItem({
    text: 'Open File',
    shortcut: 'Ctrl+O',
  });

  var saveFileItem = new MenuItem({
    text: 'Save File',
    shortcut: 'Ctrl+S',
  });

  var saveAsItem = new MenuItem({
    text: 'Save As...',
    shortcut: 'Ctrl+Shift+S',
  });

  var closeFileItem = new MenuItem({
    text: 'Close File',
    shortcut: 'Ctrl+W',
  });

  var closeAllItem = new MenuItem({ text: 'Close All Files' });

  var exitItem = new MenuItem({ text: 'Exit' });

  var fileItem = new MenuItem({
    text: 'File',
    submenu: new Menu([
      newFileItem,
      openFileItem,
      saveFileItem,
      saveAsItem,
      separator(),
      closeFileItem,
      closeAllItem,
      separator(),
      moreItem,
      separator(),
      exitItem,
    ]),
  });

  var undoItem = new MenuItem({
    text: 'Undo',
    shortcut: 'Ctrl+Z',
    className: 'undo',
  });

  var repeatItem = new MenuItem({
    text: 'Repeat',
    shortcut: 'Ctrl+Y',
    className: 'repeat',
  });

  connect(undoItem, MenuItem.triggered, handler, handler.undo);
  connect(repeatItem, MenuItem.triggered, handler, handler.repeat);

  var editItem = new MenuItem({
    text: 'Edit',
    submenu: new Menu([
      undoItem,
      repeatItem,
      separator(),
      copyItem,
      cutItem,
      pasteItem,
    ]),
  });

  var findItem = new MenuItem({
    text: 'Find...',
    shortcut: 'Ctrl+F',
  });

  var findNextItem = new MenuItem({
    text: 'Find Next',
    shortcut: 'F3',
  });

  var findPrevItem = new MenuItem({
    text: 'Find Previous',
    shortcut: 'Shift+F3',
  });

  var replaceItem = new MenuItem({
    text: 'Replace...',
    shortcut: 'Ctrl+H',
  });

  var replaceNextItem = new MenuItem({
    text: 'Replace Next',
    shortcut: 'Ctrl+Shift+H',
  });

  var fmItem = new MenuItem({
    text: 'Find',
    submenu: new Menu([
      findItem,
      findNextItem,
      findPrevItem,
      separator(),
      replaceItem,
      replaceNextItem,
    ]),
  });

  var viewItem = new MenuItem({
    text: 'View',
    enabled: false,
  });

  var helpItem = new MenuItem({
    text: 'Help',
    submenu: new Menu([
      new MenuItem({ text: 'Documentation' }),
      new MenuItem({ text: 'About' }),
    ]),
  });

  var contextMenu = new Menu([
    copyItem,
    cutItem,
    pasteItem,
    separator(),
    newTabItem,
    closeTabItem,
    saveOnExitItem,
    separator(),
    taskMgrItem,
    separator(),
    moreItem,
    separator(),
    closeItem,
  ]);

  var menubar = new MenuBar([
    fileItem,
    editItem,
    fmItem,
    viewItem,
    separator(),
    helpItem,
  ]);

  menubar.attach(document.getElementById('container'));

  document.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    var x = event.clientX;
    var y = event.clientY;
    contextMenu.popup(x, y);
  });
}


window.onload = main;

} // module example

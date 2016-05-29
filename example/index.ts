/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  commands
} from '../lib/ui/commands';

import {
  keymap
} from '../lib/ui/keymap';

import {
  Menu, MenuItem
} from '../lib/ui/menu';

import {
  MenuBar
} from '../lib/ui/menubar';

import {
  Widget
} from '../lib/ui/widget';

import '../styles/base.css';

import './index.css';


function createMenu(): Menu {
  let sub1 = new Menu();
  sub1.title.text = 'More...';
  sub1.addItem({ command: 'example:one' });
  sub1.addItem({ command: 'example:two' });
  sub1.addItem({ command: 'example:three' });
  sub1.addItem({ command: 'example:four' });

  let sub2 = new Menu();
  sub2.title.text = 'More...';
  sub2.addItem({ command: 'example:one' });
  sub2.addItem({ command: 'example:two' });
  sub2.addItem({ command: 'example:three' });
  sub2.addItem({ command: 'example:four' });
  sub2.addItem({ type: 'submenu', menu: sub1 });

  let root = new Menu();
  root.addItem({ command: 'example:copy' });
  root.addItem({ command: 'example:cut' });
  root.addItem({ command: 'example:paste' });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:new-tab' });
  root.addItem({ command: 'example:close-tab' });
  root.addItem({ command: 'example:save-on-exit' });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example: open-task-manager' });
  root.addItem({ type: 'separator' });
  root.addItem({ type: 'submenu', menu: sub2 });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:close' });

  return root;
}


function main(): void {

  commands.addCommand('example:cut', {
    label: 'Cut',
    icon: 'fa fa-cut',
    execute: () => {
      console.log('Cut');
    }
  });

  commands.addCommand('example:copy', {
    label: 'Copy',
    icon: 'fa fa-copy',
    execute: () => {
      console.log('Copy');
    }
  });

  commands.addCommand('example:paste', {
    label: 'Paste',
    icon: 'fa fa-paste',
    execute: () => {
      console.log('Paste');
    }
  });

  commands.addCommand('example:new-tab', {
    label: 'New Tab',
    execute: () => {
      console.log('New Tab');
    }
  });

  commands.addCommand('example:close-tab', {
    label: 'Close Tab',
    execute: () => {
      console.log('Close Tab');
    }
  });

  commands.addCommand('example:save-on-exit', {
    label: 'Save on Exit',
    execute: () => {
      console.log('Save on Exit');
    }
  });

  commands.addCommand('example:open-task-manager', {
    label: 'Task Manager',
    isEnabled: () => false,
    execute: () => { }
  });

  commands.addCommand('example:close', {
    label: 'Close',
    icon: 'fa fa-close',
    execute: () => {
      console.log('Close');
    }
  });

  commands.addCommand('example:one', {
    label: 'One',
    execute: () => {
      console.log('One');
    }
  });

  commands.addCommand('example:two', {
    label: 'Two',
    execute: () => {
      console.log('Two');
    }
  });

  commands.addCommand('example:three', {
    label: 'Three',
    execute: () => {
      console.log('Three');
    }
  });

  commands.addCommand('example:four', {
    label: 'Four',
    execute: () => {
      console.log('Four');
    }
  });

  keymap.addBinding({
    keys: 'Accel-X',
    selector: 'body',
    command: 'example:cut'
  });

  keymap.addBinding({
    keys: 'Accel-C',
    selector: 'body',
    command: 'example:copy'
  });

  keymap.addBinding({
    keys: 'Accel-V',
    selector: 'body',
    command: 'example:paste'
  });

  keymap.addBinding({
    keys: 'Ctrl-Shift-N',
    selector: 'body',
    command: 'example:new-tab'
  });

  let menu1 = createMenu();
  menu1.title.text = 'File';

  let menu2 = createMenu();
  menu2.title.text = 'Edit';

  let menu3 = createMenu();
  menu3.title.text = 'View';

  let ctxt = createMenu();

  let bar = new MenuBar();
  bar.addMenu(menu1);
  bar.addMenu(menu2);
  bar.addMenu(menu3);

  document.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    ctxt.open(event.clientX, event.clientY);
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    keymap.processKeydownEvent(event);
  });

  Widget.attach(bar, document.body);
}


window.onload = main;

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message
} from '../lib/core/messaging';

import {
  BoxPanel
} from '../lib/ui/boxpanel';

import {
  CommandPalette
} from '../lib/ui/commandpalette';

import {
  CommandRegistry
} from '../lib/ui/commandregistry';

import {
  DockPanel
} from '../lib/ui/dockpanel';

import {
  Keymap
} from '../lib/ui/keymap';

import {
  Menu
} from '../lib/ui/menu';

import {
  MenuBar
} from '../lib/ui/menubar';

import {
  Widget, WidgetFlag
} from '../lib/ui/widget';

import '../styles/base.css';

import './index.css';


const commands = new CommandRegistry();
const keymap = new Keymap({ commands });


function createMenu(): Menu {
  let sub1 = new Menu({ commands, keymap });
  sub1.title.label = 'More...';
  sub1.title.mnemonic = 0;
  sub1.addItem({ command: 'example:one' });
  sub1.addItem({ command: 'example:two' });
  sub1.addItem({ command: 'example:three' });
  sub1.addItem({ command: 'example:four' });

  let sub2 = new Menu({ commands, keymap });
  sub2.title.label = 'More...';
  sub2.title.mnemonic = 0;
  sub2.addItem({ command: 'example:one' });
  sub2.addItem({ command: 'example:two' });
  sub2.addItem({ command: 'example:three' });
  sub2.addItem({ command: 'example:four' });
  sub2.addItem({ type: 'submenu', menu: sub1 });

  let root = new Menu({ commands, keymap });
  root.addItem({ command: 'example:copy' });
  root.addItem({ command: 'example:cut' });
  root.addItem({ command: 'example:paste' });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:new-tab' });
  root.addItem({ command: 'example:close-tab' });
  root.addItem({ command: 'example:save-on-exit' });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:open-task-manager' });
  root.addItem({ type: 'separator' });
  root.addItem({ type: 'submenu', menu: sub2 });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:close' });

  return root;
}


class ContentWidget extends Widget {

  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let input = document.createElement('input');
    input.placeholder = 'Placeholder...';
    node.appendChild(input);
    return node;
  }

  constructor(name: string) {
    super({ node: ContentWidget.createNode() });
    this.setFlag(WidgetFlag.DisallowLayout);
    this.addClass('content');
    this.addClass(name.toLowerCase());
    this.title.label = name;
    this.title.closable = true;
    this.title.caption = `Long description for: ${name}`;
  }

  get inputNode(): HTMLInputElement {
    return this.node.firstChild as HTMLInputElement;
  }

  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) this.inputNode.focus();
  }
}


function main(): void {

  commands.addCommand('example:cut', {
    label: 'Cut',
    mnemonic: 1,
    icon: 'fa fa-cut',
    execute: () => {
      console.log('Cut');
    }
  });

  commands.addCommand('example:copy', {
    label: 'Copy',
    mnemonic: 0,
    icon: 'fa fa-copy',
    execute: () => {
      console.log('Copy');
    }
  });

  commands.addCommand('example:paste', {
    label: 'Paste',
    mnemonic: 0,
    icon: 'fa fa-paste',
    execute: () => {
      console.log('Paste');
    }
  });

  commands.addCommand('example:new-tab', {
    label: 'New Tab',
    mnemonic: 0,
    caption: 'Open a new tab',
    execute: () => {
      console.log('New Tab');
    }
  });

  commands.addCommand('example:close-tab', {
    label: 'Close Tab',
    mnemonic: 2,
    caption: 'Close the current tab',
    execute: () => {
      console.log('Close Tab');
    }
  });

  commands.addCommand('example:save-on-exit', {
    label: 'Save on Exit',
    mnemonic: 0,
    caption: 'Toggle the save on exit flag',
    execute: () => {
      console.log('Save on Exit');
    }
  });

  commands.addCommand('example:open-task-manager', {
    label: 'Task Manager',
    mnemonic: 5,
    isEnabled: () => false,
    execute: () => { }
  });

  commands.addCommand('example:close', {
    label: 'Close',
    mnemonic: 0,
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
    keys: ['Accel X'],
    selector: 'body',
    command: 'example:cut'
  });

  keymap.addBinding({
    keys: ['Accel C'],
    selector: 'body',
    command: 'example:copy'
  });

  keymap.addBinding({
    keys: ['Accel V'],
    selector: 'body',
    command: 'example:paste'
  });

  keymap.addBinding({
    keys: ['Accel J', 'Accel J'],
    selector: 'body',
    command: 'example:new-tab'
  });

  keymap.addBinding({
    keys: ['Accel M'],
    selector: 'body',
    command: 'example:open-task-manager'
  });

  let menu1 = createMenu();
  menu1.title.label = 'File';
  menu1.title.mnemonic = 0;

  let menu2 = createMenu();
  menu2.title.label = 'Edit';
  menu2.title.mnemonic = 0;

  let menu3 = createMenu();
  menu3.title.label = 'View';
  menu3.title.mnemonic = 0;

  let ctxt = createMenu();

  let bar = new MenuBar({ keymap });
  bar.addMenu(menu1);
  bar.addMenu(menu2);
  bar.addMenu(menu3);

  let palette = new CommandPalette({ commands, keymap });
  palette.addItem({ command: 'example:cut', category: 'edit' });
  palette.addItem({ command: 'example:copy', category: 'edit' });
  palette.addItem({ command: 'example:paste', category: 'edit' });
  palette.addItem({ command: 'example:one', category: 'number' });
  palette.addItem({ command: 'example:two', category: 'number' });
  palette.addItem({ command: 'example:three', category: 'number' });
  palette.addItem({ command: 'example:four', category: 'number' });
  palette.addItem({ command: 'example:new-tab' });
  palette.addItem({ command: 'example:close-tab' });
  palette.addItem({ command: 'example:save-on-exit' });
  palette.addItem({ command: 'example:open-task-manager' });
  palette.addItem({ command: 'example:close' });

  document.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    ctxt.open(event.clientX, event.clientY);
    console.log('ctxt menu');
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!event.ctrlKey && !event.shiftKey && !event.metaKey && event.keyCode === 18) {
      event.preventDefault();
      event.stopPropagation();
      bar.activeIndex = 0;
      bar.activate();
    } else {
      keymap.processKeydownEvent(event);
    }
  });

  let r1 = new ContentWidget('Red');
  let b1 = new ContentWidget('Blue');
  let g1 = new ContentWidget('Green');
  let y1 = new ContentWidget('Yellow');

  let r2 = new ContentWidget('Red');
  let b2 = new ContentWidget('Blue');
  let g2 = new ContentWidget('Green');
  let y2 = new ContentWidget('Yellow');

  let dock = new DockPanel();
  dock.addWidget(r1);
  dock.addWidget(b1, { mode: 'split-right', ref: r1 });
  dock.addWidget(y1, { mode: 'split-bottom', ref: b1 });
  dock.addWidget(g1, { mode: 'split-left', ref: y1 });
  dock.addWidget(r2, { ref: b1 });


  //dock.currentChanged.connect((s, a) => { console.log(a); });

  BoxPanel.setStretch(dock, 1);

  let main = new BoxPanel({ direction: 'left-to-right' });
  main.id = 'main';
  main.addWidget(palette);
  main.addWidget(dock);

  window.onresize = () => { main.update(); };

  Widget.attach(bar, document.body);
  Widget.attach(main, document.body);

  (window as any).dock = dock;
}


window.onload = main;

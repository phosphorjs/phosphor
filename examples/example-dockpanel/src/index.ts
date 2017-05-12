/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import 'es6-promise/auto';  // polyfill Promise on IE

import {
  CommandRegistry
} from '@phosphor/commands';

import {
  Message
} from '@phosphor/messaging';

import {
  BoxPanel, CommandPalette, ContextMenu, DockPanel, Menu, MenuBar, Widget
} from '@phosphor/widgets';

import '../style/index.css';


const commands = new CommandRegistry();


function createMenu(): Menu {
  let sub1 = new Menu({ commands });
  sub1.title.label = 'More...';
  sub1.title.mnemonic = 0;
  sub1.addItem({ command: 'example:one' });
  sub1.addItem({ command: 'example:two' });
  sub1.addItem({ command: 'example:three' });
  sub1.addItem({ command: 'example:four' });

  let sub2 = new Menu({ commands });
  sub2.title.label = 'More...';
  sub2.title.mnemonic = 0;
  sub2.addItem({ command: 'example:one' });
  sub2.addItem({ command: 'example:two' });
  sub2.addItem({ command: 'example:three' });
  sub2.addItem({ command: 'example:four' });
  sub2.addItem({ type: 'submenu', submenu: sub1 });

  let root = new Menu({ commands });
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
  root.addItem({ type: 'submenu', submenu: sub2 });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:close' });

  return root;
}


class ContentWidget extends Widget {

  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let content = document.createElement('div');
    let input = document.createElement('input');
    input.placeholder = 'Placeholder...';
    content.appendChild(input);
    node.appendChild(content);
    return node;
  }

  constructor(name: string) {
    super({ node: ContentWidget.createNode() });
    this.setFlag(Widget.Flag.DisallowLayout);
    this.addClass('content');
    this.addClass(name.toLowerCase());
    this.title.label = name;
    this.title.closable = true;
    this.title.caption = `Long description for: ${name}`;
  }

  get inputNode(): HTMLInputElement {
    return this.node.getElementsByTagName('input')[0] as HTMLInputElement;
  }

  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      this.inputNode.focus();
    }
  }
}


function main(): void {

  commands.addCommand('example:cut', {
    label: 'Cut',
    mnemonic: 1,
    iconClass: 'fa fa-cut',
    execute: () => {
      console.log('Cut');
    }
  });

  commands.addCommand('example:copy', {
    label: 'Copy File',
    mnemonic: 0,
    iconClass: 'fa fa-copy',
    execute: () => {
      console.log('Copy');
    }
  });

  commands.addCommand('example:paste', {
    label: 'Paste',
    mnemonic: 0,
    iconClass: 'fa fa-paste',
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
    iconClass: 'fa fa-close',
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

  commands.addCommand('example:black', {
    label: 'Black',
    execute: () => {
      console.log('Black');
    }
  });

  commands.addCommand('example:clear-cell', {
    label: 'Clear Cell',
    execute: () => {
      console.log('Clear Cell');
    }
  });

  commands.addCommand('example:cut-cells', {
    label: 'Cut Cell(s)',
    execute: () => {
      console.log('Cut Cell(s)');
    }
  });

  commands.addCommand('example:run-cell', {
    label: 'Run Cell',
    execute: () => {
      console.log('Run Cell');
    }
  });

  commands.addCommand('example:cell-test', {
    label: 'Cell Test',
    execute: () => {
      console.log('Cell Test');
    }
  });

  commands.addCommand('notebook:new', {
    label: 'New Notebook',
    execute: () => {
      console.log('New Notebook');
    }
  });

  commands.addKeyBinding({
    keys: ['Accel X'],
    selector: 'body',
    command: 'example:cut'
  });

  commands.addKeyBinding({
    keys: ['Accel C'],
    selector: 'body',
    command: 'example:copy'
  });

  commands.addKeyBinding({
    keys: ['Accel V'],
    selector: 'body',
    command: 'example:paste'
  });

  commands.addKeyBinding({
    keys: ['Accel J', 'Accel J'],
    selector: 'body',
    command: 'example:new-tab'
  });

  commands.addKeyBinding({
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

  let bar = new MenuBar();
  bar.addMenu(menu1);
  bar.addMenu(menu2);
  bar.addMenu(menu3);
  bar.id = 'menuBar';

  let palette = new CommandPalette({ commands });
  palette.addItem({ command: 'example:cut', category: 'Edit' });
  palette.addItem({ command: 'example:copy', category: 'Edit' });
  palette.addItem({ command: 'example:paste', category: 'Edit' });
  palette.addItem({ command: 'example:one', category: 'Number' });
  palette.addItem({ command: 'example:two', category: 'Number' });
  palette.addItem({ command: 'example:three', category: 'Number' });
  palette.addItem({ command: 'example:four', category: 'Number' });
  palette.addItem({ command: 'example:black', category: 'Number' });
  palette.addItem({ command: 'example:new-tab', category: 'File' });
  palette.addItem({ command: 'example:close-tab', category: 'File' });
  palette.addItem({ command: 'example:save-on-exit', category: 'File' });
  palette.addItem({ command: 'example:open-task-manager', category: 'File' });
  palette.addItem({ command: 'example:close', category: 'File' });
  palette.addItem({ command: 'example:clear-cell', category: 'Notebook Cell Operations' });
  palette.addItem({ command: 'example:cut-cells', category: 'Notebook Cell Operations' });
  palette.addItem({ command: 'example:run-cell', category: 'Notebook Cell Operations' });
  palette.addItem({ command: 'example:cell-test', category: 'Console' });
  palette.addItem({ command: 'notebook:new', category: 'Notebook' });
  palette.id = 'palette';

  let contextMenu = new ContextMenu({ commands });

  document.addEventListener('contextmenu', (event: MouseEvent) => {
    if (contextMenu.open(event)) {
      event.preventDefault();
    }
  });

  contextMenu.addItem({ command: 'example:cut', selector: '.content' });
  contextMenu.addItem({ command: 'example:copy', selector: '.content' });
  contextMenu.addItem({ command: 'example:paste', selector: '.content' });

  contextMenu.addItem({ command: 'example:one', selector: '.p-CommandPalette' });
  contextMenu.addItem({ command: 'example:two', selector: '.p-CommandPalette' });
  contextMenu.addItem({ command: 'example:three', selector: '.p-CommandPalette' });
  contextMenu.addItem({ command: 'example:four', selector: '.p-CommandPalette' });
  contextMenu.addItem({ command: 'example:black', selector: '.p-CommandPalette' });

  contextMenu.addItem({ command: 'notebook:new', selector: '.p-CommandPalette-input' });
  contextMenu.addItem({ command: 'example:save-on-exit', selector: '.p-CommandPalette-input' });
  contextMenu.addItem({ command: 'example:open-task-manager', selector: '.p-CommandPalette-input' });
  contextMenu.addItem({ type: 'separator', selector: '.p-CommandPalette-input' });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    commands.processKeydownEvent(event);
  });

  let r1 = new ContentWidget('Red');
  let b1 = new ContentWidget('Blue');
  let g1 = new ContentWidget('Green');
  let y1 = new ContentWidget('Yellow');

  let r2 = new ContentWidget('Red');
  let b2 = new ContentWidget('Blue');
  // let g2 = new ContentWidget('Green');
  // let y2 = new ContentWidget('Yellow');

  let dock = new DockPanel();
  dock.addWidget(r1);
  dock.addWidget(b1, { mode: 'split-right', ref: r1 });
  dock.addWidget(y1, { mode: 'split-bottom', ref: b1 });
  dock.addWidget(g1, { mode: 'split-left', ref: y1 });
  dock.addWidget(r2, { ref: b1 });
  dock.addWidget(b2, { mode: 'split-right', ref: y1 });
  dock.id = 'dock';

  let savedLayouts: DockPanel.ILayoutConfig[] = [];

  commands.addCommand('save-dock-layout', {
    label: 'Save Layout',
    caption: 'Save the current dock layout',
    execute: () => {
      savedLayouts.push(dock.saveLayout());
      palette.addItem({
        command: 'restore-dock-layout',
        category: 'Dock Layout',
        args: { index: savedLayouts.length - 1 }
      });
    }
  });

  commands.addCommand('restore-dock-layout', {
    label: args => {
      return `Restore Layout ${args.index as number}`;
    },
    execute: args => {
      dock.restoreLayout(savedLayouts[args.index as number]);
    }
  });

  palette.addItem({
    command: 'save-dock-layout',
    category: 'Dock Layout',
    rank: 0
  });

  BoxPanel.setStretch(dock, 1);

  let main = new BoxPanel({ direction: 'left-to-right', spacing: 0 });
  main.id = 'main';
  main.addWidget(palette);
  main.addWidget(dock);

  window.onresize = () => { main.update(); };

  Widget.attach(bar, document.body);
  Widget.attach(main, document.body);
}


window.onload = main;

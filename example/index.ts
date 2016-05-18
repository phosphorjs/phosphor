/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
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


const MENU_TEMPLATE: Menu.Template = [
  {
    text: '&&Copy',
    icon: 'fa fa-copy',
    shortcut: 'Ctrl+C',
    command: 'copy'
  },
  {
    text: 'Cu&&t',
    icon: 'fa fa-cut',
    shortcut: 'Ctrl+X',
    command: 'cut'
  },
  {
    text: '&&Paste',
    icon: 'fa fa-paste',
    shortcut: 'Ctrl+V',
    command: 'paste'
  },
  {
    type: 'separator'
  },
  {
    text: '&&New Tab',
    command: 'new-tab'
  },
  {
    text: '&&Close Tab',
    command: 'close-tab'
  },
  {
    type: 'check',
    checked: true,
    text: '&&Save On Exit',
    command: 'save-on-exit'
  },
  {
    type: 'separator'
  },
  {
    text: 'Task Manager',
    disabled: true
  },
  {
    type: 'separator'
  },
  {
    type: 'submenu',
    text: 'More...',
    submenu: [
      {
        text: 'One',
        command: 'one'
      },
      {
        text: 'Two',
        command: 'two'
      },
      {
        text: 'Three',
        command: 'three'
      },
      {
        text: 'Four',
        command: 'four'
      },
      {
        text: 'Again...',
        type: 'submenu',
        submenu: [
          {
            text: 'One',
            command: 'one'
          },
          {
            text: 'Two',
            command: 'two'
          },
          {
            text: 'Three',
            command: 'three'
          },
          {
            text: 'Four',
            command: 'four'
          }
        ]
      }
    ]
  },
  {
    type: 'separator'
  },
  {
    text: 'Close',
    icon: 'fa fa-close',
    command: 'close'
  }
];


function onTriggered(sender: MenuBar | Menu, item: MenuItem): void {
  if (item.command === 'save-on-exit') {
    item.checked = !item.checked;
  }
  console.log('triggered:', item.command);
}


function main(): void {

  let menu1 = Menu.fromTemplate(MENU_TEMPLATE);
  menu1.title.text = 'File';

  let menu2 = Menu.fromTemplate(MENU_TEMPLATE);
  menu2.title.text = 'Edit';

  let menu3 = Menu.fromTemplate(MENU_TEMPLATE);
  menu3.title.text = 'View';

  let ctxt = Menu.fromTemplate(MENU_TEMPLATE);

  let bar = new MenuBar();
  bar.addMenu(menu1);
  bar.addMenu(menu2);
  bar.addMenu(menu3);

  bar.triggered.connect(onTriggered);

  ctxt.triggered.connect(onTriggered);

  document.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    ctxt.open(event.clientX, event.clientY);
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.keyCode === 18) { // Alt
      if (bar.childMenu) {
        bar.childMenu.close();
      } else if (bar.activeIndex >= 0) {
        bar.activeIndex = -1;
        bar.blur();
      } else {
        bar.activeIndex = 0;
        bar.focus();
      }
      event.preventDefault();
    }
  });

  Widget.attach(bar, document.body);
}


window.onload = main;

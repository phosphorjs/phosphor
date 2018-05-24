import { CommandRegistry } from '@phosphor/commands';
import { Message } from '@phosphor/messaging';
import {
  BoxPanel,
  CommandPalette,
  ContextMenu,
  DashboardPanel,
  Widget
  } from '@phosphor/widgets';
import 'es6-promise/auto';
import '../style/index.css';

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
  // polyfill Promise on IE

const commands = new CommandRegistry();

class ContentWidget extends Widget {

  static createNode(label: string): HTMLElement {
    let node = document.createElement('div');
    let content = document.createElement('div');
    content.innerText = label;
    node.appendChild(content);
    return node;
  }

  constructor(name: string, label: string) {
    super({ node: ContentWidget.createNode(label) });
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
  let palette = new CommandPalette({ commands });
  palette.id = 'palette';

  let contextMenu = new ContextMenu({ commands });

  document.addEventListener('contextmenu', (event: MouseEvent) => {
    if (contextMenu.open(event)) {
      event.preventDefault();
    }
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    commands.processKeydownEvent(event);
  });

  let r1 = new ContentWidget('Red', 'r1');
  let b1 = new ContentWidget('Blue', 'b1');
  let g1 = new ContentWidget('Green', 'g1');
  let y1 = new ContentWidget('Yellow', 'y1');

  let r2 = new ContentWidget('Red', 'r2');
  let b2 = new ContentWidget('Blue', 'b2');
  // let g2 = new ContentWidget('Green');
  // let y2 = new ContentWidget('Yellow');

  let dashboard = new DashboardPanel();
  dashboard.addWidget(r1);
  dashboard.addWidget(b1, { mode: 'split-right', ref: r1 });
  dashboard.addWidget(y1, { mode: 'split-bottom', ref: b1 });
  dashboard.addWidget(g1, { mode: 'split-left', ref: y1 });
  dashboard.addWidget(r2, { ref: b1 });
  dashboard.addWidget(b2, { mode: 'split-right', ref: y1 });
  dashboard.id = 'dashboard';

  let savedLayouts: DashboardPanel.ILayoutConfig[] = [];

  commands.addCommand('save-dashboard-layout', {
    label: 'Save Layout',
    caption: 'Save the current dashboard layout',
    execute: () => {
      savedLayouts.push(dashboard.saveLayout());
      palette.addItem({
        command: 'restore-dashboard-layout',
        category: 'Dashboard Layout',
        args: { index: savedLayouts.length - 1 }
      });
    }
  });

  commands.addCommand('restore-dashboard-layout', {
    label: args => {
      return `Restore Layout ${args.index as number}`;
    },
    execute: args => {
      dashboard.restoreLayout(savedLayouts[args.index as number]);
    }
  });

  palette.addItem({
    command: 'save-dashboard-layout',
    category: 'Dashboard Layout',
    rank: 0
  });

  BoxPanel.setStretch(dashboard, 1);

  let main = new BoxPanel({ direction: 'left-to-right', spacing: 0 });
  main.id = 'main';
  main.addWidget(palette);
  main.addWidget(dashboard);

  window.onresize = () => { main.update(); };

  Widget.attach(main, document.body);
}


window.onload = main;

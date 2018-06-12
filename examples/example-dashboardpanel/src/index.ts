/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import { CommandRegistry } from '@phosphor/commands';
import { MimeData } from '@phosphor/coreutils';
import { Drag } from '@phosphor/dragdrop';
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

/**
 * The factory MIME type supported by phosphor dock panels.
 */
const FACTORY_MIME = 'application/vnd.phosphor.widget-factory';

const commands = new CommandRegistry();


/**
 * Modeled after some dragging behavior in JupyterLab.  
 */
class DraggableWidget extends Widget {
  private _drag: Drag | null = null;
  private _dragData: IDragData;

  static createElement(): HTMLElement {
    const container = document.createElement('div');
    container.innerText = 'drag me';
    return container;
  }

  constructor() {
    super({node: DraggableWidget.createElement()});
  }
  
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('mousedown', this);
  }
  
  /**
   * Handle the DOM events for the tab bar.
   *
   * @param event - The DOM event sent to the tab bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tab bar's DOM node.
   *
   * This should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    }
  }

  /**
   * Handle the `'mousedown'` event.
   */
  private _evtMouseDown(event: MouseEvent): void {
    
    // Left mouse press for drag start.
    if (event.button === 0) {
      this._dragData = { 
        pressX: event.clientX, 
        pressY: event.clientY
      };
      document.addEventListener('mouseup', this, true);
      document.addEventListener('mousemove', this, true);
    }
  }

  /**
   * Handle the `'mousemove'` event for the tab bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Bail if we are the one dragging.
    if (this._drag || !this._dragData) {
      return;
    }

    this._startDrag();
  }

  /**
   * Handle the `'mouseup'` event for the document.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Remove the drag listeners if necessary.
    if (event.button !== 0 || !this._drag) {
      document.removeEventListener('mousemove', this, true);
      document.removeEventListener('mouseup', this, true);
    }
    event.preventDefault();
    event.stopPropagation();
  }

  private _startDrag(): void {
    // Set up the drag event.
    this._drag = new Drag({
      mimeData: new MimeData(),
      supportedActions: 'move',
      proposedAction: 'move'
    });
    this._drag.mimeData.setData(FACTORY_MIME, () => {
      return new ContentWidget('grey', 'dragged');
    });

    // Start the drag and remove the mousemove and mouseup listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    
    this._drag.start(this._dragData!.pressX!, this._dragData!.pressY!).then(action => {
      this._drag = null;
    });
  }
}

interface IDragData {
  pressX: number;
  pressY: number;
}

class ContentWidget extends Widget {

  static createNode(label: string): HTMLElement {
    let node = document.createElement('div');

    let content = document.createElement('div');
    content.className = 'content';
    content.innerText = label;

    let closeButton = document.createElement('button');
    closeButton.innerText = 'X';

    node.appendChild(closeButton);
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

    this._label = label;

    this.closeButton.onclick = () => {
      this._close();
    };
  }

  get closeButton(): HTMLButtonElement {
    return this.node.getElementsByTagName('button')[0] as HTMLButtonElement;
  }

  _close(): void {
    this.parent!.layout!.removeWidget(this);
  }

  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      console.log(`${this._label} activated!`);
    }
  }

  private _label: string;
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
  dashboard.layoutRearranged.connect(() => {
    console.log('layout rearranged');
  });

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

  let draggable = new DraggableWidget();
  draggable.id = 'draggable';

  BoxPanel.setStretch(dashboard, 1);

  let sidebar = new BoxPanel({ direction: 'top-to-bottom', spacing: 0});
  sidebar.id = 'sidebar';
  sidebar.addWidget(palette);
  sidebar.addWidget(draggable);

  let main = new BoxPanel({ direction: 'left-to-right', spacing: 0 });
  main.id = 'main';
  main.addWidget(sidebar);
  main.addWidget(dashboard);

  window.onresize = () => { main.update(); };

  Widget.attach(main, document.body);
}


window.onload = main;

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module chat.roomsplugin {

import IContainer = phosphor.di.IContainer;

import IShellView = phosphor.shell.IShellView;

import Size = phosphor.utility.Size;

import Component = phosphor.virtualdom.Component;
import Elem = phosphor.virtualdom.Elem;
import IData = phosphor.virtualdom.IData;
import createFactory = phosphor.virtualdom.createFactory;
import dom = phosphor.virtualdom.dom;

import RenderWidget = phosphor.widgets.RenderWidget;


/**
 * A simple placeholder component for the chat rooms list.
 */
class RoomListPlaceholder extends Component<IData> {

  constructor(data: IData, children: Elem[]) {
    super(data, children);
    this.node.classList.add('chat-room-list');
  }

  protected render(): Elem {
    return dom.h2('Room List Placeholder');
  }
}


/**
 * The element factory for the rooms list component.
 */
var RoomList = createFactory(RoomListPlaceholder);


/**
 * A simple placeholder component for the open chat rooms.
 */
class OpenRoomsPlaceholder extends Component<IData> {

  constructor(data: IData, children: Elem[]) {
    super(data, children);
    this.node.classList.add('chat-open-rooms');
  }

  protected render(): Elem {
    return dom.h2('Open Rooms Placeholder');
  }
}


/**
 * The element factory for the open rooms component.
 */
var OpenRooms = createFactory(OpenRoomsPlaceholder);


/**
 * A host widget for the room list component.
 */
class RoomListHost extends RenderWidget {

  constructor() {
    super();
    this.node.classList.add('chat-room-list-host');
  }

  sizeHint(): Size {
    return new Size(250, 400);
  }

  protected render(): Elem {
    return RoomList();
  }
}


/**
 * A host widget for the open rooms component.
 */
class OpenRoomsHost extends RenderWidget {

  constructor() {
    super();
    this.node.classList.add('chat-open-rooms-host');
  }

  sizeHint(): Size {
    return new Size(600, 400);
  }

  protected render(): Elem {
    return OpenRooms();
  }
}


/**
 * Initialize the chat rooms plugin.
 */
export
function initialize(container: IContainer): void {
  var shell = container.resolve(IShellView);
  shell.addWidget('left', new RoomListHost());
  shell.addWidget('center', new OpenRoomsHost());
}

} // module chat.roomsplugin

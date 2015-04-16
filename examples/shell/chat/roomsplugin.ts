/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module chat.roomsplugin {

import Component = phosphor.components.Component;

import IContainer = phosphor.di.IContainer;

import IShellView = phosphor.shell.IShellView;

import IData = phosphor.virtualdom.IData;
import IElement = phosphor.virtualdom.IElement;
import createFactory = phosphor.virtualdom.createFactory;
import dom = phosphor.virtualdom.dom;

import ElementHost = phosphor.widgets.ElementHost;


/**
 *
 */
class RoomListPlaceholder extends Component<IData> {

  static className = 'chat-room-list';

  render(): IElement {
    return dom.h2('Room List Placeholder');
  }
}

var RoomList = createFactory(RoomListPlaceholder);


/**
 *
 */
class OpenRoomsPlaceholder extends Component<IData> {

  static className = 'chat-open-rooms';

  render(): IElement {
    return dom.h2('Open Rooms Placeholder');
  }
}

var OpenRooms = createFactory(OpenRoomsPlaceholder);


/**
 *
 */
export
function initialize(container: IContainer): void {
  var shell = container.resolve(IShellView);

  var list = new ElementHost(RoomList(), 250, 400);
  var rooms = new ElementHost(OpenRooms(), 600, 400);

  list.addClass('chat-room-list-host');
  rooms.addClass('chat-open-rooms-host');

  shell.addWidget('left', list);
  shell.addWidget('center', rooms);
}

} // module chat.roomsplugin

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module chat.feedplugin {

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
 * A simple placeholder component for the chat feed.
 */
class FeedPlaceholder extends Component<IData> {

  constructor(data: IData, children: Elem[]) {
    super(data, children);
    this.node.classList.add('chat-feed');
  }

  protected render(): Elem {
    return dom.h2('Chat Feed Placeholder');
  }
}


/**
 * The element factory for the chat feed component.
 */
var Feed = createFactory(FeedPlaceholder);


/**
 * A host widget for the feed component.
 */
class FeedHost extends RenderWidget {

  constructor() {
    super();
    this.node.classList.add('chat-feed-host');
  }

  sizeHint(): Size {
    return new Size(600, 200);
  }

  protected render(): Elem {
    return Feed();
  }
}


/**
 * Initialize the chat feed plugin.
 */
export
function initialize(container: IContainer): void {
  var shell = container.resolve(IShellView);
  shell.addWidget('bottom', new FeedHost());
}

} // module chat.feedplugin

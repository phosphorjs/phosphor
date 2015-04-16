/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module chat.feedplugin {

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
class FeedPlaceholder extends Component<IData> {

  static className = 'chat-feed';

  render(): IElement {
    return dom.h2('Chat Feed Placeholder');
  }
}

var Feed = createFactory(FeedPlaceholder);


/**
 *
 */
export
function initialize(container: IContainer): void {
  var shell = container.resolve(IShellView);

  var feed = new ElementHost(Feed(), 600, 200);
  feed.addClass('chat-feed-host');

  shell.addWidget('bottom', feed);
}

} // module chat.feedplugin

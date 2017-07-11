/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  VirtualContent, VirtualDOM
} from '@phosphor/virtualdom';

import {
  Widget
} from './widget';


/**
 * A widget which renders its content using the virtual DOM.
 */
export
abstract class RenderWidget extends Widget {
  /**
   * Construct a new render widget.
   */
  constructor() {
    super();
    this.addClass('p-RenderWidget');
    this.setFlag(Widget.Flag.DisallowLayout);
  }

  /**
   * Process a message sent to the widget.
   */
  processMessage(msg: Message): void {
    switch (msg.type) {
    case 'before-render':
      this.onBeforeRender(msg);
      break;
    case 'after-render':
      this.onAfterRender(msg);
      break;
    default:
      super.processMessage(msg);
    }
  }

  /**
   * Create the virtual DOM content for the widget.
   *
   * @returns The virtual DOM content to render into the widget.
   *
   * #### Notes
   * This method is called automatically after the widget is attached
   * or made visible. It can be triggered procedurally by calling the
   * `update()` method.
   *
   * This will not be invoked if `shouldRender()` returns `false`.
   *
   * This method must be implemented by a subclass.
   */
  protected abstract render(): VirtualContent;

  /**
   * Test whether the widget should be rendered.
   *
   * @returns Whether the widget content should be rendered.
   *
   * #### Notes
   * This method is invoked when the widget receives a message of type
   * `'update-request'`. It is used to determine whether to (re)render
   * the widget content. If this method returns `false`, the `render`
   * method will not be invoked and the widget will not be updated.
   *
   * The default implementation of this method returns `true` IFF the
   * widget is visible.
   *
   * A subclass may reimplement this method as needed.
   */
  protected shouldRender(): boolean {
    return this.isVisible;
  }

  /**
   * A message handler invoked on a `'before-render'` message.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   */
  protected onBeforeRender(msg: Message): void { }

  /**
   * A message handler invoked on an `'after-render'` message.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   */
  protected onAfterRender(msg: Message): void { }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.update();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    this.update();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Bail if the widget should not render.
    if (!this.shouldRender()) {
      return;
    }

    // Send a `'before-render'` message to the widget.
    MessageLoop.sendMessage(this, RenderWidget.BeforeRender);

    // Render the virtual content into the widget.
    VirtualDOM.render(this.render(), this.node);

    // Send an `'after-render'` message to the widget.
    MessageLoop.sendMessage(this, RenderWidget.AfterRender);
  }
}


/**
 * The namespace for the `RenderWidget` class statics.
 */
export
namespace RenderWidget {
  /**
   * A singleton `'before-render'` message.
   */
  export
  const BeforeRender = new Message('before-render');

  /**
   * A singleton `'after-render'` message.
   */
  export
  const AfterRender = new Message('after-render');
}

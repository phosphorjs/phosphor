/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import IMessage = core.IMessage;
import Message = core.Message;
import sendMessage = core.sendMessage;

import emptyObject = utility.emptyObject;

import Elem = virtualdom.Elem;
import render = virtualdom.render;


/**
 * The class name added to RenderWidget instances.
 */
var RENDER_WIDGET_CLASS = 'p-RenderWidget';

/**
 * A singleton 'before-render' message.
 */
var MSG_BEFORE_RENDER = new Message('before-render');

/**
 * A singleton 'after-render' message.
 */
var MSG_AFTER_RENDER = new Message('after-render');


// TODO - render null on detach to dispose vdom content?
/**
 * A leaf widget which renders its content using the virtual DOM.
 *
 * This widget is used to embed virtual DOM content into a widget
 * hierarchy. A subclass should reimplement the `render` method to
 * generate the content for the widget. It should also reimplement
 * the `sizeHint` method to return a reasonable natural size.
 */
export
class RenderWidget extends Widget {
  /**
   * Construct a new render widget.
   */
  constructor() {
    super();
    this.addClass(RENDER_WIDGET_CLASS);
    this.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._refs = null;
    super.dispose();
  }

  /**
   * Get the current refs mapping for the widget.
   */
  get refs(): any {
    return this._refs;
  }

  /**
   * Process a message sent to the widget.
   */
  processMessage(msg: IMessage): void {
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
   * The rendered content is used to populate the widget's node.
   *
   * The default implementation returns `null`.
   */
  protected render(): Elem | Elem[] {
    return null;
  }

  /**
   * A method invoked on an 'update-request' message.
   *
   * This renders the virtual DOM content into the widget's node.
   */
  protected onUpdateRequest(msg: IMessage): void {
    sendMessage(this, MSG_BEFORE_RENDER);
    this._refs = render(this.render(), this.node);
    sendMessage(this, MSG_AFTER_RENDER);
  }

  /**
   * A method invoked on an 'after-attach' message.
   */
  protected onAfterAttach(msg: IMessage): void {
    this.update(true);
  }

  /**
   * A method invoked on a 'before-render' message.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeRender(msg: IMessage): void { }

  /**
   * A method invoked on an 'after-render' message.
   *
   * The default implementation is a no-op.
   */
  protected onAfterRender(msg: IMessage): void { }

  private _refs: any = emptyObject;
}

} // module phosphor.widgets

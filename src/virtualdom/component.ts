/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import IMessage = core.IMessage;
import Message = core.Message;
import sendMessage = core.sendMessage;

import emptyObject = utility.emptyObject;


/**
 * A singleton 'before-render' message.
 */
var MSG_BEFORE_RENDER = new Message('before-render');

/**
 * A singleton 'after-render' message.
 */
var MSG_AFTER_RENDER = new Message('after-render');


/**
 * A component which renders its content using the virtual DOM.
 *
 * User code should subclass this class and reimplement the `render`
 * method to generate the virtual DOM content for the component.
 */
export
class Component<T extends IData> extends BaseComponent<T> {
  /**
   * The tag name to use when creating the component node.
   *
   * This may be reimplemented by a subclass.
   */
  static tagName = 'div';

  /**
   * The initial class name for the component node.
   *
   * This may be reimplemented by a subclass.
   */
  static className = '';

  /**
   * Create the DOM node for a component.
   *
   * This method creates the DOM node from the `className` and `tagName`
   * properties. A subclass will not typically reimplement this method.
   */
  static createNode(): HTMLElement {
    var node = document.createElement(this.tagName);
    node.className = this.className;
    return node;
  }

  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._refs = null;
    super.dispose();
  }

  /**
   * Get the current refs mapping for the component.
   */
  get refs(): any {
    return this._refs;
  }

  /**
   * Process a message sent to the component.
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
   * Create the virtual DOM content for the component.
   *
   * The rendered content is used to populate the component's node.
   *
   * The default implementation returns `null`.
   */
  protected render(): Elem | Elem[] {
    return null;
  }

  /**
   * A method invoked on an 'update-request' message.
   *
   * This renders the virtual DOM content into the component's node.
   */
  protected onUpdateRequest(msg: IMessage): void {
    sendMessage(this, MSG_BEFORE_RENDER);
    this._refs = render(this.render(), this.node);
    sendMessage(this, MSG_AFTER_RENDER);
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

} // module phosphor.virtualdom

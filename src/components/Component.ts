/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import any = collections.any;
import IIterable = collections.IIterable;

import IMessage = core.IMessage;
import postMessage = core.postMessage;
import sendMessage = core.sendMessage;

import IVirtualElement = phosphor.virtualdom.IVirtualElement;
import IVirtualElementData = phosphor.virtualdom.IVirtualElementData;
import render = phosphor.virtualdom.render;


/**
 * A singleton frozen empty object.
 */
var emptyObject: any = Object.freeze(Object.create(null));

// TODO fix me
var MSG_BEFORE_RENDER = { type: 'before-render' };
var MSG_AFTER_RENDER = { type: 'after-render' };
var MSG_RENDER_REQUEST = { type: 'render-request' };


/**
 * A concrete implementation of IComponent with virtual DOM rendering.
 *
 * User code will typically subclass this class to create a custom
 * component. Subclasses should reimplement the `render` method to
 * generate the virtual DOM content for the component.
 */
export
class Component<T extends IVirtualElementData> extends BaseComponent<T> {
  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._m_refs = null;
    super.dispose();
  }

  /**
   * Get the current refs mapping for the component.
   */
  get refs(): any {
    return this._m_refs;
  }

  /**
   * Render the virtual content for the component.
   *
   * The rendered content is used to populate the component's node.
   *
   * This should be reimplemented by a subclass.
   *
   * The default implementation returns null.
   */
  render(): IVirtualElement | IVirtualElement[] {
    return null;
  }

  /**
   * Schedule a rendering update for the component.
   *
   * This should be called whenever the internal state of the component
   * has changed such that it requires the component to be re-rendered.
   *
   * Multiple synchronous calls to this method are collapsed.
   */
  update(): void {
    postMessage(this, MSG_RENDER_REQUEST);
  }

  /**
   * Process a message sent to the component.
   */
  processMessage(msg: IMessage): void {
    switch (msg.type) {
      case 'render-request':
        sendMessage(this, MSG_BEFORE_RENDER);
        this._m_refs = render(this.render(), this.node);
        sendMessage(this, MSG_AFTER_RENDER);
        break;
      case 'before-render':
        this.onBeforeRender(msg)
        break;
      case 'after-render':
        this.onAfterRender(msg);
        break;
      default:
        break;
    }
  }

  /**
   * Compress a message posted to the component.
   */
  compressMessage(msg: IMessage, pending: IIterable<IMessage>): boolean {
    if (msg.type === 'render-request') {
      return any(pending, p => p.type === msg.type);
    }
    return false;
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

  private _m_refs: any = emptyObject;
}

} // module phosphor.components

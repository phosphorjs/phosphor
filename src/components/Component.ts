/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import IIterable = collections.IIterable;
import some = collections.some;

import IMessage = core.IMessage;
import IMessageHandler = core.IMessageHandler;
import dispatch = core.dispatch;
import emptyObject = core.emptyObject;

import IElement = virtualdom.IElement;
import IData = virtualdom.IData;
import render = virtualdom.render;


/**
 * A concrete implementation of IComponent with virtual DOM rendering.
 *
 * User code should subclass this class to create a custom component.
 * The subclasses should reimplement the `render` method to generate
 * the virtual DOM content for the component.
 */
export
class Component<T extends IData> extends BaseComponent<T> implements IMessageHandler {
  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._m_refs = null;
    super.dispose();
  }

  /**
   * Get the refs mapping for the component.
   *
   * This is an object which maps a ref name to the corresponding node
   * or component instance created for the most recent rendering pass.
   */
  get refs(): any {
    return this._m_refs;
  }

  /**
   * Initialize the component with new data and children.
   *
   * This is called whenever the component is rendered by its parent.
   *
   * This method first invokes the `shouldUpdate` method, passing the
   * new data and children. It then invokes the superclass method to
   * update the internal component state. Lastly if the `shouldUpdate`
   * method returned true, the component is immediately re-rendered.
   *
   * The method will normally not be reimplemented by a subclass.
   */
  init(data: T, children: IElement[]): void {
    var update = this.shouldUpdate(data, children);
    super.init(data, children);
    if (update) this.doRender();
  }

  /**
   * Create the virtual content for the component.
   *
   * The rendered content is used to populate the component's node.
   *
   * This should be reimplemented by a subclass.
   */
  render(): IElement | IElement[] {
    return null;
  }

  /**
   * Schedule a rendering update for the component.
   *
   * This should be called whenever the internal state of the component
   * has changed such that it requires the component to be re-rendered,
   * or when external code requires the component to be refreshed.
   *
   * Multiple synchronous calls to this method are collapsed.
   */
  update(): void {
    dispatch.postMessage(this, { type: 'update-request' });
  }

  /**
   * Process a message sent to the component.
   */
  processMessage(msg: IMessage): void {
    if (msg.type === 'update-request') {
      this.doRender();
    }
  }

  /**
   * Compress a message posted to the component.
   */
  compressMessage(msg: IMessage, pending: IIterable<IMessage>): boolean {
    if (msg.type === 'update-request') {
      return some(pending, p => p.type === msg.type);
    }
    return false;
  }

  /**
   * Test whether the component should be updated.
   *
   * This method is invoked when the component is initialized with new
   * data and children. It should return true if the component should
   * be re-rendered, or false if the new values will not cause a visual
   * change. If this method returns false, the component will not be
   * updated when it is (re)initialized.
   *
   * Determining whether a component should update is error prone and
   * can be just as expensive as performing the virtual DOM diff, so
   * this should only be reimplemented if performance is a problem.
   *
   * The default implementation of this method always returns true.
   */
  protected shouldUpdate(data: T, children: IElement[]): boolean {
    return true;
  }

  /**
   * Perform the actual rendering of the component content.
   *
   * This method immediately (re)renders the component content. It
   * is called automatically at the proper times, but can be invoked
   * directly by a subclass if it requires a synchronous update.
   *
   * This method should not be reimplemented.
   */
  protected doRender(): void {
    this.beforeRender();
    this._m_refs = render(this.render(), this.node);
    this.afterRender();
  }

  /**
   * A method invoked immediately before the component is rendered.
   *
   * The default implementation is a no-op.
   */
  protected beforeRender(): void { }

  /**
   * A method invoked immediately after the component is rendered.
   *
   * The default implementation is a no-op.
   */
  protected afterRender(): void { }

  private _m_refs = emptyObject;
}

} // module phosphor.components

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import IIterable = collections.IIterable;

import ICoreEvent = core.ICoreEvent;
import postEvent = core.postEvent;
import sendEvent = core.sendEvent;


/**
 * A singleton empty object.
 */
var emptyObject: any = Object.freeze(Object.create(null));

/**
 * A singleton empty array.
 */
var emptyArray: any[] = Object.freeze([]);

// TODO fix me
var EVT_BEFORE_RENDER = { type: 'before-render' };
var EVT_AFTER_RENDER = { type: 'after-render' };
var EVT_RENDER_REQUEST = { type: 'render-request' };


/**
 * A concrete implementation of IComponent.
 */
export
class Component<T extends IVirtualElementData> implements IComponent<T> {
  /**
   * The tag name used to create the component's DOM node.
   *
   * A subclass may redefine this property.
   */
  static tagName = 'div';

  /**
   * The initial class name for the component's DOM node.
   *
   * A subclass may redefine this property.
   */
  static className = '';

  /**
   * Construct a new component.
   */
  constructor() {
    var ctor = <any>this.constructor;
    this._m_node = document.createElement(<string>ctor.tagName);
    this._m_node.className = <string>ctor.className;
  }

  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._m_node = null;
    this._m_data = null;
    this._m_refs = null;
    this._m_children = null;
  }

  /**
   * Get the DOM node for the component.
   */
  get node(): HTMLElement {
    return this._m_node;
  }

  /**
   * Get the current data object for the component.
   */
  get data(): T {
    return this._m_data;
  }

  /**
   * Get the current children for the component.
   */
  get children(): IVirtualElement[] {
    return this._m_children;
  }

  /**
   * Get the current refs mapping for the component.
   */
  get refs(): any {
    return this._m_refs;
  }

  /**
   * Initialize the component with new data and children.
   *
   * This is called automatically by the renderer at the proper times.
   *
   * Returns true if the component should be updated, false otherwise.
   * The default implementation returns true. A reimplementation must
   * call the superclass method to update the internal component state.
   */
  init(data: T, children: IVirtualElement[]): boolean {
    this._m_data = data || emptyObject;
    this._m_children = children || emptyArray;
    return true;
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
    postEvent(this, EVT_RENDER_REQUEST);
  }

  /**
   * Process an event dispatched to the component.
   */
  processEvent(event: ICoreEvent): void {
    switch (event.type) {
      case 'render-request':
        sendEvent(this, EVT_BEFORE_RENDER);
        this._m_refs = render(this.render(), this._m_node);
        sendEvent(this, EVT_AFTER_RENDER);
        break;
      case 'before-render':
        this.beforeRenderEvent(event)
        break;
      case 'after-render':
        this.afterRenderEvent(event);
        break;
      default:
        break;
    }
  }

  /**
   * Compress an event posted to the component.
   */
  compressEvent(event: ICoreEvent, posted: IIterable<ICoreEvent>): boolean {
    if (event.type === 'render-request') {
      for (var iter = posted.iterator(); iter.hasNext();) {
        if (iter.next().type === event.type) return true;
      }
    }
    return false;
  }

  /**
   * A method invoked on a 'before-render' event.
   *
   * The default implementation is a no-op.
   */
  protected beforeRenderEvent(event: ICoreEvent): void { }

  /**
   * A method invoked on an 'after-render' event.
   *
   * The default implementation is a no-op.
   */
  protected afterRenderEvent(event: ICoreEvent): void { }

  private _m_node: HTMLElement;
  private _m_data: T = emptyObject;
  private _m_refs: any = emptyObject;
  private _m_children: IVirtualElement[] = emptyArray;
}

} // module phosphor.virtualdom

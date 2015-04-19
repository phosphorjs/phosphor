/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import emptyArray = utility.emptyArray;
import emptyObject = utility.emptyObject;


/**
 * An implementation of IComponent which renders with the virtual DOM.
 *
 * User code should subclass this class and reimplement the `render`
 * method to generate the virtual DOM content for the component.
 */
export
class Component<T extends IData> implements IComponent<T> {
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
    this._node = document.createElement(<string>ctor.tagName);
    this._node.className = <string>ctor.className;
  }

  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._node = null;
    this._data = null;
    this._refs = null;
    this._children = null;
    this._cancelUpdate();
  }

  /**
   * Get the DOM node for the component.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Get the current data object for the component.
   */
  get data(): T {
    return this._data;
  }

  /**
   * Get the current refs mapping for the component.
   */
  get refs(): any {
    return this._refs;
  }

  /**
   * Get the current children for the component.
   */
  get children(): Elem[] {
    return this._children;
  }

  /**
   * Initialize the component with new data and children.
   *
   * This is called whenever the component is rendered by its parent.
   *
   * A subclass may reimplement this method if needed, but it should
   * always call `super` so that the internal component state can be
   * updated and the node content can be re-rendered if necessary.
   */
  init(data: T, children: Elem[]): void {
    var update = this.shouldUpdate(data, children);
    this._data = data;
    this._children = children;
    if (update) this.update(true);
  }

  /**
   * Schedule an update for the component.
   *
   * This should be called whenever the internal state of the component
   * has changed such that it requires the component to be re-rendered,
   * or when external code requires the component to be refreshed.
   *
   * If the `immediate` flag is false (the default) the update will be
   * scheduled for the next cycle of the event loop. If the flag is set
   * to true, the component will be updated immediately.
   *
   * Multiple pending requests are collapsed into a single update.
   */
  update(immediate = false): void {
    if (immediate) {
      this._cancelUpdate();
      this._render();
    } else if (this._requestId === 0) {
      this._requestId = requestAnimationFrame(() => {
        this._requestId = 0;
        this._render();
      });
    }
  }

  /**
   * Test whether the component should be updated.
   *
   * This method is called when the component is initialized with new
   * data and children. It should return true if the component should
   * be updated, or false if the values do not cause a visual change.
   *
   * Determining whether a component should update is error prone and
   * can be just as expensive as performing the virtual DOM diff, so
   * this should only be reimplemented if performance is a problem.
   *
   * The default implementation returns `true`.
   */
  shouldUpdate(data: T, children: Elem[]): boolean {
    return true;
  }

  /**
   * Create the virtual DOM content for the component.
   *
   * The rendered content is used to populate the component's node.
   *
   * The default implementation returns `null`.
   */
  render(): Elem | Elem[] {
    return null;
  }

  /**
   * A method invoked immediately before the component is rendered.
   *
   * The default implementation is a no-op.
   */
  beforeRender(): void { }

  /**
   * A method invoked immediately after the component is rendered.
   *
   * The default implementation is a no-op.
   */
  afterRender(): void { }

  /**
   * Perform an immediate rendering of the component.
   */
  private _render(): void {
    this.beforeRender();
    this._refs = render(this.render(), this._node);
    this.afterRender();
  }

  /**
   * Cancel the pending update request.
   */
  private _cancelUpdate(): void {
    if (this._requestId !== 0) {
      cancelAnimationFrame(this._requestId);
      this._requestId = 0;
    }
  }

  private _requestId = 0;
  private _node: HTMLElement;
  private _data: T = emptyObject;
  private _refs: any = emptyObject;
  private _children: Elem[] = emptyArray;
}

} // module phosphor.virtualdom

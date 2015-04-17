/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import emptyObject = utility.emptyObject;


// cache frequently used globals
var raf = requestAnimationFrame;
var caf = cancelAnimationFrame;


/**
 * A concrete implementation of IComponent with virtual DOM rendering.
 *
 * User code should subclass this class to create a custom component.
 * The subclasses should reimplement the `render` method to generate
 * the virtual DOM content for the component.
 */
export
class Component<T extends IData> extends BaseComponent<T> {
  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._refs = null;
    this._cancelFrame();
    super.dispose();
  }

  /**
   * Get the refs mapping for the component.
   *
   * This is an object which maps a ref name to the corresponding node
   * or component instance created for the most recent rendering pass.
   */
  get refs(): any {
    return this._refs;
  }

  /**
   * Initialize the component with new data and children.
   *
   * This is called whenever the component is rendered by its parent.
   *
   * The method will normally not be reimplemented by a subclass.
   */
  init(data: T, children: IElement[]): void {
    var update = this.shouldUpdate(data, children);
    super.init(data, children);
    if (update) this.update(true);
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
   * If the 'immediate' flag is false (the default) the update will be
   * scheduled for the next cycle of the event loop. If the flag is set
   * to true, the component will be updated immediately.
   *
   * Multiple pending requests are collapsed into a single update.
   */
  update(immediate = false): void {
    if (immediate) {
      this._cancelFrame();
      this._render();
    } else if (this._frameId === 0) {
      this._frameId = raf(() => {
        this._frameId = 0;
        this._render();
      });
    }
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

  /**
   * Test whether the component should be updated.
   *
   * This method is invoked when the component is initialized with new
   * data and children. It should return true if the component should
   * be updated, or false if the values do not cause a visual change.
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
   * Perform an immediate rendering of the component.
   */
  private _render(): void {
    this.beforeRender();
    this._refs = render(this.render(), this.node);
    this.afterRender();
  }

  /**
   * Clear the pending animation frame.
   */
  private _cancelFrame(): void {
    if (this._frameId !== 0) {
      caf(this._frameId);
      this._frameId = 0;
    }
  }

  private _frameId = 0;
  private _refs = emptyObject;
}

} // module phosphor.virtualdom

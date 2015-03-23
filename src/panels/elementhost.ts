/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

import IMessage = core.IMessage;

import IElement = virtualdom.IElement;
import render = virtualdom.render;


/**
 * The class name added to element host panels.
 */
var ELEMENT_HOST_CLASS = 'p-ElementHost';


/**
 * A panel which hosts a virtual element.
 *
 * This is used to embed a virtual element into a panel hierarchy. This
 * is a simple panel which disallows an external layout. The intent is
 * that the element will provide the content for the panel, typically
 * in the form of a component which manages its own updates.
 */
export
class ElementHost extends Panel {
  /**
   * Construct a new element host.
   */
  constructor(element: IElement = null, width = 0, height = 0) {
    super();
    this.node.classList.add(ELEMENT_HOST_CLASS);
    this.setFlag(PanelFlag.DisallowLayoutChange);
    this._size = new Size(Math.max(0, width), Math.max(0, height));
    this._element = element;
  }

  /**
   * Get the virtual element hosted by the panel.
   */
  get element(): IElement {
    return this._element;
  }

  /**
   * Set the virtual element hosted by the panel.
   */
  set element(element: IElement) {
    element = element || null;
    if (element === this._element) {
      return;
    }
    this._element = element;
    render(element, this.node);
  }

  /**
   * Calculate the preferred size of the widget.
   */
  sizeHint(): Size {
    return this._size;
  }

  /**
   * Set the size hint for the widget.
   */
  setSizeHint(width: number, height: number): void {
    width = Math.max(0, width);
    height = Math.max(0, height);
    if (width === this._size.width && height === this._size.height) {
      return;
    }
    this._size = new Size(width, height);
    this.updateGeometry();
  }

  /**
   * A method invoked on an 'after-attach' message.
   */
  protected onAfterAttach(msg: IMessage): void {
    render(this._element, this.node);
  }

  /**
   * A method invoked on an 'after-detach' message.
   */
  protected onAfterDetach(msg: IMessage): void {
    render(null, this.node);
  }

  private _size: Size;
  private _element: IElement;
}

} // module phosphor.panels

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import IMessage = core.IMessage;

import Size = utility.Size;

import IElement = virtualdom.IElement;
import render = virtualdom.render;


/**
 * The class name added to element host panels.
 */
var ELEMENT_HOST_CLASS = 'p-ElementHost';


/**
 * A leaf widget which hosts a virtual element.
 *
 * This is used to embed a virtual element into a widget hierarchy. This
 * is a simple widget which disallows an external layout. The intent is
 * that the element will provide the content for the widget, typically
 * in the form of a component which manages its own updates.
 */
export
class ElementHost extends Widget {
  /**
   * Construct a new element host.
   */
  constructor(element: IElement = null, width = 0, height = 0) {
    super();
    this.addClass(ELEMENT_HOST_CLASS);
    this.setFlag(WidgetFlag.DisallowLayoutChange);
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
   * Calculate the preferred size of the panel.
   */
  sizeHint(): Size {
    return this._size;
  }

  /**
   * Set the preferred size for the panel.
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

} // module phosphor.widgets

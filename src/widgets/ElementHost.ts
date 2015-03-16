/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import ICoreEvent = core.ICoreEvent;

import WidgetFlag = enums.WidgetFlag;

import Size = geometry.Size;

import IVirtualElement = virtualdom.IVirtualElement;
import render = virtualdom.render;


/**
 * The class name added to element host widgets.
 */
var ELEMENT_HOST_CLASS = 'p-ElementHost';


/**
 * A Widget which hosts a virtual element.
 *
 * This widget can be used to embed an element in a widget hierarchy.
 */
export
class ElementHost extends Widget {
  /**
   * Construct a new console view.
   */
  constructor(element: IVirtualElement = null, width = 0, height = 0) {
    super();
    this.classList.add(ELEMENT_HOST_CLASS);
    this.setFlag(WidgetFlag.DisallowLayoutChange);
    width = Math.max(0, width);
    height = Math.max(0, height);
    this._m_element = element;
    this._m_preferredSize = new Size(width, height);
  }

  /**
   * Get the virtual element hosted by the widget.
   */
  get element(): IVirtualElement {
    return this._m_element;
  }

  /**
   * Set the virtual element hosted by the widget.
   */
  set element(element: IVirtualElement) {
    element = element || null;
    if (element === this._m_element) {
      return;
    }
    this._m_element = element;
    render(element, this.node);
  }

  /**
   * Calculate the preferred size of the widget.
   */
  sizeHint(): Size {
    return this._m_preferredSize;
  }

  /**
   * Set the preferred size for the widget.
   */
  setPreferredSize(width: number, height: number): void {
    width = Math.max(0, width);
    height = Math.max(0, height);
    var old = this._m_preferredSize;
    if (width === old.width && height === old.height) {
      return;
    }
    this._m_preferredSize = new Size(width, height);
    this.updateGeometry();
  }

  /**
   * A method invoked on the 'after-attach' event.
   */
  protected afterAttachEvent(event: ICoreEvent): void {
    render(this._m_element, this.node);
  }

  /**
   * A method invoked on the 'after-detach' event.
   */
  protected afterDetachEvent(event: ICoreEvent): void {
    render(null, this.node);
  }

  private _m_preferredSize: Size;
  private _m_element: IVirtualElement;
}

} // module phosphor.widgets

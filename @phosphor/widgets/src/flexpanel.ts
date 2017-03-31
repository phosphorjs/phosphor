/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  move
} from '../algorithm/mutation';

import {
  Vector
} from '../collections/vector';

import {
  Message, sendMessage
} from '../core/messaging';

import {
  IS_IE
} from '../dom/platform';

import {
  Panel, PanelLayout
} from '../ui/panel';

import {
  ChildMessage, ResizeMessage, Widget, WidgetMessage
} from '../ui/widget';


/**
 * The class name added to FlexPanel instances.
 */
const FLEX_PANEL_CLASS = 'p-FlexPanel';

/**
 * The class name added to a FlexPanel child.
 */
const CHILD_CLASS = 'p-FlexPanel-child';

/**
 * The class name added to left-to-right flex layout parents.
 */
const LEFT_TO_RIGHT_CLASS = 'p-mod-left-to-right';

/**
 * The class name added to right-to-left flex layout parents.
 */
const RIGHT_TO_LEFT_CLASS = 'p-mod-right-to-left';

/**
 * The class name added to top-to-bottom flex layout parents.
 */
const TOP_TO_BOTTOM_CLASS = 'p-mod-top-to-bottom';

/**
 * The class name added to bottom-to-top flex layout parents.
 */
const BOTTOM_TO_TOP_CLASS = 'p-mod-bottom-to-top';


/**
 * Describes how to align children in the direction of the layout.
 */
export
type ContentJustification = 'start' | 'end' | 'center' | 'space-between' | 'space-around';


/**
 * If layout is set to wrap, this defines how the wrapped lines will be
 * aligned in relation ro each other.
 */
export
type ContentAlignment = ContentJustification | 'stretch';

/**
 * Controls how to align children in the direction perpendicular to that
 * of the layout (for a horizontal layout the will be the vertical align,
 * and vice-versa).
 */
export
type ItemAlignment = 'start' | 'end' | 'center' | 'baseline' | 'stretch';

/**
 * Describe how to stretch items to fit into flex panel:
 * 'grow': Allow items to grow from default size
 * 'shrink': Allow items to shrink from default size
 * 'both': Both growing and shrinking is allowed.
 * 'fixed': Do not allow either growing or shrinking.
 */
export
type StretchType = 'grow' | 'shrink' | 'both' | 'fixed';


function wrapLayoutProperties(widgetClass: { prototype: any },
                              layoutClass: { prototype: any },
                              properties: string[]): void {
  for (let property of properties) {
    let desc = Object.getOwnPropertyDescriptor(layoutClass.prototype, property);
    let newDesc: PropertyDescriptor = {
      get: function () { return this.layout[property]; },
      set: function (value: any) { this.layout[property] = value; },
      enumerable: desc.enumerable,
      configurable: desc.configurable
    };
    Object.defineProperty(widgetClass.prototype, property, newDesc);
  }
}

/**
 * A panel which arranges its widgets in a single row or column.
 *
 * Use the direction attribute to specify the layout direction.
 *
 * The sizing and flow of the children can be specified in several ways:
 *  - The container level properties `minimumSpacing`,`wrap`,
 *    `justifyContent`, `alignItems` and `alignContent`.
 *  - The stretching of the children in the layout direction either by:
 *    - Setting individual values per widget of grow/shrink/basis by
 *      `setGrow`, `setShrink` and `setSizeBasis`.
 *    - Using the convenience attributes `evenSizes` or `stretchType`.
 *  - Manually by CSS using the flexbox CSS attribute for the classes
 *    `p-FlexPanel` and `p-FlexPanel-child`.
 *
 * #### Notes
 * This class provides a convenience wrapper around a [[FlexLayout]].
 */
export
class FlexPanel extends Panel {
  /**
   * Construct a new flex panel.
   *
   * @param options - The options for initializing the flex panel.
   */
  constructor(options: FlexPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) });
    if (!options.layout) {
        if (options.minimumSpacing !== void 0) {
            this.minimumSpacing = options.minimumSpacing;
        }
        if (options.direction !== void 0) {
            this.direction = options.direction;
        }
    }
    this.addClass(FLEX_PANEL_CLASS);
  }

  /**
   * Get the layout direction for the flex panel.
   */
  direction: FlexPanel.Direction;

  /**
   * Get the minimum inter-element spacing for the flex panel.
   */
  minimumSpacing: number;

  /**
   * Whether the layout should wrap its children if they do not all fit in
   * column/row.
   */
  wrap: boolean;

  /**
   * Controls how to align children in the direction of the layout.
   */
  justifyContent: ContentJustification;

  /**
   * Controls how to align children in the direction perpendicular to that
   * of the layout (for a horizontal layout the will be the vertical align,
   * and vice-versa).
   */
  alignItems: ItemAlignment;

  /**
   * If layout is set to wrap, this defines how the wrapped lines will be
   * aligned in relation ro each other.
   */
  alignContent: ContentAlignment;

  /**
   * Describe how to stretch items to fit into flex panel.
   */
  stretchType: StretchType;

  /**
   * If set the free space is distributed such that the
   * children are all the same size. Defaults to `false`.
   *
   * ### Notes
   * Setting this to `true` will make the layout
   * ignore the setting of `stretchType`.
   */
  evenSizes: boolean;

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: ChildMessage): void {
    msg.child.addClass(CHILD_CLASS);
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    msg.child.removeClass(CHILD_CLASS);
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.fit();
  }
}

/**
 * The namespace for the `FlexPanel` class statics.
 */
export
namespace FlexPanel {
  /**
   * A type alias for a flex panel direction.
   */
  export
  type Direction = FlexLayout.Direction;

  /**
   * An options object for initializing a flex panel.
   */
  export
  interface IOptions extends FlexLayout.IOptions, Panel.IOptions {
    /**
     * The flex layout to use for the flex panel.
     *
     * If this is provided, the other options are ignored.
     *
     * The default is a new `FlexLayout`.
     */
    layout?: FlexLayout;
  }

  /**
   * Get the flex panel grow factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The flex panel stretch factor for the widget.
   */
  export
  function getGrow(widget: Widget): number {
    return FlexLayout.getGrow(widget);
  }

  /**
   * Set the flex panel grow factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export
  function setGrow(widget: Widget, value: number): void {
    FlexLayout.setGrow(widget, value);
  }

  /**
   * Get the flex panel grow factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The flex panel stretch factor for the widget.
   */
  export
  function getShrink(widget: Widget): number {
    return FlexLayout.getShrink(widget);
  }

  /**
   * Set the flex panel grow factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export
  function setShrink(widget: Widget, value: number): void {
    FlexLayout.setShrink(widget, value);
  }

  /**
   * Get the flex panel size basis for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The flex panel size basis for the widget.
   */
  export
  function getSizeBasis(widget: Widget): number | "auto" {
    return FlexLayout.getSizeBasis(widget);
  }

  /**
   * Set the flex panel size basis for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the size basis.
   */
  export
  function setSizeBasis(widget: Widget, value: number | "auto"): void {
    FlexLayout.setSizeBasis(widget, value);
  }
}


/**
 * A layout which arranges its widgets in a single row or column.
 *
 * Use the direction attribute to specify the layout direction.
 *
 * The sizing and flow of the children can be specified in several ways:
 *  - The container level properties `minimumSpacing`,`wrap`,
 *    `justifyContent`, `alignItems` and `alignContent`.
 *  - The stretching of the children in the layout direction either by:
 *    - Setting individual values per widget of grow/shrink/basis by
 *      `setGrow`, `setShrink` and `setSizeBasis`.
 *    - Using the convenience attributes `evenSizes` or `stretchType`.
 *  - Manually by CSS using the flexbox CSS attribute for the classes
 *    `p-FlexPanel` and `p-FlexPanel-child`.
 */
export
class FlexLayout extends PanelLayout {
  /**
   * Construct a new flex layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: FlexLayout.IOptions = {}) {
    super();
    if (options.direction !== void 0) {
      this._direction = options.direction;
    }
    if (options.minimumSpacing !== void 0) {
      this._minimumSpacing = Private.clampSpacing(options.minimumSpacing);
    }
    if (options.wrap !== void 0) {
      this._wrap = options.wrap;
    }
    if (options.justifyContent !== void 0) {
      this._justifyContent = options.justifyContent;
    }
    if (options.alignItems !== void 0) {
      this._alignItems = options.alignItems;
    }
    if (options.alignContent !== void 0) {
      this._alignContent = options.alignContent;
    }
    if (options.stretchType !== void 0) {
      this._stretchType = options.stretchType;
    }
    if (options.evenSizes !== void 0) {
      this._evenSizes = options.evenSizes;
    }
  }

  /**
   * Get the layout direction for the flex layout.
   */
  get direction(): FlexLayout.Direction {
    return this._direction;
  }

  /**
   * Set the layout direction for the flex layout.
   */
  set direction(value: FlexLayout.Direction) {
    if (this._direction === value) {
      return;
    }
    this._direction = value;
    if (!this.parent) {
      return;
    }
    Private.toggleDirection(this.parent, value);
    this.parent.fit();
  }

  /**
   * Get the minimum inter-element spacing for the flex layout.
   */
  get minimumSpacing(): number {
    return this._minimumSpacing;
  }

  /**
   * Set the minimum inter-element spacing for the flex layout.
   */
  set minimumSpacing(value: number) {
    value = Private.clampSpacing(value);
    if (this._minimumSpacing === value) {
      return;
    }
    this._minimumSpacing = value;
    if (this.parent) {
      this.parent.node.style.flexWrap = value ? 'wrap' : 'nowrap';
      this.parent.fit();
    }
  }

  /**
   * Whether the layout should wrap its children if they do not all fit in
   * column/row.
   */
  get wrap(): boolean {
    return this._wrap;
  }

  set wrap(value: boolean) {
    if (this._wrap !== value) {
      this._wrap = value;
      if (this.parent) {
        this.parent.fit();
      }
    }
  }

  /**
   * Controls how to align children in the direction of the layout.
   */
  get justifyContent(): ContentJustification {
    return this._justifyContent;
  }

  set justifyContent(value: ContentJustification) {
    if (this._justifyContent !== value) {
      this._justifyContent = value;
      let flex = Private.translateFlexString(value as string);
      this.parent.node.style.justifyContent = flex;
      this.parent.fit();
    }
  }

  /**
   * Controls how to align children in the direction perpendicular to that
   * of the layout (for a horizontal layout the will be the vertical align,
   * and vice-versa).
   */
  get alignItems(): ItemAlignment {
    return this._alignItems;
  }

  set alignItems(value: ItemAlignment) {
    if (this._alignItems !== value) {
      this._alignItems = value;
      let flex = Private.translateFlexString(value as string);
      this.parent.node.style.alignItems = flex;
      this.parent.fit();
    }
  }

  /**
   * If layout is set to wrap, this defines how the wrapped lines will be
   * aligned in relation ro each other.
   */
  get alignContent(): ContentAlignment {
    return this._alignContent;
  }

  set alignContent(value: ContentAlignment) {
    if (this._alignContent !== value) {
      this._alignContent = value;
      let flex = Private.translateFlexString(value as string);
      if (!this.parent) {
        return;
      }
      this.parent.node.style.alignContent = flex;
      // Setting has no effect unless wrap is true, but
      // check against false to accomodate unset scenario
      // where CSS rules might apply:
      if (this._wrap !== false) {
        this.parent.fit();
      }
    }
  }

  /**
   * Describe how to stretch items to fit into flex panel.
   */
  get stretchType(): StretchType {
    return this._stretchType;
  }

  set stretchType(value: StretchType) {
    if (this._stretchType !== value) {
      this._stretchType = value;
      if (this.parent) {
        this.parent.fit();
      }
    }
  }

  /**
   * If set the free space is distributed such that the
   * children are all the same size. Defaults to `false`.
   *
   * ### Notes
   * Setting this to `true` will make the layout
   * ignore the setting of `stretchType`.
   */
  get evenSizes(): boolean {
    return this._evenSizes;
  }

  set evenSizes(value: boolean) {
    if (this._evenSizes !== value) {
      this._evenSizes = value;
      if (this.parent) {
        this.parent.fit();
      }
    }
  }

  /**
   * Determine whether direction is a horizontal one
   */
  isHorizontal(): boolean {
    return this.direction === 'right-to-left' || this.direction === 'left-to-right';
  }

  /**
   * Determine whether direction is a vertical one
   */
  isVertical(): boolean {
    return !this.isHorizontal();
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected attachWidget(index: number, widget: Widget): void {
    // Call super implmentation
    super.attachWidget(index, widget);

    // Set order, if applicable
    if (this.order) {
      this.order.insert(index, widget);
    }

    // Post a layout request for the parent widget.
    this.parent.fit();
  }

  /**
   * Change a widget's display order.
   *
   * @param fromIndex - The previous index of the widget in the layout.
   *
   * @param toIndex - The current index of the widget in the layout.
   *
   * @param widget - The widget to move in the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected moveWidget(fromIndex: number, toIndex: number, widget: Widget): void {
    if (fromIndex !== toIndex) {
      // Change the order of the widget.
      if (!this.order) {
        this.order = new Vector(this.widgets);
      }
      move(this.order, fromIndex, toIndex);
      this._dirty = true;
    }

    // Post an update request for the parent widget.
    this.parent.update();
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param index - The previous index of the widget in the layout.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected detachWidget(index: number, widget: Widget): void {
    // Remove widget from order vector
    if (this.order) {
      let i = 0;
      for (; i < this.order.length; ++i) {
        if (widget === this.order.at(i)) {
          this.order.removeAt(i);
          break;
        }
      }
    }
    // Call super implmentation
    super.detachWidget(index, widget);

    // Post a layout request for the parent widget.
    this.parent.fit();
  }

  /**
   * A message handler invoked on a `'layout-changed'` message.
   *
   * #### Notes
   * This is called when the layout is installed on its parent.
   */
  protected onLayoutChanged(msg: Message): void {
    Private.toggleDirection(this.parent, this.direction);
    super.onLayoutChanged(msg);
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   */
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.parent.update();
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    Private.toggleDirection(this.parent, this._direction);
    let style = this.parent.node.style;
    style.flexWrap = this._wrap ? 'wrap' : 'nowrap';
    style.justifyContent = Private.translateFlexString(this._justifyContent);
    style.alignContent = Private.translateFlexString(this._alignContent);
    style.alignItems = Private.translateFlexString(this._alignItems);
    this.parent.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: ChildMessage): void {
    if (IS_IE) { // prevent flicker on IE
      sendMessage(this.parent, WidgetMessage.FitRequest);
    } else {
      this.parent.fit();
    }
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: ChildMessage): void {
    if (IS_IE) { // prevent flicker on IE
      sendMessage(this.parent, WidgetMessage.FitRequest);
    } else {
      this.parent.fit();
    }
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: ResizeMessage): void {
    if (this.parent.isVisible) {
      this._update();
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent.isVisible) {
      this._update();
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent.isAttached) {
      this._fit();
    }
  }

  protected order: Vector<Widget> = null;

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    let ancestor = this.parent.parent;
    if (ancestor) {
      sendMessage(ancestor, WidgetMessage.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      sendMessage(this.parent, WidgetMessage.UpdateRequest);
    }
  }

  /**
   * Update the layout position and size of the widgets.
   *
   * The parent offset dimensions should be `-1` if unknown.
   */
  private _update(): void {
    // Clear the dirty flag to indicate the update occurred.
    this._dirty = false;

    // Bail early if there are no widgets to layout.
    let widgets = this.order || this.widgets;
    if (widgets.length === 0) {
      return;
    }

    // Set spacing by margins
    let spacing = this.minimumSpacing.toString() + 'px';
    if (this.isHorizontal()) {
      for (let i = 0; i < widgets.length - 1; ++i) {
        widgets.at(i).node.style.marginRight = spacing;
      }
    } else {
      for (let i = 0; i < widgets.length - 1; ++i) {
        widgets.at(i).node.style.marginBottom = spacing;
      }
    }

    // Update stretch styles if set
    if (this._evenSizes || this.stretchType) {
      let basis: number = null;
      let grow: number = null;
      let shrink: number = null;
      if (this._evenSizes) {
        basis = 0;
        grow = 1;
      } else {
        switch (this._stretchType) {
        case 'grow':
          // Allow items to grow from default size
          grow = 1;
          shrink = 0;
          break;
        case 'shrink':
          // Allow items to shrink from default size
          grow = 0;
          shrink = 1;
          break;
        case 'both':
          // Both growing and shrinking is allowed.
          grow = 1;
          shrink = 1;
          break;
        case 'fixed':
          // Do not allow either growing or shrinking.
          grow = 0;
          shrink = 0;
          break;
        default:
          throw 'Invalid stretch type: ' + this._stretchType;
        }
      }
      for (let i = 0; i < widgets.length; ++i) {
        let style = widgets.at(i).node.style;
        if (basis !== null) {
          // Can only be 0, so no unit needed
          style.flexBasis = basis.toString();
        }
        if (grow !== null) {
          style.flexGrow = grow.toString();
        }
        if (shrink !== null) {
          style.flexShrink = shrink.toString();
        }
      }
    }

    // Update display order
    for (let i = 0; i < widgets.length; ++i) {
      let widget = widgets.at(i);
      widget.node.style.order = this.order ?  i.toString() : '';
    }
  }

  private _wrap = false;
  private _minimumSpacing = 4;
  private _justifyContent: ContentJustification;
  private _alignItems: ItemAlignment;
  private _alignContent: ContentAlignment;
  private _dirty = false;
  private _direction: FlexLayout.Direction = 'top-to-bottom';
  private _stretchType: StretchType = null;
  private _evenSizes: boolean = false;
}

wrapLayoutProperties(FlexPanel, FlexLayout, [
  'direction', 'minimumSpacing', 'wrap', 'justifyContent',
  'alignItems', 'alignContent', 'stretchType',
  'evenSizes']);


/**
 * The namespace for the `FlexLayout` class statics.
 */
export
namespace FlexLayout {
  /**
   * A type alias for a flex layout direction.
   */
  export
  type Direction = (
    'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top'
  );

  /**
   * An options object for initializing a flex layout.
   */
  export
  interface IOptions {
    /**
     * The direction of the layout.
     *
     * The default is `'top-to-bottom'`.
     */
    direction?: Direction;

    /**
     * The minimum spacing between items in the layout.
     *
     * The default is `4`.
     */
    minimumSpacing?: number;

    /**
     * Whether the layout should wrap its children if they do not all fit in
     * column/row.
     */
    wrap?: boolean;

    /**
     * Controls how to align children in the direction of the layout.
     */
    justifyContent?: ContentJustification;

    /**
     * Controls how to align children in the direction perpendicular to that
     * of the layout (for a horizontal layout the will be the vertical align,
     * and vice-versa).
     */
    alignItems?: ItemAlignment;

    /**
     * If layout is set to wrap, this defines how the wrapped lines will be
     * aligned in relation ro each other.
     */
    alignContent?: ContentAlignment;

    /**
     * Describe how to stretch items to fit into flex panel.
     */
    stretchType?: StretchType;

    /**
     * If set the free space is distributed such that the
     * children are all the same size. Defaults to `false`.
     *
     * ### Notes
     * Setting this to `true` will make the layout
     * ignore the setting of `stretchType`.
     */
    evenSizes?: boolean;
  }

  /**
   * Get the flex-grow number of the widget
   */
  export
  function getGrow(widget: Widget): number {
    let value = widget.node.style.flexGrow;
    return value ? parseInt(value, 10) : null;
  }

  /**
   * Set the flex-grow number of the widget
   */
  export
  function setGrow(widget: Widget, value: number, fit=true) {
    widget.node.style.flexGrow = value === null ? '' : value.toString();
    if (fit && widget.parent) {
      widget.parent.fit();
    }
  }

  /**
   * Get the flex-shrink number of the widget
   */
  export
  function getShrink(widget: Widget): number {
    let value = widget.node.style.flexShrink;
    return value ? parseInt(value, 10) : null;
  }

  /**
   * Set the flex-shrink number of the widget
   */
  export
  function setShrink(widget: Widget, value: number, fit=true) {
    widget.node.style.flexShrink = value === null ? '' : value.toString();
    if (fit && widget.parent) {
      widget.parent.fit();
    }
  }

  /**
   * Get the size basis of the widget.
   */
  export
  function getSizeBasis(widget: Widget): number | 'auto' {
    let value = widget.node.style.flexBasis;
    if (value === 'auto') {
      return 'auto';
    } else {
      return value ? parseInt(value.replace('px', ''), 10) : undefined;
    }
  }

  /**
   * Set the size basis of the widget.
   *
   * This is the value used for calculating how to distribute positive
   * (grow) or negatie (shrink) free space in a flex box. The value
   * `'auto'` uses the `width`/`height` field of the box as the basis.
   */
  export
  function setSizeBasis(widget: Widget, value: number | 'auto', fit=true) {
    if (value === 'auto') {
      widget.node.style.flexBasis = value as string;
    } else {
      widget.node.style.flexBasis = value.toString() + 'px';
    }
    if (fit && widget.parent) {
      widget.parent.fit();
    }
  }
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Create a flex layout for the given panel options.
   */
  export
  function createLayout(options: FlexPanel.IOptions): FlexLayout {
    return options.layout || new FlexLayout(options);
  }

  /**
   * Test whether a direction has horizontal orientation.
   */
  export
  function isHorizontal(dir: FlexLayout.Direction): boolean {
    return dir === 'left-to-right' || dir === 'right-to-left';
  }

  /**
   * Transforms 'start'/'end' into 'flex-start'/'flex-end',
   * and returns other strings untouched.
   */
  export
  function translateFlexString(value: string): string {
    if (value === 'start' || value === 'end') {
      value = 'flex-' + value;
    }
    return value;
  }

  /**
   * Toggle the CSS direction class for the given widget.
   */
  export
  function toggleDirection(widget: Widget, dir: FlexLayout.Direction): void {
    widget.toggleClass(LEFT_TO_RIGHT_CLASS, dir === 'left-to-right');
    widget.toggleClass(RIGHT_TO_LEFT_CLASS, dir === 'right-to-left');
    widget.toggleClass(TOP_TO_BOTTOM_CLASS, dir === 'top-to-bottom');
    widget.toggleClass(BOTTOM_TO_TOP_CLASS, dir === 'bottom-to-top');
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }
}

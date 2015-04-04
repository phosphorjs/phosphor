/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

/**
 * The class name added to BoxPanel instances.
 */
var BOX_PANEL_CLASS = 'p-BoxPanel';


/**
 * A panel which arranges its children in a row or column.
 */
export
class BoxPanel extends Panel {
  /**
   * Construct a new box panel.
   */
  constructor(direction = Direction.TopToBottom, spacing = 8) {
    super(new BoxLayout(direction, spacing));
    this.addClass(BOX_PANEL_CLASS);
  }

  /**
   * Get the layout direction for the panel.
   */
  get direction(): Direction {
    return (<BoxLayout>this.layout).direction;
  }

  /**
   * Set the layout direction for the panel.
   */
  set direction(direction: Direction) {
    (<BoxLayout>this.layout).direction = direction;
  }

  /**
   * Get the inter-element fixed spacing for the panel.
   */
  get spacing(): number {
    return (<BoxLayout>this.layout).spacing;
  }

  /**
   * Set the inter-element fixed spacing for the panel.
   */
  set spacing(spacing: number) {
    (<BoxLayout>this.layout).spacing = spacing;
  }

  /**
   * Add a child widget to the end of the panel.
   *
   * If the widget already exists, it will be moved.
   *
   * Returns the index of the added widget.
   */
  addWidget(widget: Widget, stretch = 0, alignment: Alignment = 0): number {
    return (<BoxLayout>this.layout).addWidget(widget, stretch, alignment);
  }

  /**
   * Insert a child widget into the panel at the given index.
   *
   * If the widget already exists, it will be moved.
   *
   * Returns the index of the added widget.
   */
  insertWidget(index: number, widget: Widget, stretch = 0, alignment: Alignment = 0): number {
    return (<BoxLayout>this.layout).insertWidget(index, widget, stretch, alignment);
  }

  /**
   * Add a fixed amount of spacing to the end of the panel.
   *
   * Returns the index of the added space.
   */
  addSpacing(size: number): number {
    return (<BoxLayout>this.layout).addSpacing(size);
  }

  /**
   * Insert a fixed amount of spacing at the given index.
   *
   * Returns the index of the added space.
   */
  insertSpacing(index: number, size: number): number {
    return (<BoxLayout>this.layout).insertSpacing(index, size);
  }

  /**
   * Add stretchable space to the end of the panel.
   *
   * Returns the index of the added space.
   */
  addStretch(stretch = 0): number {
    return (<BoxLayout>this.layout).addStretch(stretch);
  }

  /**
   * Insert stretchable space at the given index.
   *
   * Returns the index of the added space.
   */
  insertStretch(index: number, stretch = 0): number {
    return (<BoxLayout>this.layout).insertStretch(index, stretch);
  }

  /**
   * Get the stretch factor for the given widget or item index.
   *
   * Returns -1 if no suitable layout item is found.
   */
  stretch(which: Widget | number): number {
    return (<BoxLayout>this.layout).stretch(which);
  }

  /**
   * Set the stretch factor for the given widget or item index.
   *
   * Returns true if the stretch was updated, false otherwise.
   */
  setStretch(which: Widget | number, stretch: number): boolean {
    return (<BoxLayout>this.layout).setStretch(which, stretch);
  }
}

} // module phosphor.widgets

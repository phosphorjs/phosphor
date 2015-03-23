/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

/**
 * The class name added to BoxPanel instances.
 */
var BOX_PANEL_CLASS = 'p-BoxPanel';


/**
 * A panel which arranges its children in a row or column
 *
 * This panel delegates to a permanently installed box layout and
 * can be used as a more convenient interface to a box layout.
 */
export
class BoxPanel extends Panel {
  /**
   * Construct a new box panel.
   */
  constructor(direction = Direction.TopToBottom, spacing = 8) {
    super();
    this.node.classList.add(BOX_PANEL_CLASS);
    var layout = this.layout = new BoxLayout(direction, spacing);
    this.setFlag(PanelFlag.DisallowLayoutChange);
  }

  /**
   * Get the layout direction for the box.
   */
  get direction(): Direction {
    return (<BoxLayout>this.layout).direction;
  }

  /**
   * Set the layout direction for the box.
   */
  set direction(direction: Direction) {
    (<BoxLayout>this.layout).direction = direction;
  }

  /**
   * Get the inter-element fixed spacing for the box.
   */
  get spacing(): number {
    return (<BoxLayout>this.layout).spacing;
  }

  /**
   * Set the inter-element fixed spacing for the box.
   */
  set spacing(spacing: number) {
    (<BoxLayout>this.layout).spacing = spacing;
  }

  /**
   * Get the number of items (panels + spacers) in the box.
   */
  get count(): number {
    return (<BoxLayout>this.layout).count;
  }

  /**
   * Get the index of the given panel.
   */
  indexOf(panel: Panel): number {
    return (<BoxLayout>this.layout).indexOf(panel);
  }

  /**
   * Add a child panel to the end of the split panel.
   *
   * If the panel already exists, it will be moved.
   *
   * Returns the index of the added panel.
   */
  add(panel: Panel): number {
    return (<BoxLayout>this.layout).add(panel);
  }

  /**
   * Insert a child panel into the split panel at the given index.
   *
   * If the panel already exists, it will be moved.
   *
   * Returns the index of the added panel.
   */
  insert(index: number, panel: Panel): number {
    return (<BoxLayout>this.layout).insert(index, panel);
  }

  /**
   * Add a fixed amount of spacing to the end of the box.
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
   * Add stretchable space to the end of the box.
   *
   * Returns the index of the added space.
   */
  addStretch(stretch = 0): number {
    return (<BoxLayout>this.layout).addStretch(stretch);
  }

  /**
   * Insert stretchable space at the given index.
   */
  insertStretch(index: number, stretch = 0): number {
    return (<BoxLayout>this.layout).insertStretch(index, stretch);
  }
}

} // module phosphor.panels

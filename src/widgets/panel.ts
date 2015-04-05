/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

/**
 * A widget which delegates to a permanently installed layout.
 *
 * This is used as a base class for common panel widgets.
 */
export
class Panel extends Widget {
  /**
   * Construct a new panel.
   */
  constructor(layout: Layout) {
    super();
    this.layout = layout;
    this.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * Get the number of items (widgets + spacers) in the panel.
   */
  get count(): number {
    return this.layout.count;
  }

  /**
   * Get the index of the given widget.
   *
   * Returns -1 if the widget is not found.
   */
  indexOf(widget: Widget): number {
    return this.layout.indexOf(widget);
  }

  /**
   * Get the widget at the given index.
   *
   * Returns `undefined` if there is no widget at the given index.
   */
  widgetAt(index: number): Widget {
    return this.layout.widgetAt(index);
  }

  /**
   * Get the alignment for the given widget.
   *
   * Returns 0 if the widget is not found in the panel.
   */
  alignment(widget: Widget): Alignment {
    return this.layout.alignment(widget);
  }

  /**
   * Set the alignment for the given widget.
   *
   * Returns true if the alignment was updated, false otherwise.
   */
  setAlignment(widget: Widget, alignment: Alignment): boolean {
    return this.layout.setAlignment(widget, alignment);
  }
}

} // module phosphor.widgets

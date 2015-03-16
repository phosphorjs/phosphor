/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import some = algorithm.some;

import ICoreEvent = core.ICoreEvent;

import Widget = widgets.Widget;


/**
 * A widget which hides itself when all of its children are hidden.
 *
 * The primary use of the widget is as a region panel for the case
 * where a region should not be visible if it has no content or if
 * all of its content is hidden.
 */
export
class AutoHidePanel extends Widget {
  /**
   * Construct a new auto hide widget.
   */
  constructor() {
    super();
    this.hide();
  }

  /**
   * Process an event dispatched to the widget.
   */
  processEvent(event: ICoreEvent): void {
    switch (event.type) {
      case 'child-added':
      case 'child-removed':
      case 'child-shown':
      case 'child-hidden':
        this._updateVisibility();
    }
    super.processEvent(event);
  }

  /**
   * Update the visibility of the panel.
   *
   * The panel is shown iff it has at least one visible child.
   */
  private _updateVisibility(): void {
    if (this._hasVisibleChild()) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Test whether the panel has at least one visible child.
   */
  private _hasVisibleChild(): boolean {
    return some(this.children, child => !child.isHidden);
  }
}

} // module phosphor.shell

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

/**
 * The class name added to SinglePanel instances.
 */
var SINGLE_PANEL_CLASS = 'p-SinglePanel';


/**
 * A panel which holds a single child.
 *
 * This panel delegates to a permanently installed single layout and
 * can be used as a more convenient interface to a single layout.
 */
export
class SinglePanel extends Panel {
  /**
   * Construct a new single panel.
   */
  constructor(panel?: Panel) {
    super();
    this.node.classList.add(SINGLE_PANEL_CLASS);
    this.layout = new SingleLayout(panel);
    this.setFlag(PanelFlag.DisallowLayoutChange);
  }

  /**
   * Get the managed child panel.
   */
  get panel(): Panel {
    return (<SingleLayout>this.layout).panel;
  }

  /**
   * Set the managed child panel.
   */
  set panel(panel: Panel) {
    (<SingleLayout>this.layout).panel = panel;
  }
}

} // module phosphor.panels

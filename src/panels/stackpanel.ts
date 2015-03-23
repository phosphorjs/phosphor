/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

import Signal = core.Signal;


/**
 * The class name added to StackPanel instances.
 */
var STACK_PANEL_CLASS = 'p-StackPanel';


/**
 * A panel where only one child is visible at a time.
 *
 * This panel delegates to a permanently installed stack layout and
 * can be used as a more convenient interface to a stack layout.
 */
export
class StackPanel extends Panel {
  /**
   * A signal emitted when the current index changes.
   */
  currentChanged = new Signal<StackPanel, IStackIndexArgs>();

  /**
   * A signal emitted when a panel is removed from the stack.
   */
  panelRemoved = new Signal<StackPanel, IStackIndexArgs>();

  /**
   * Construct a new stack panel.
   */
  constructor() {
    super();
    this.node.classList.add(STACK_PANEL_CLASS);
    var layout = this.layout = new StackLayout();
    this.setFlag(PanelFlag.DisallowLayoutChange);
    layout.currentChanged.connect(this._sl_currentChanged, this);
    layout.panelRemoved.connect(this._sl_panelRemoved, this);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    this.currentChanged.disconnect();
    this.panelRemoved.disconnect();
    super.dispose();
  }

  /**
   * Get the current index of the stack.
   */
  get currentIndex(): number {
    return (<StackLayout>this.layout).currentIndex;
  }

  /**
   * Set the current index of the stack.
   */
  set currentIndex(index: number) {
    (<StackLayout>this.layout).currentIndex = index;
  }

  /**
   * Get the current panel in the stack.
   */
  get currentPanel(): Panel {
    return (<StackLayout>this.layout).currentPanel;
  }

  /**
   * Set the current panel in the stack.
   */
  set currentPanel(panel: Panel) {
    (<StackLayout>this.layout).currentPanel = panel;
  }

  /**
   * Get the number of panels in the stack.
   */
  get count(): number {
    return (<StackLayout>this.layout).count;
  }

  /**
   * Get the index of the given panel.
   */
  indexOf(panel: Panel): number {
    return (<StackLayout>this.layout).indexOf(panel);
  }

  /**
   * Add a child panel to the end of the split panel.
   *
   * If the panel already exists, it will be moved.
   *
   * Returns the index of the added panel.
   */
  add(panel: Panel): number {
    return (<StackLayout>this.layout).add(panel);
  }

  /**
   * Insert a child panel into the split panel at the given index.
   *
   * If the panel already exists, it will be moved.
   *
   * Returns the index of the added panel.
   */
  insert(index: number, panel: Panel): number {
    return (<StackLayout>this.layout).insert(index, panel);
  }

  /**
   * Move a child panel from one index to another.
   *
   * Returns the new index of the panel.
   */
  move(fromIndex: number, toIndex: number): number {
    return (<StackLayout>this.layout).move(fromIndex, toIndex);
  }

  /**
   * Handle the `currentChanged` signal for the stack layout.
   */
  private _sl_currentChanged(sender: StackLayout, args: IStackIndexArgs): void {
    this.currentChanged.emit(this, args);
  }

  /**
   * Handle the `panelChanged` signal for the stack layout.
   */
  private _sl_panelRemoved(sender: StackLayout, args: IStackIndexArgs): void {
    this.panelRemoved.emit(this, args);
  }
}

} // module phosphor.panels

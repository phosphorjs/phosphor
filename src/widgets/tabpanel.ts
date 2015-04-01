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
 * The class name added to tab panel instances.
 */
var TAB_PANEL_CLASS = 'p-TabPanel';


/**
 * A panel which provides a tabbed container for child panels.
 *
 * The TabPanel provides a convenient combination of a tab bar and
 * a stack panel which allows the user to toggle between panels by
 * selecting the tab associated with a tabbable panel.
 */
export
class TabPanel extends Panel {
  /**
   * A signal emitted when the current panel is changed.
   */
  currentChanged = new Signal<TabPanel, IStackIndexArgs>();

  /**
   * Construct a new tab panel.
   */
  constructor() {
    super();
    this.node.classList.add(TAB_PANEL_CLASS);
    this.layout = new BoxLayout(Direction.TopToBottom, 0);
    this.setFlag(PanelFlag.DisallowLayoutChange);

    var bar = this._tabBar = new TabBar();
    bar.tabMoved.connect(this._tb_tabMoved, this);
    bar.currentChanged.connect(this._tb_currentChanged, this);
    bar.tabCloseRequested.connect(this._tb_tabCloseRequested, this);

    var stack = this._stackPanel = new StackPanel();
    stack.panelRemoved.connect(this._sw_panelRemoved, this);

    (<BoxLayout>this.layout).addPanel(bar);
    (<BoxLayout>this.layout).addPanel(stack);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    this._tabBar = null;
    this._stackPanel = null;
    this.currentChanged.disconnect();
    super.dispose();
  }

  /**
   * Get the index of the currently selected panel.
   */
  get currentIndex(): number {
    return this._stackPanel.currentIndex;
  }

  /**
   * Set the index of the currently selected panel.
   */
  set currentIndex(index: number) {
    this._tabBar.currentIndex = index;
  }

  /**
   * Get the currently selected panel.
   */
  get currentPanel(): Panel {
    return this._stackPanel.currentPanel;
  }

  /**
   * Set the currently selected panel.
   */
  set currentPanel(panel: Panel) {
    this._tabBar.currentIndex = this.indexOf(panel);
  }

  /**
   * Get the number of panels in the tab panel.
   */
  get count(): number {
    return this._stackPanel.count;
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._tabBar.tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(movable: boolean) {
    this._tabBar.tabsMovable = movable;
  }

  /**
   * Get the tab bar used by the tab panel.
   */
  get tabBar(): TabBar {
    return this._tabBar;
  }

  /**
   * Get the stack panel used by the tab panel.
   */
  get stackPanel(): StackPanel {
    return this._stackPanel;
  }

  /**
   * Get the index of the given panel.
   */
  indexOf(panel: Panel): number {
    return this._stackPanel.indexOf(panel);
  }

  /**
   * Add a panel to the end of the tab panel.
   *
   * If the panel has already been added, it will be moved.
   *
   * Returns the new index of the panel.
   */
  addPanel(panel: ITabbable): number {
    return this.insertPanel(this.count, panel);
  }

  /**
   * Insert a panel into the tab panel at the given index.
   *
   * If the panel has already been added, it will be moved.
   *
   * Returns the new index of the panel.
   */
  insertPanel(index: number, panel: ITabbable): number {
    var i = this.indexOf(panel);
    if (i >= 0) {
      return this.movePanel(i, index);
    }
    index = this._stackPanel.insertPanel(index, panel);
    return this._tabBar.insertTab(index, panel.tab);
  }

  /**
   * Move a panel from one index to another.
   *
   * Returns the new index of the panel.
   */
  movePanel(fromIndex: number, toIndex: number): number {
    return this._tabBar.moveTab(fromIndex, toIndex);
  }

  /**
   * Handle the `tabMoved` signal from the tab bar.
   */
  private _tb_tabMoved(sender: TabBar, args: ITabMoveArgs): void {
    this._stackPanel.movePanel(args.fromIndex, args.toIndex);
  }

  /**
   * Handle the `currentChanged` signal from the tab bar.
   */
  private _tb_currentChanged(sender: TabBar, args: ITabIndexArgs): void {
    this._stackPanel.currentIndex = args.index;
    var panel = this._stackPanel.currentPanel;
    this.currentChanged.emit(this, { index: args.index, panel: panel });
  }

  /**
   * Handle the `tabCloseRequested` signal from the tab bar.
   */
  private _tb_tabCloseRequested(sender: TabBar, args: ITabIndexArgs): void {
    this._stackPanel.panelAt(args.index).close();
  }

  /**
   * Handle the `panelRemoved` signal from the stack panel.
   */
  private _sw_panelRemoved(sender: StackPanel, args: IStackIndexArgs): void {
    this._tabBar.takeAt(args.index);
  }

  private _tabBar: TabBar;
  private _stackPanel: StackPanel;
}

} // module phosphor.panels

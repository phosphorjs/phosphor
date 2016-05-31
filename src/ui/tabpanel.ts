/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  indexOf
} from '../algorithm/searching';

import {
  ISequence
} from '../algorithm/sequence';

import {
  BoxLayout
} from './boxpanel';

import {
  StackedPanel
} from './stackedpanel';

import {
  TabBar
} from './tabbar';

import {
  Widget
} from './widget';


/**
 * The class name added to TabPanel instances.
 */
const TAB_PANEL_CLASS = 'p-TabPanel';

/**
 * The class name added to a TabPanel's tab bar.
 */
const TAB_BAR_CLASS = 'p-TabPanel-tabBar';

/**
 * The class name added to a TabPanel's stacked panel.
 */
const STACKED_PANEL_CLASS = 'p-TabPanel-stackedPanel';


/**
 * A widget which combines a `TabBar` and a `StackedPanel`.
 *
 * #### Notes
 * This is a simple panel which handles the common case of a tab bar
 * placed above a content area. The selected tab controls the widget
 * which is shown in the content area.
 *
 * For use cases which require more control than is provided by this
 * panel, the `TabBar` widget may be used independently.
 */
export
class TabPanel extends Widget {
  /**
   * Create a `TabBar` for a tab panel.
   *
   * @returns A new tab bar to use with a tab panel.
   *
   * #### Notes
   * This may be reimplemented to create custom tab bars.
   */
  static createTabBar(): TabBar {
    let tabBar = new TabBar();
    tabBar.addClass(TAB_BAR_CLASS);
    return tabBar;
  }

  /**
   * Create a `StackedPanel` for a tab panel.
   *
   * @returns A new stacked panel to use with a tab panel.
   *
   * #### Notes
   * This may be reimplemented to create custom stacked panels.
   */
  static createStackedPanel(): StackedPanel {
    let stackedPanel = new StackedPanel();
    stackedPanel.addClass(STACKED_PANEL_CLASS);
    return stackedPanel;
  }

  /**
   * Construct a new tab panel.
   */
  constructor() {
    super();
    this.addClass(TAB_PANEL_CLASS);

    // Create the tab bar and stacked panel.
    let ctor = this.constructor as typeof TabPanel;
    this._tabBar = ctor.createTabBar();
    this._stackedPanel = ctor.createStackedPanel();

    // Connect the tab bar signal handlers.
    this._tabBar.tabMoved.connect(this._onTabMoved, this);
    this._tabBar.currentChanged.connect(this._onCurrentChanged, this);
    this._tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this);

    // Connect the stacked panel signal handlers.
    this._stackedPanel.widgetRemoved.connect(this._onWidgetRemoved, this);

    // Setup the box layout.
    let layout = new BoxLayout();
    layout.direction = 'top-to-bottom';
    layout.spacing = 0;

    // Set the stretch factors for the child widgets.
    BoxLayout.setStretch(this._tabBar, 0);
    BoxLayout.setStretch(this._stackedPanel, 1);

    // Add the child widgets to the layout.
    layout.addWidget(this._tabBar);
    layout.addWidget(this._stackedPanel);

    // Install the layout on the tab panel.
    this.layout = layout;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._tabBar = null;
    this._stackedPanel = null;
    super.dispose();
  }

  /**
   * Get the index of the currently selected tab.
   *
   * #### Notes
   * This will be `-1` if no tab is selected.
   */
  get currentIndex(): number {
    return this._tabBar.currentIndex;
  }

  /**
   * Set the index of the currently selected tab.
   *
   * #### Notes
   * If the index is out of range, it will be set to `-1`.
   */
  set currentIndex(value: number) {
    this._tabBar.currentIndex = value;
  }

  /**
   * Get the currently selected widget.
   *
   * #### Notes
   * This will be `null` if there is no selected tab.
   */
  get currentWidget(): Widget {
    let title = this._tabBar.currentTitle;
    return title ? title.owner as Widget : null;
  }

  /**
   * Set the currently selected widget.
   *
   * #### Notes
   * If the widget is not in the panel, it will be set to `null`.
   */
  set currentWidget(value: Widget) {
    this._tabBar.currentTitle = value ? value.title : null;
  }

  /**
   * Get whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can be moved programmatically, irrespective of this value.
   */
  get tabsMovable(): boolean {
    return this._tabBar.tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can be moved programmatically, irrespective of this value.
   */
  set tabsMovable(value: boolean) {
    this._tabBar.tabsMovable = value;
  }

  /**
   * The tab bar associated with the tab panel.
   *
   * #### Notes
   * Modifying the tab bar directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get tabBar(): TabBar {
    return this._tabBar;
  }

  /**
   * The stacked panel associated with the tab panel.
   *
   * #### Notes
   * Modifying the stack directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get stackedPanel(): StackedPanel {
    return this._stackedPanel;
  }

  /**
   * A read-only sequence of the widgets in the panel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get widgets(): ISequence<Widget> {
    return this._stackedPanel.widgets;
  }

  /**
   * Add a widget to the end of the tab panel.
   *
   * @param widget - The widget to add to the tab panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   *
   * The widget's `title` is used to populate the tab.
   */
  addWidget(widget: Widget): void {
    this.insertWidget(this.widgets.length, widget);
  }

  /**
   * Insert a widget into the tab panel at a specified index.
   *
   * @param index - The index at which to insert the widget.
   *
   * @param widget - The widget to insert into to the tab panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   *
   * The widget's `title` is used to populate the tab.
   */
  insertWidget(index: number, widget: Widget): void {
    if (widget !== this.currentWidget) widget.hide();
    this._stackedPanel.insertWidget(index, widget);
    this._tabBar.insertTab(index, widget.title);
  }

  /**
   * Handle the `currentChanged` signal from the tab bar.
   */
  private _onCurrentChanged(sender: TabBar, args: TabBar.ICurrentChangedArgs): void {
    let prev = args.previousTitle;
    let curr = args.currentTitle;
    if (prev) (prev.owner as Widget).hide();
    if (curr) (curr.owner as Widget).show();
    if (curr) (curr.owner as Widget).focus();
  }

  /**
   * Handle the `tabCloseRequested` signal from the tab bar.
   */
  private _onTabCloseRequested(sender: TabBar, args: TabBar.ITabCloseRequestedArgs): void {
    (args.title.owner as Widget).close();
  }

  /**
   * Handle the `tabMoved` signal from the tab bar.
   */
  private _onTabMoved(sender: TabBar, args: TabBar.ITabMovedArgs): void {
    this._stackedPanel.insertWidget(args.toIndex, args.title.owner as Widget);
  }

  /**
   * Handle the `widgetRemoved` signal from the stacked panel.
   */
  private _onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
    this._tabBar.removeTab(indexOf(this._tabBar.titles, widget.title));
  }

  private _tabBar: TabBar;
  private _stackedPanel: StackedPanel;
}

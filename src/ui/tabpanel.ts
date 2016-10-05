/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISequence
} from '../algorithm/sequence';

import {
  ISignal, defineSignal
} from '../core/signaling';

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
 * placed next to a content area. The selected tab controls the widget
 * which is shown in the content area.
 *
 * For use cases which require more control than is provided by this
 * panel, the `TabBar` widget may be used independently.
 */
export
class TabPanel extends Widget {
  /**
   * Construct a new tab panel.
   *
   * @param options - The options for initializing the tab panel.
   */
  constructor(options: TabPanel.IOptions = {}) {
    super();
    this.addClass(TAB_PANEL_CLASS);

    // Create the tab bar and stacked panel.
    this._tabBar = new TabBar(options);
    this._tabBar.addClass(TAB_BAR_CLASS);
    this._stackedPanel = new StackedPanel();
    this._stackedPanel.addClass(STACKED_PANEL_CLASS);

    // Connect the tab bar signal handlers.
    this._tabBar.tabMoved.connect(this._onTabMoved, this);
    this._tabBar.currentChanged.connect(this._onCurrentChanged, this);
    this._tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this);

    // Connect the stacked panel signal handlers.
    this._stackedPanel.widgetRemoved.connect(this._onWidgetRemoved, this);

    // Get the data related to the placement.
    this._tabPlacement = options.tabPlacement || 'top';
    let direction = Private.directionFromPlacement(this._tabPlacement);
    let orientation = Private.orientationFromPlacement(this._tabPlacement);

    // Configure the tab bar for the placement.
    this._tabBar.orientation = orientation;
    this._tabBar.addClass(`p-mod-${this._tabPlacement}`);

    // Create the box layout.
    let layout = new BoxLayout({ direction, spacing: 0 });

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
   * A signal emitted when the current tab is changed.
   *
   * #### Notes
   * This signal is emitted when the currently selected tab is changed
   * either through user or programmatic interaction.
   *
   * Notably, this signal is not emitted when the index of the current
   * tab changes due to tabs being inserted, removed, or moved. It is
   * only emitted when the actual current tab node is changed.
   */
  currentChanged: ISignal<TabPanel, TabPanel.ICurrentChangedArgs>;

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
  get currentWidget(): Widget | null {
    let title = this._tabBar.currentTitle;
    return title ? title.owner as Widget : null;
  }

  /**
   * Set the currently selected widget.
   *
   * #### Notes
   * If the widget is not in the panel, it will be set to `null`.
   */
  set currentWidget(value: Widget | null) {
    this._tabBar.currentTitle = value ? value.title : null;
  }

  /**
   * Get the whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  get tabsMovable(): boolean {
    return this._tabBar.tabsMovable;
  }

  /**
   * Set the whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  set tabsMovable(value: boolean) {
    this._tabBar.tabsMovable = value;
  }

  /**
   * Get the tab placement for the tab panel.
   *
   * #### Notes
   * This controls the position of the tab bar relative to the content.
   */
  get tabPlacement(): TabPanel.TabPlacement {
    return this._tabPlacement;
  }

  /**
   * Set the tab placement for the tab panel.
   *
   * #### Notes
   * This controls the position of the tab bar relative to the content.
   */
  set tabPlacement(value: TabPanel.TabPlacement) {
    // Bail if the placement does not change.
    if (this._tabPlacement === value) {
      return;
    }

    // Swap the internal values.
    let old = this._tabPlacement;
    this._tabPlacement = value;

    // Get the values related to the placement.
    let direction = Private.directionFromPlacement(value);
    let orientation = Private.orientationFromPlacement(value);

    // Configure the tab bar for the placement.
    this._tabBar.orientation = orientation;
    this._tabBar.removeClass(`p-mod-${old}`);
    this._tabBar.addClass(`p-mod-${value}`);

    // Update the layout direction.
    (this.layout as BoxLayout).direction = direction;
  }

  /**
   * The tab bar associated with the tab panel.
   *
   * #### Notes
   * Modifying the tab bar directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get tabBar(): TabBar | null {
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
  get stackedPanel(): StackedPanel | null {
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
    let { previousIndex, previousTitle, currentIndex, currentTitle } = args;
    let previousWidget = previousTitle ? previousTitle.owner as Widget : null;
    let currentWidget = currentTitle ? currentTitle.owner as Widget : null;
    if (previousWidget) {
      previousWidget.hide();
      previousWidget.deactivate();
    }
    if (currentWidget) {
      currentWidget.show();
      currentWidget.activate();
    }
    this.currentChanged.emit({
      previousIndex, previousWidget, currentIndex, currentWidget
    });
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
    this._tabBar.removeTab(widget.title);
  }

  private _tabBar: TabBar | null;
  private _stackedPanel: StackedPanel | null;
  private _tabPlacement: TabPanel.TabPlacement;
}


// Define the signals for the `TabPanel` class.
defineSignal(TabPanel.prototype, 'currentChanged');


/**
 * The namespace for the `TabPanel` class statics.
 */
export
namespace TabPanel {
  /**
   * A type alias for tab placement in a tab bar.
   */
  export
  type TabPlacement = (
    /**
     * The tabs are placed as a row above the content.
     */
    'top' |

    /**
     * The tabs are placed as a column to the left of the content.
     */
    'left' |

    /**
     * The tabs are placed as a column to the right of the content.
     */
    'right' |

    /**
     * The tabs are placed as a row below the content.
     */
    'bottom'
  );

  /**
   * An options object for initializing a tab panel.
   */
  export
  interface IOptions {
    /**
     * Whether the tabs are movable by the user.
     *
     * The default is `false`.
     */
    tabsMovable?: boolean;

    /**
     * The placement of the tab bar relative to the content.
     *
     * The default is `'top'`.
     */
    tabPlacement?: TabPlacement;

    /**
     * The renderer for the panel's tab bar.
     *
     * The default is shared renderer instance.
     */
    renderer?: TabBar.IRenderer;
  }

  /**
   * The arguments object for the `currentChanged` signal.
   */
  export
  interface ICurrentChangedArgs {
    /**
     * The previously selected index.
     */
    previousIndex: number;

    /**
     * The previously selected widget.
     */
    previousWidget: Widget | null;

    /**
     * The currently selected index.
     */
    currentIndex: number;

    /**
     * The currently selected widget.
     */
    currentWidget: Widget | null;
  }
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Convert a tab placement to tab bar orientation.
   */
  export
  function orientationFromPlacement(plc: TabPanel.TabPlacement): TabBar.Orientation {
    return placementToOrientationMap[plc];
  }

  /**
   * Convert a tab placement to a box layout direction.
   */
  export
  function directionFromPlacement(plc: TabPanel.TabPlacement): BoxLayout.Direction {
    return placementToDirectionMap[plc];
  }

  /**
   * A mapping of tab placement to tab bar orientation.
   */
  const placementToOrientationMap: { [key: string]: TabBar.Orientation } = {
    'top': 'horizontal',
    'left': 'vertical',
    'right': 'vertical',
    'bottom': 'horizontal'
  };

  /**
   * A mapping of tab placement to box layout direction.
   */
  const placementToDirectionMap: { [key: string]: BoxLayout.Direction } = {
    'top': 'top-to-bottom',
    'left': 'left-to-right',
    'right': 'right-to-left',
    'bottom': 'bottom-to-top'
  };
}

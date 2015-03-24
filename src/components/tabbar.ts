/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import IData = virtualdom.IData;
import IElement = virtualdom.IElement;
import createFactory = virtualdom.createFactory;
import dom = virtualdom.dom;


/**
 * The class name added to TabBarComponent instances.
 */
var TAB_BAR_CLASS = 'p-TabBarComponent';

/**
 * The class name added to the tab bar header div.
 */
var HEADER_CLASS = 'p-TabBarComponent-header';

/**
 * The class name added to the tab bar inner ul.
 */
var INNER_CLASS = 'p-TabBarComponent-inner';

/**
 * The class name added to the tab bar footer div.
 */
var FOOTER_CLASS = 'p-TabBarComponent-footer';

/**
 * The class name added to Tab instances.
 */
var TAB_CLASS = 'p-TabBarComponent-tab';

/**
 * The class name assigned to a tab text sub element.
 */
var TEXT_CLASS = 'p-TabBarComponent-tab-text';

/**
 * The class name assigned to a tab icon sub element.
 */
var ICON_CLASS = 'p-TabBarComponent-tab-icon';

/**
 * The class name assigned to a tab close icon sub element.
 */
var CLOSE_ICON_CLASS = 'p-TabBarComponent-tab-close-icon';

/**
 * The class name added to the selected tab.
 */
var SELECTED_CLASS = 'p-mod-selected';

/**
 * The class name added to a closable tab.
 */
var CLOSABLE_CLASS = 'p-mod-closable';


/**
 *
 */
export
interface ITabItem {
  /**
   *
   */
  text: string;

  /**
   *
   */
  selected: boolean;

  /**
   *
   */
  closable: boolean;
}


/**
 *
 */
export
interface ITabBarData extends IData {
  /**
   *
   */
  items: ITabItem[];
}


/**
 *
 */
export
class TabBarComponent extends Component<ITabBarData> {
  /**
   *
   */
  static className = TAB_BAR_CLASS;

  /**
   *
   */
  render(): IElement[] {
    var tabs = this.data.items.map(item => this.renderTab(item));
    return [
      dom.div({ className: HEADER_CLASS }),
      dom.ul({ className: INNER_CLASS }, tabs),
      dom.div({ className: FOOTER_CLASS })
    ];
  }

  /**
   *
   */
  protected renderTab(tab: ITabItem): IElement {
    var parts = [TAB_CLASS];
    if (tab.selected) {
      parts.push(SELECTED_CLASS);
    }
    if (tab.closable) {
      parts.push(CLOSABLE_CLASS);
    }
    return (
      dom.li({ className: parts.join(' ') },
        dom.span({ className: ICON_CLASS }),
        dom.span({ className: TEXT_CLASS }, tab.text),
        dom.span({ className: CLOSE_ICON_CLASS })
      )
    );
  }
}


/**
 *
 */
export
var TabBar = createFactory(TabBarComponent);

} // module phosphor.components

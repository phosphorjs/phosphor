/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

/**
 * An object which can be used as a tab in a tab bar.
 */
export
interface ITab {
  /**
   * The text for the tab.
   */
  text: string;

  /**
   * Whether the tab is currently selected.
   */
  selected: boolean;

  /**
   * Whether the tab is closable.
   */
  closable: boolean;

  /**
   * The DOM node for the tab.
   */
  node: HTMLElement;

  /**
   * The DOM node for the close icon, if available.
   */
  closeIconNode: HTMLElement;
}

} // module phosphor.widgets

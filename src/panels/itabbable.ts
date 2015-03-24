/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

/**
 * A panel which owns and manages its own tab.
 */
export
interface ITabbable extends Panel {
  /**
   * The tab to associate with the panel.
   */
  tab: ITab;
}

} // module phosphor.panels

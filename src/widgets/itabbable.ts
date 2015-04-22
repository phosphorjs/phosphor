/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

/**
 * A widget which owns and manages its own tab.
 */
export
interface ITabbable extends Widget {
  /**
   * The tab associated with the widget.
   */
  tab: Tab;
}

} // module phosphor.widgets

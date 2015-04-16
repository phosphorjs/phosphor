/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import IMessage = core.IMessage;
import IMessageFilter = core.IMessageFilter;
import IMessageHandler = core.IMessageHandler;
import installMessageFilter = core.installMessageFilter;
import removeMessageFilter = core.removeMessageFilter;

import Widget = widgets.Widget;


/**
 * Enable auto-hiding for the given widget.
 *
 * When auto-hiding is enabled, the widget will be automatically hidden
 * when it has no visible children, and shown when it has at least one
 * visible child.
 */
export
function enableAutoHide(widget: Widget): void {
  installMessageFilter(widget, filter);
  refresh(widget);
}


/**
 * Disable auto-hiding for the given widget.
 *
 * This removes the effect of calling `enableAutoHide`. The current
 * visible state of the widget will not be changed by this method.
 */
export
function disableAutoHide(widget: Widget): void {
  removeMessageFilter(widget, filter);
}


/**
 * Refresh the auto-hide visible state for the given widget.
 */
function refresh(widget: Widget): void {
  widget.setVisible(hasVisibleChild(widget));
}


/**
 * Test whether a widget has at least one visible child.
 */
function hasVisibleChild(widget: Widget): boolean {
  for (var i = 0, n = widget.childCount; i < n; ++i) {
    if (!widget.childAt(i).isHidden) {
      return true;
    }
  }
  return false;
}


/**
 * A message filter which implements auto-hide functionality.
 */
class AutoHideFilter implements IMessageFilter {
  /**
   * Filter a message sent to a message handler.
   */
  filterMessage(handler: IMessageHandler, msg: IMessage): boolean {
    switch (msg.type) {
    case 'child-added':
    case 'child-removed':
    case 'child-shown':
    case 'child-hidden':
      refresh(<Widget>handler);
      break;
    }
    return false;
  }
}


/**
 * A singleton instance of AutoHideFilter.
 */
var filter = new AutoHideFilter();

} // module phosphor.shell

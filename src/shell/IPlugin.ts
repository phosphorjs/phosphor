/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import IContainer = di.IContainer;


/**
 * An object which represents an application plugin.
 *
 * A plugin is typically a module with an `initialize` function.
 */
export
interface IPlugin {
  /**
   * Initialize the plugin and register its content with the container.
   */
  initialize(container: IContainer): void;
}

} // module phosphor.shell

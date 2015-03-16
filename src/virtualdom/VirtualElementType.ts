/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

/**
 * An enum of supported virtual element types.
 */
export
enum VirtualElementType {
  /**
   * The element represents a text node.
   */
  Text,

  /**
   * The element represents an HTMLElement node.
   */
  Node,

  /**
   * The element represents a component.
   */
  Component,
}

} // module phosphor.virtualdom

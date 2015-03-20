/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

/**
 * A base data object for a virtual element.
 */
export
interface IData {
  /**
   * The key id for the element.
   *
   * If an element is given a key id, the generated node will not be
   * recreated during a rendering update if it moves in the render
   * tree provided the type of the node does not change.
   */
  key?: string;

  /**
   * The ref id for the element.
   *
   * If an element is given a ref id, the generated node or component
   * will be added to the ref mapping created by the virtual renderer.
   */
  ref?: string;
}

} // module phosphor.virtualdom

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

/**
 * An enum of supported elem types.
 */
export
enum ElemType {
  /**
   * The elem represents a text node.
   */
  Text,

  /**
   * The elem represents an HTMLElement node.
   */
  Node,

  /**
   * The elem represents a component.
   */
  Component,
}


/**
 * The type of an elem tag.
 */
export
type ElemTag = string | IComponentClass<any>;


/**
 * A base data object for an elem.
 */
export
interface IElemData {
  /**
   * The key id for the elem.
   *
   * If an elem is given a key id, the generated node will not be
   * recreated during a rendering update if it moves in the render
   * tree provided the type of the node does not change.
   */
  key?: string;

  /**
   * The ref id for the elem.
   *
   * If an elem is given a ref id, the generated node or component
   * will be added to the ref mapping created by the renderer.
   */
  ref?: string;
}


/**
 * A node in a virtual DOM hierarchy.
 *
 * User code will not typically instantiate an elem directly. Instead,
 * a factory function will be called to create the elem in a type-safe
 * fashion. Factory functions for all standard DOM nodes are provided
 * by the framework, and new factories may be created with the
 * `createFactory` function.
 *
 * An elem *must* be treated as immutable. Mutating the elem state will
 * result in undefined rendering behavior.
 */
export
class Elem {
  /**
   * The type of the elem.
   */
  type: ElemType;

  /**
   * The tag for the elem.
   *
   * The interpretation of the tag depends on the elem type:
   *   Text - the text content
   *   Node - the node tag name
   *   Component - the component constructor
   */
  tag: ElemTag;

  /**
   * The data object for the elem.
   *
   * The interpretation of the data depends on the elem type:
   *   Text - an empty object
   *   Node - the node attributes object
   *   Component - the component data object
   */
  data: IElemData;

  /**
   * The array of child elements.
   */
  children: Elem[];

  /**
   * Construct a new virtual elem.
   */
  constructor(type: ElemType, tag: ElemTag, data: IElemData, children: Elem[]) {
    this.type = type;
    this.tag = tag;
    this.data = data;
    this.children = children;
  }
}

} // module phosphor.virtualdom

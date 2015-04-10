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
enum ElementType {
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


/**
 * An object which represents a node or component in virtual DOM tree.
 *
 * User code will typically create an element indirectly by calling an
 * element factory function. The framework provides default factories
 * for all standard DOM nodes, and new factories may be created with
 * the `createFactory` function.
 *
 * An element *must* be treated as immutable. Mutating element state
 * will lead to undefined rendering behavior.
 */
export
interface IElement {
  /**
   * The type of the element.
   */
  type: ElementType;

  /**
   * The tag for the element.
   *
   * The interpretation of the tag depends on the element type:
   *   Text - the text content
   *   Node - the node tag name
   *   Component - the component constructor
   */
  tag: string | IComponentClass<any>;

  /**
   * The data object for the element.
   *
   * The interpretation of the data depends on the element type:
   *   Text - an empty object
   *   Node - the node attributes object
   *   Component - the component data object
   */
  data: IData;

  /**
   * The array of child elements.
   */
  children: IElement[];

  /**
   * A prototype property used to quickly type-check an element.
   */
  __isElement: boolean;
}

} // module phosphor.virtualdom

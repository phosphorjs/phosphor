/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import IComponentClass = phosphor.components.IComponentClass


/**
 * A base interface for a virtual element data object.
 */
export
interface IVirtualElementData {
  /**
   * The key id for the element.
   *
   * If an element is given a key id, the generated node will not be
   * recreated during a rendering update if it moves in the render
   * tree, provided the type or tag of the node does not change.
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


/**
 * An object which represents a DOM node or component.
 *
 * User code will typically create a virtual element indirectly by
 * calling a virtual element factory function.
 *
 * A virtual element *must* be treated as immutable. Mutating the
 * element state will result in undefined rendering behavior.
 */
export
interface IVirtualElement {
  /**
   * A property used to quickly type-check a virtual element object.
   */
  isElement: boolean;

  /**
   * The type of the virtual element.
   */
  type: VirtualElementType;

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
  data: IVirtualElementData;

  /**
   * The array of child elements.
   */
  children: IVirtualElement[];
}


/**
 * A typedef of the allowed child types for an element factory.
 */
export
type FactoryChildType = string | IVirtualElement;


/**
 * A typedef for the factory child argument type.
 */
export
type FactoryChildArg = FactoryChildType | FactoryChildType[];


/**
 * A factory function which creates a virtual element.
 */
export
interface IVirtualElementFactory<T extends IVirtualElementData> {
  /**
   * Create a virtual element populated with the given children.
   */
  (...children: FactoryChildArg[]): IVirtualElement;

  /**
   * Create a virtual element populated with the given data and children.
   */
  (data: T, ...children: FactoryChildArg[]): IVirtualElement;
}

} // module phosphor.virtualdom

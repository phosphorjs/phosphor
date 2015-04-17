/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

/**
 * An object which manages its own node in a virtual DOM tree.
 */
export
interface IComponent<T extends IElemData> {
  /**
   *
   */
  init(data: T, children: Elem[]): boolean;

  /**
   *
   */
  render(): Elem;

  /**
   *
   */
  beforeUpdate?(): void;

  /**
   *
   */
  afterUpdate?(): void;

  /**
   *
   */
  afterAttach?(node: HTMLElement): void;

  /**
   *
   */
  beforeDetach?(node: HTMLElement): void;
}


/**
 * A component class type.
 */
export
interface IComponentClass<T extends IElemData> {
  /**
   * Construct a new component.
   */
  new(): IComponent<T>;
}

} // module phosphor.virtualdom

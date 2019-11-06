/*------------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|-----------------------------------------------------------------------------*/


/**
 * A type alias for a virtual node.
 */
export
type VNode = {
  /**
   * The element tag name.
   */
  readonly tag: string;

  /**
   * The element props.
   */
  readonly props: VNode.Props;
};


/**
 * The namespace for the `VNode` type statics.
 */
export
namespace VNode {
  /**
	 * A type alias for a node child.
	 */
	export
	type Child = VNode | string;

	/**
	 * A type alias for VNode children.
	 */
	export
  type Children =  ReadonlyArray<Child>;

  /**
   * A type alias for a node key.
   */
  export
  type Key = string | number;

  /**
   * A type alias for a node ref.
   */
  export
  type Ref = { current?: HTMLElement | null };

	/**
	 * A type alias for intrinsic node props.
	 */
	export
	type IntrinsicProps = {
    /**
     * The children of the node.
     */
    readonly children: Children;

    /**
     * The key for the node.
     */
    readonly key?: Key;

    /**
     * The ref for the node.
     */
    readonly ref?: Ref;
  };

  /**
   * A type alias for the attribute node props.
   */
  export
  type AttributeProps = Readonly<Record<string, any>>;

  /**
   * A type alias for the node props.
   */
  export
  type Props = IntrinsicProps & AttributeProps;
}

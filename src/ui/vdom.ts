/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * The base attributes object for a virtual DOM node.
 */
export
interface IVNodeAttrs {
  /**
   * The key id for the node.
   *
   * If a node is given a key id, the generated DOM node will not be
   * recreated during a rendering update if it only moves among its
   * siblings in the render tree, provided the type of the node does
   * not change.
   *
   * In general, reordering child nodes will cause the nodes to be
   * completely re-rendered. Keys allow this to be optimized away.
   *
   * If a key is provided, it must be unique among sibling nodes.
   */
  key?: string;
}


/**
 * The attributes available for all elements.
 */
export
interface IElementAttrs extends IVNodeAttrs {
  accessKey?: string;
  className?: string;
  contentEditable?: string;
  dataset?: any;
  dir?: string;
  draggable?: boolean;
  hidden?: any;
  id?: string;
  lang?: string;
  spellcheck?: boolean;
  style?: any;
  tabIndex?: number;
  title?: string;
  onabort?: (ev: UIEvent) => any;
  onbeforecopy?: (ev: DragEvent) => any;
  onbeforecut?: (ev: DragEvent) => any;
  onbeforepaste?: (ev: DragEvent) => any;
  onblur?: (ev: FocusEvent) => any;
  oncanplay?: (ev: Event) => any;
  oncanplaythrough?: (ev: Event) => any;
  onchange?: (ev: Event) => any;
  onclick?: (ev: MouseEvent) => any;
  oncontextmenu?: (ev: MouseEvent) => any;
  oncopy?: (ev: DragEvent) => any;
  oncuechange?: (ev: Event) => any;
  oncut?: (ev: DragEvent) => any;
  ondblclick?: (ev: MouseEvent) => any;
  ondrag?: (ev: DragEvent) => any;
  ondragend?: (ev: DragEvent) => any;
  ondragenter?: (ev: DragEvent) => any;
  ondragleave?: (ev: DragEvent) => any;
  ondragover?: (ev: DragEvent) => any;
  ondragstart?: (ev: DragEvent) => any;
  ondrop?: (ev: DragEvent) => any;
  ondurationchange?: (ev: Event) => any;
  onended?: (ev: Event) => any;
  onemptied?: (ev: Event) => any;
  onerror?: (ev: ErrorEvent) => any;
  onfocus?: (ev: FocusEvent) => any;
  onhelp?: (ev: Event) => any;
  oninput?: (ev: Event) => any;
  onkeydown?: (ev: KeyboardEvent) => any;
  onkeypress?: (ev: KeyboardEvent) => any;
  onkeyup?: (ev: KeyboardEvent) => any;
  onload?: (ev: Event) => any;
  onloadeddata?: (ev: Event) => any;
  onloadedmetadata?: (ev: Event) => any;
  onloadstart?: (ev: Event) => any;
  onmousedown?: (ev: MouseEvent) => any;
  onmouseenter?: (ev: MouseEvent) => any;
  onmouseleave?: (ev: MouseEvent) => any;
  onmousemove?: (ev: MouseEvent) => any;
  onmouseout?: (ev: MouseEvent) => any;
  onmouseover?: (ev: MouseEvent) => any;
  onmouseup?: (ev: MouseEvent) => any;
  onmousewheel?: (ev: MouseWheelEvent) => any;
  onpaste?: (ev: DragEvent) => any;
  onpause?: (ev: Event) => any;
  onplay?: (ev: Event) => any;
  onplaying?: (ev: Event) => any;
  onprogress?: (ev: ProgressEvent) => any;
  onratechange?: (ev: Event) => any;
  onreadystatechange?: (ev: Event) => any;
  onreset?: (ev: Event) => any;
  onscroll?: (ev: UIEvent) => any;
  onseeked?: (ev: Event) => any;
  onseeking?: (ev: Event) => any;
  onselect?: (ev: UIEvent) => any;
  onselectstart?: (ev: Event) => any;
  onstalled?: (ev: Event) => any;
  onsubmit?: (ev: Event) => any;
  onsuspend?: (ev: Event) => any;
  ontimeupdate?: (ev: Event) => any;
  onvolumechange?: (ev: Event) => any;
  onwaiting?: (ev: Event) => any;
}


/**
 * The attributes for `<a>` elements.
 */
export
interface IAnchorAttrs extends IElementAttrs {
  download?: string;
  href?: string;
  hreflang?: string;
  media?: string;
  rel?: string;
  target?: string;
  type?: string;
}


/**
 * The attributes for `<area>` elements.
 */
export
interface IAreaAttrs extends IElementAttrs {
  alt?: string;
  coords?: string;
  download?: string;
  href?: string;
  hreflang?: string;
  media?: string;
  rel?: string;
  shape?: string;
  target?: string;
  type?: string;
}


/**
 * The attributes for `<button>` elements.
 */
export
interface IButtonAttrs extends IElementAttrs {
  autofocus?: boolean;
  disabled?: boolean;
  form?: string;
  formAction?: string;
  formEnctype?: string;
  formMethod?: string;
  formNoValidate?: boolean;
  formTarget?: string;
  name?: string;
  type?: string;
  value?: string;
}


/**
 * The attributes for `<canvas>` elements.
 */
export
interface ICanvasAttrs extends IElementAttrs {
  width?: number;
  height?: number;
}


/**
 * The attributes for `<data>` elements.
 */
export
interface IDataAttrs extends IElementAttrs {
  value?: string;
}


/**
 * The attributes for `<embed>` elements.
 */
export
interface IEmbedAttrs extends IElementAttrs {
  height?: string;
  src?: string;
  type?: string;
  width?: string;
}


/**
 * The attributes for `<fieldset>` elements.
 */
export
interface IFieldSetAttrs extends IElementAttrs {
  disabled?: boolean;
  form?: string;
  name?: string;
}


/**
 * The attributes for `<form>` elements.
 */
export
interface IFormAttrs extends  IElementAttrs {
  acceptCharset?: string;
  action?: string;
  autocomplete?: string;
  enctype?: string;
  method?: string;
  name?: string;
  noValidate?: boolean;
  target?: string;
}


/**
 * The attributes for `<iframe>` elements.
 */
export
interface IIFrameAttrs extends IElementAttrs {
  allowFullscreen?: boolean;
  height?: string;
  name?: string;
  sandbox?: string;
  seamless?: boolean;
  src?: string;
  srcdoc?: string;
  width?: string;
}


/**
 * The attributes for `<img>` elements.
 */
export
interface IImageAttrs extends  IElementAttrs {
  alt?: string;
  crossOrigin?: string;
  height?: number;
  isMap?: boolean;
  src?: string;
  sizes?: string;
  srcset?: string;
  width?: number;
  useMap?: string;
}


/**
 * The attributes for `<input>` elements.
 */
export
interface IInputAttrs extends IElementAttrs {
  accept?: string;
  alt?: string;
  autocomplete?: string;
  autofocus?: boolean;
  checked?: boolean;
  disabled?: boolean;
  form?: string;
  formAction?: string;
  formEnctype?: string;
  formMethod?: string;
  formNoValidate?: boolean;
  formTarget?: string;
  height?: string;
  inputMode?: string;
  list?: string;
  max?: string;
  maxLength?: number;
  min?: string;
  minLength?: number;
  multiple?: boolean;
  name?: string;
  pattern?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  size?: number;
  spellcheck?: boolean;
  src?: string;
  step?: string;
  type?: string;
  value?: string;
  width?: string;
}


/**
 * The attributes for `<label>` elements.
 */
export
interface ILabelAttrs extends IElementAttrs {
  form?: string;
  htmlFor?: string;
}


/**
 * The attributes for `<li>` elements.
 */
export
interface ILIAttrs extends IElementAttrs {
  value?: number;
}


/**
 * The attributes for `<map>` elements.
 */
export
interface IMapAttrs extends IElementAttrs {
  name?: string;
}


/**
 * The attributes for `<meter>` elements.
 */
export
interface IMeterAttrs extends IElementAttrs {
  high?: number;
  low?: number;
  max?: number;
  min?: number;
  optimum?: number;
  value?: number;
}


/**
 * The attributes for `<audio>` and `<video>` elements.
 */
export
interface IMediaAttrs extends IElementAttrs {
  autoplay?: boolean;
  controls?: boolean;
  crossOrigin?: string;
  loop?: boolean;
  mediaGroup?: string;
  muted?: boolean;
  preload?: string;
  src?: string;
  volume?: number;
}


/**
 * The attributes for `<del>` and `<ins>` elements.
 */
export
interface IModAttrs extends IElementAttrs {
  cite?: string;
  dateTime?: string;
}


/**
 * The attributes for `<object>` elements.
 */
export
interface IObjectAttrs extends IElementAttrs {
  data?: string;
  form?: string;
  height?: string;
  name?: string;
  type?: string;
  typeMustMatch?: boolean;
  useMap?: string;
  width?: string;
}


/**
 * The attributes for `<ol>` elements.
 */
export
interface IOListAttrs extends IElementAttrs {
  reversed?: boolean;
  start?: number;
  type?: string;
}


/**
 * The attributes for `<optgroup>` elements.
 */
export
interface IOptGroupAttrs extends IElementAttrs {
  disabled?: boolean;
  label?: string;
}


/**
 * The attributes for `<option>` elements.
 */
export
interface IOptionAttrs extends IElementAttrs {
  disabled?: boolean;
  label?: string;
  selected?: boolean;
  value?: string;
}


/**
 * The attributes for `<output>` elements.
 */
export
interface IOutputAttrs extends IElementAttrs {
  form?: string;
  htmlFor?: string;
  name?: string;
}


/**
 * The attributes for `<param>` elements.
 */
export
interface IParamAttrs extends IElementAttrs {
  name?: string;
  value?: string;
}


/**
 * The attributes for `<progress>` elements.
 */
export
interface IProgressAttrs extends IElementAttrs {
  max?: number;
  value?: number;
}


/**
 * The attributes for `<blockquote>` elements.
 */
export
interface IQuoteAttrs extends IElementAttrs {
  cite?: string;
}


/**
 * The attributes for `<select>` elements.
 */
export
interface ISelectAttrs extends IElementAttrs {
  autofocus?: boolean;
  disabled?: boolean;
  form?: string;
  multiple?: boolean;
  name?: string;
  required?: boolean;
  size?: number;
}


/**
 * The attributes for `<source>` elements.
 */
export
interface ISourceAttrs extends IElementAttrs {
  media?: string;
  sizes?: string;
  src?: string;
  srcset?: string;
  type?: string;
}


/**
 * The attributes for `<col>` elements.
 */
export
interface ITableColAttrs extends IElementAttrs {
  span?: number;
}


/**
 * The attributes for `<td>` elements.
 */
export
interface ITableDataCellAttrs extends IElementAttrs {
  colSpan?: number;
  headers?: number;
  rowSpan?: number;
}


/**
 * The attributes for `<th>` elements.
 */
export
interface ITableHeaderCellAttrs extends IElementAttrs {
  colSpan?: number;
  headers?: string;
  rowSpan?: number;
  scope?: string;
  sorted?: string;
}


/**
 * The attributes for `<textarea>` elements.
 */
export
interface ITextAreaAttrs extends IElementAttrs {
  autocomplete?: string;
  autofocus?: boolean;
  cols?: number;
  dirName?: string;
  disabled?: boolean;
  form?: string;
  inputMode?: string;
  maxLength?: number;
  minLength?: number;
  name?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  rows?: number;
  wrap?: string;
}


/**
 * The attributes for `<time>` elements.
 */
export
interface ITimeAttrs extends IElementAttrs {
  dateTime?: string;
}


/**
 * The attributes for `<track>` elements.
 */
export
interface ITrackAttrs extends IElementAttrs {
  default?: boolean;
  kind?: string;
  label?: string;
  src?: string;
  srclang?: string;
}


/**
 * The attributes for `<video>` elements.
 */
export
interface IVideoAttrs extends IMediaAttrs {
  height?: number;
  poster?: string;
  width?: number;
}


/**
 * A node in a virtual DOM hierarchy.
 *
 * #### Notes
 * User code will not usually instantiate an node directly. Rather, the
 * `h()` function will be called to create a node in a type-safe manner.
 *
 * A node *must* be treated as immutable. Mutating the state of a node
 * **will** result in undefined rendering behavior.
 */
export
class VNode {
  /**
   * The type of the node.
   *
   * #### Notes
   * An `'element'` type represents an `HTMLElement`.
   *
   * A `'text'` type represents a `Text` node.
   */
  type: 'element' | 'text';

  /**
   * The tag for the node.
   *
   * #### Notes
   * The interpretation of the tag depends upon the node `type`:
   *   - `'element'`: the element tag name
   *   - `'text'`: the text content
   */
  tag: string;

  /**
   * The attributes for the node.
   *
   * #### Notes
   * The interpretation of the attrs depends upon the node `type`:
   *   - `'element'`: the element attributes
   *   - `'text'`: an empty object
   */
  attrs: IVNodeAttrs;

  /**
   * The array of child elements.
   *
   * #### Notes
   * The interpretation of the children depends upon the node `type`:
   *   - `'element'`: the element children
   *   - `'text'`: an empty array
   */
  children: VNode[];

  /**
   * Construct a new virtual DOM node.
   *
   * @param type - The type of the node.
   *
   * @param tag - The node tag.
   *
   * @param attrs - The node attributes.
   *
   * @param children - The node children.
   */
  constructor(type: 'element' | 'text', tag: string, attrs: IVNodeAttrs, children: VNode[]) {
    this.type = type;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
  }
}


/**
 * Create a new virtual DOM node.
 *
 * @param tag - The tag name for the node.
 *
 * @param attrs - The attributes for the node, if any.
 *
 * @param children - The children for the node, if any.
 *
 * @returns A new virtual DOM node for the given parameters.
 *
 * #### Notes
 * The children may be string literals, other virtual DOM nodes, or an
 * array of either of those things. String literals are converted into
 * text nodes, and arrays are inlined as if their contents were given
 * as positional arguments. This makes it easy to build up an array of
 * children by any desired means. `null` child values are ignored.
 *
 * A strongly typed bound function for each tag name is also available
 * as a static attached to the `h()` function. E.g. `h('div', ...)` is
 * equivalent to `h.div(...)`.
 */
export function h(tag: 'a', attrs?: IAnchorAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'abbr', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'address', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'area', attrs?: IAreaAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'article', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'aside', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'audio', attrs?: IMediaAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'b', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'bdi', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'bdo', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'blockquote', attrs?: IQuoteAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'br', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'button', attrs?: IButtonAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'canvas', attrs?: ICanvasAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'caption', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'cite', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'code', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'col', attrs?: ITableColAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'colgroup', attrs?: ITableColAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'data', attrs?: IDataAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'datalist', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'dd', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'del', attrs?: IModAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'dfn', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'div', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'dl', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'dt', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'em', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'embed', attrs?: IEmbedAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'fieldset', attrs?: IFieldSetAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'figcaption', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'figure', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'footer', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'form', attrs?: IFormAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'h1', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'h2', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'h3', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'h4', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'h5', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'h6', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'header', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'hr', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'i', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'iframe', attrs?: IIFrameAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'img', attrs?: IImageAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'input', attrs?: IInputAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'ins', attrs?: IModAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'kbd', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'label', attrs?: ILabelAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'legend', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'li', attrs?: ILIAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'main', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'map', attrs?: IMapAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'mark', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'meter', attrs?: IMeterAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'nav', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'noscript', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'object', attrs?: IObjectAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'ol', attrs?: IOListAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'optgroup', attrs?: IOptGroupAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'option', attrs?: IOptionAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'output', attrs?: IOutputAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'p', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'param', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'pre', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'progress', attrs?: IProgressAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'q', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'rp', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'rt', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'ruby', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 's', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'samp', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'section', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'select', attrs?: ISelectAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'small', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'source', attrs?: ISourceAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'span', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'strong', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'sub', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'summary', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'sup', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'table', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'tbody', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'td', attrs?: ITableDataCellAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'textarea', attrs?: ITextAreaAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'tfoot', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'th', attrs?: ITableHeaderCellAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'thead', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'time', attrs?: ITimeAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'title', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'tr', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'track', attrs?: ITrackAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'u', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'ul', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'var', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'video', attrs?: IVideoAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: 'wbr', attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: string, attrs?: IElementAttrs, ...children: h.FactoryChild[]): VNode;
export function h(tag: string, first?: any): VNode {
  // Setup the variables to hold the parsed data.
  let attrs: any;
  let children: any[];

  // Parse the first variadic argument.
  if (first) {
    if (typeof first === 'string') {
      children = [first];
    } else if (first instanceof VNode) {
      children = [first];
    } else if (first instanceof Array) {
      children = first.slice();
    } else {
      attrs = first;
    }
  }

  // Parse the rest of the variadic arguments.
  if (arguments.length > 2) {
    children = children || [];
    for (let i = 2, n = arguments.length; i < n; ++i) {
      let child = arguments[i];
      if (child instanceof Array) {
        for (let j = 0, k = child.length; j < k; ++j) {
          if (child[j]) children.push(child[j]);
        }
      } else if (child) {
        children.push(child);
      }
    }
  }

  // Convert string literal children into text nodes.
  if (children) {
    for (let i = 0, n = children.length; i < n; ++i) {
      let child = children[i];
      if (typeof child === 'string') {
        children[i] = Private.createTextVNode(child);
      }
    }
  }

  // Return a new virtual DOM node.
  return Private.createElementVNode(tag, attrs, children);
}


/**
 * The namespace for the `h()` function statics.
 */
export
namespace h {
  export type FactoryChild = (string | VNode) | Array<string | VNode>;
  export type Factory<T extends IVNodeAttrs> = (attrs?: T, ...children: FactoryChild[]) => VNode;
  export const a: Factory<IAnchorAttrs> = h.bind(void 0, 'a');
  export const abbr: Factory<IElementAttrs> = h.bind(void 0, 'abbr');
  export const address: Factory<IElementAttrs> = h.bind(void 0, 'address');
  export const area: Factory<IAreaAttrs> = h.bind(void 0, 'area');
  export const article: Factory<IElementAttrs> = h.bind(void 0, 'article');
  export const aside: Factory<IElementAttrs> = h.bind(void 0, 'aside');
  export const audio: Factory<IMediaAttrs> = h.bind(void 0, 'audio');
  export const b: Factory<IElementAttrs> = h.bind(void 0, 'b');
  export const bdi: Factory<IElementAttrs> = h.bind(void 0, 'bdi');
  export const bdo: Factory<IElementAttrs> = h.bind(void 0, 'bdo');
  export const blockquote: Factory<IQuoteAttrs> = h.bind(void 0, 'blockquote');
  export const br: Factory<IElementAttrs> = h.bind(void 0, 'br');
  export const button: Factory<IButtonAttrs> = h.bind(void 0, 'button');
  export const canvas: Factory<ICanvasAttrs> = h.bind(void 0, 'canvas');
  export const caption: Factory<IElementAttrs> = h.bind(void 0, 'caption');
  export const cite: Factory<IElementAttrs> = h.bind(void 0, 'cite');
  export const code: Factory<IElementAttrs> = h.bind(void 0, 'code');
  export const col: Factory<ITableColAttrs> = h.bind(void 0, 'col');
  export const colgroup: Factory<ITableColAttrs> = h.bind(void 0, 'colgroup');
  export const data: Factory<IDataAttrs> = h.bind(void 0, 'data');
  export const datalist: Factory<IElementAttrs> = h.bind(void 0, 'datalist');
  export const dd: Factory<IElementAttrs> = h.bind(void 0, 'dd');
  export const del: Factory<IModAttrs> = h.bind(void 0, 'del');
  export const dfn: Factory<IElementAttrs> = h.bind(void 0, 'dfn');
  export const div: Factory<IElementAttrs> = h.bind(void 0, 'div');
  export const dl: Factory<IElementAttrs> = h.bind(void 0, 'dl');
  export const dt: Factory<IElementAttrs> = h.bind(void 0, 'dt');
  export const em: Factory<IElementAttrs> = h.bind(void 0, 'em');
  export const embed: Factory<IEmbedAttrs> = h.bind(void 0, 'embed');
  export const fieldset: Factory<IFieldSetAttrs> = h.bind(void 0, 'fieldset');
  export const figcaption: Factory<IElementAttrs> = h.bind(void 0, 'figcaption');
  export const figure: Factory<IElementAttrs> = h.bind(void 0, 'figure');
  export const footer: Factory<IElementAttrs> = h.bind(void 0, 'footer');
  export const form: Factory<IFormAttrs> = h.bind(void 0, 'form');
  export const h1: Factory<IElementAttrs> = h.bind(void 0, 'h1');
  export const h2: Factory<IElementAttrs> = h.bind(void 0, 'h2');
  export const h3: Factory<IElementAttrs> = h.bind(void 0, 'h3');
  export const h4: Factory<IElementAttrs> = h.bind(void 0, 'h4');
  export const h5: Factory<IElementAttrs> = h.bind(void 0, 'h5');
  export const h6: Factory<IElementAttrs> = h.bind(void 0, 'h6');
  export const header: Factory<IElementAttrs> = h.bind(void 0, 'header');
  export const hr: Factory<IElementAttrs> = h.bind(void 0, 'hr');
  export const i: Factory<IElementAttrs> = h.bind(void 0, 'i');
  export const iframe: Factory<IIFrameAttrs> = h.bind(void 0, 'iframe');
  export const img: Factory<IImageAttrs> = h.bind(void 0, 'img');
  export const input: Factory<IInputAttrs> = h.bind(void 0, 'input');
  export const ins: Factory<IModAttrs> = h.bind(void 0, 'ins');
  export const kbd: Factory<IElementAttrs> = h.bind(void 0, 'kbd');
  export const label: Factory<ILabelAttrs> = h.bind(void 0, 'label');
  export const legend: Factory<IElementAttrs> = h.bind(void 0, 'legend');
  export const li: Factory<ILIAttrs> = h.bind(void 0, 'li');
  export const main: Factory<IElementAttrs> = h.bind(void 0, 'main');
  export const map: Factory<IMapAttrs> = h.bind(void 0, 'map');
  export const mark: Factory<IElementAttrs> = h.bind(void 0, 'mark');
  export const meter: Factory<IMeterAttrs> = h.bind(void 0, 'meter');
  export const nav: Factory<IElementAttrs> = h.bind(void 0, 'nav');
  export const noscript: Factory<IElementAttrs> = h.bind(void 0, 'noscript');
  export const object: Factory<IObjectAttrs> = h.bind(void 0, 'object');
  export const ol: Factory<IOListAttrs> = h.bind(void 0, 'ol');
  export const optgroup: Factory<IOptGroupAttrs> = h.bind(void 0, 'optgroup');
  export const option: Factory<IOptionAttrs> = h.bind(void 0, 'option');
  export const output: Factory<IOutputAttrs> = h.bind(void 0, 'output');
  export const p: Factory<IElementAttrs> = h.bind(void 0, 'p');
  export const param: Factory<IElementAttrs> = h.bind(void 0, 'param');
  export const pre: Factory<IElementAttrs> = h.bind(void 0, 'pre');
  export const progress: Factory<IProgressAttrs> = h.bind(void 0, 'progress');
  export const q: Factory<IElementAttrs> = h.bind(void 0, 'q');
  export const rp: Factory<IElementAttrs> = h.bind(void 0, 'rp');
  export const rt: Factory<IElementAttrs> = h.bind(void 0, 'rt');
  export const ruby: Factory<IElementAttrs> = h.bind(void 0, 'ruby');
  export const s: Factory<IElementAttrs> = h.bind(void 0, 's');
  export const samp: Factory<IElementAttrs> = h.bind(void 0, 'samp');
  export const section: Factory<IElementAttrs> = h.bind(void 0, 'section');
  export const select: Factory<ISelectAttrs> = h.bind(void 0, 'select');
  export const small: Factory<IElementAttrs> = h.bind(void 0, 'small');
  export const source: Factory<ISourceAttrs> = h.bind(void 0, 'source');
  export const span: Factory<IElementAttrs> = h.bind(void 0, 'span');
  export const strong: Factory<IElementAttrs> = h.bind(void 0, 'strong');
  export const sub: Factory<IElementAttrs> = h.bind(void 0, 'sub');
  export const summary: Factory<IElementAttrs> = h.bind(void 0, 'summary');
  export const sup: Factory<IElementAttrs> = h.bind(void 0, 'sup');
  export const table: Factory<IElementAttrs> = h.bind(void 0, 'table');
  export const tbody: Factory<IElementAttrs> = h.bind(void 0, 'tbody');
  export const td: Factory<ITableDataCellAttrs> = h.bind(void 0, 'td');
  export const textarea: Factory<ITextAreaAttrs> = h.bind(void 0, 'textarea');
  export const tfoot: Factory<IElementAttrs> = h.bind(void 0, 'tfoot');
  export const th: Factory<ITableHeaderCellAttrs> = h.bind(void 0, 'th');
  export const thead: Factory<IElementAttrs> = h.bind(void 0, 'thead');
  export const time: Factory<ITimeAttrs> = h.bind(void 0, 'time');
  export const title: Factory<IElementAttrs> = h.bind(void 0, 'title');
  export const tr: Factory<IElementAttrs> = h.bind(void 0, 'tr');
  export const track: Factory<ITrackAttrs> = h.bind(void 0, 'track');
  export const u: Factory<IElementAttrs> = h.bind(void 0, 'u');
  export const ul: Factory<IElementAttrs> = h.bind(void 0, 'ul');
  export const var_: Factory<IElementAttrs> = h.bind(void 0, 'var');
  export const video: Factory<IVideoAttrs> = h.bind(void 0, 'video');
  export const wbr: Factory<IElementAttrs> = h.bind(void 0, 'wbr');
}


/**
 * Create a real DOM node from a virtual DOM node.
 *
 * @param content - The virtual DOM content to realize.
 *
 * @returns A new DOM node for the given virtual DOM tree.
 *
 * #### Notes
 * The content node is assumed to be of the `'element'` type.
 *
 * This creates a brand new *real* DOM node with a structure which
 * matches the given virtual DOM node.
 *
 * If virtual diffing is desired, use the `render` function instead.
 */
export
function realize(content: VNode): HTMLElement {
  return Private.realizeImpl(content);
}


/**
 * Render virtual DOM content into a host element.
 *
 * @param content - The virtual DOM content to render.
 *
 * @param host - The host element for the rendered content.
 *
 * #### Notes
 * This renders the delta from the previous rendering. It assumes that
 * the content of the host element is not manipulated by external code.
 *
 * Providing `null` content will clear the rendering.
 *
 * Externally modifying the provided content or the host element will
 * result in undefined rendering behavior.
 */
export
function render(content: VNode | VNode[], host: HTMLElement): void {
  Private.renderImpl(content, host);
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Create a virtual text node for the given string.
   */
  export
  function createTextVNode(text: string): VNode {
    return new VNode('text', text, emptyObject, emptyArray);
  }

  /**
   * Create a virtual element node for the given parameters.
   */
  export
  function createElementVNode(tag: string, attrs?: any, children?: any[]): VNode {
    attrs = attrs || emptyObject;
    children = children || emptyArray;
    return new VNode('element', tag, attrs, children);
  }

  /**
   * The internal `realize` entry point.
   */
  export
  function realizeImpl(content: VNode): HTMLElement {
    return createDOMNode(content) as HTMLElement;
  }

  /**
   * The internal `render` entry point.
   */
  export
  function renderImpl(content: VNode | VNode[], host: HTMLElement): void {
    let oldContent = hostMap.get(host) || emptyArray;
    let newContent = asVNodeArray(content);
    hostMap.set(host, newContent);
    updateContent(host, oldContent, newContent);
  }

  /**
   * A shared frozen empty array.
   */
  const emptyArray = Object.freeze([]);

  /**
   * A shared frozen empty object.
   */
  const emptyObject = Object.freeze({});

  /**
   * A weak mapping of host element to virtual DOM content.
   */
  const hostMap = new WeakMap<HTMLElement, VNode[]>();

  /**
   * Coerce content into a virtual node array.
   *
   * Null content will be coerced to an empty array.
   */
  function asVNodeArray(content: VNode | VNode[]): VNode[] {
    if (content instanceof Array) {
      return content as VNode[];
    }
    if (content) {
      return [content as VNode];
    }
    return emptyArray;
  }

  /**
   * Update a host element with the delta of the virtual content.
   *
   * This is the core "diff" algorithm. There is no explicit "patch"
   * phase. The host is patched at each step as the diff progresses.
   */
  function updateContent(host: HTMLElement, oldContent: VNode[], newContent: VNode[]): void {
    // Bail early if the content is identical. This can occur when an
    // node has no children or if the user is rendering cached content.
    if (oldContent === newContent) {
      return;
    }

    // Collect the old keyed elems into a mapping.
    let oldKeyed = collectKeys(host, oldContent);

    // Create a copy of the old content which can be modified in-place.
    let oldCopy = oldContent.slice();

    // Update the host with the new content. The diff always proceeds
    // forward and never modifies a previously visited index. The old
    // copy array is modified in-place to reflect the changes made to
    // the host children. This causes the stale nodes to be pushed to
    // the end of the host node and removed at the end of the loop.
    let currNode = host.firstChild;
    let newCount = newContent.length;
    for (let i = 0; i < newCount; ++i) {

      // If the old elems are exhausted, create a new node.
      if (i >= oldCopy.length) {
        host.appendChild(createDOMNode(newContent[i]));
        continue;
      }

      // Cache a reference to the old and new elems.
      let oldVNode = oldCopy[i];
      let newVNode = newContent[i];

      // If the new elem is keyed, move an old keyed elem to the proper
      // location before proceeding with the diff. The search can start
      // at the current index, since the unmatched old keyed elems are
      // pushed forward in the old copy array.
      let newKey = newVNode.attrs.key;
      if (newKey && newKey in oldKeyed) {
        let pair = oldKeyed[newKey];
        if (pair.vNode !== oldVNode) {
          arrayMove(oldCopy, oldCopy.indexOf(pair.vNode), i);
          host.insertBefore(pair.element, currNode);
          oldVNode = pair.vNode;
          currNode = pair.element;
        }
      }

      // If both elements are identical, there is nothing to do.
      // This can occur when the user renders cached content.
      if (oldVNode === newVNode) {
        currNode = currNode.nextSibling;
        continue;
      }

      // If the old elem is keyed and does not match the new elem key,
      // create a new node. This is necessary since the old keyed elem
      // may be matched at a later point in the diff.
      let oldKey = oldVNode.attrs.key;
      if (oldKey && oldKey !== newKey) {
        arrayInsert(oldCopy, i, newVNode);
        host.insertBefore(createDOMNode(newVNode), currNode);
        continue;
      }

      // If the elements have different types, create a new node.
      if (oldVNode.type !== newVNode.type) {
        arrayInsert(oldCopy, i, newVNode);
        host.insertBefore(createDOMNode(newVNode), currNode);
        continue;
      }

      // If the element is a text node, update its text content.
      if (newVNode.type === 'text') {
        currNode.textContent = newVNode.tag;
        currNode = currNode.nextSibling;
        continue;
      }

      // At this point, the node is an 'element' type. If the tags
      // are different, create a new node.
      if (oldVNode.tag !== newVNode.tag) {
        arrayInsert(oldCopy, i, newVNode);
        host.insertBefore(createDOMNode(newVNode), currNode);
        continue;
      }

      // The element tags match, update the element in place.
      updateAttrs(currNode as HTMLElement, oldVNode.attrs, newVNode.attrs);
      updateContent(currNode as HTMLElement, oldVNode.children, newVNode.children);
      currNode = currNode.nextSibling;
    }

    // Dispose of the old nodes pushed to the end of the host.
    for (let i = oldCopy.length - 1; i >= newCount; --i) {
      host.removeChild(host.lastChild);
    }
  }

  /**
   * Add attributes to a newly created DOM node.
   */
  function addAttrs(node: HTMLElement, attrs: any): void {
    // Set the known attributes defined in the attr table.
    for (let name in attrs) {
      let mode = attrModeTable[name];
      if (mode === AttrMode.Property || mode === AttrMode.Event) {
        (node as any)[name] = attrs[name];
      } else if (mode === AttrMode.Attribute) {
        node.setAttribute(name.toLowerCase(), attrs[name]);
      }
    }

    // Handle the dataset values.
    let dataset = attrs.dataset;
    if (dataset) {
      for (let name in dataset) {
        node.setAttribute(`data-${name}`, dataset[name]);
      }
    }

    // Handle the inline styles.
    let styles = attrs.style;
    if (styles) {
      let nodeStyle = node.style as any;
      for (let name in styles) {
        nodeStyle[name] = styles[name];
      }
    }
  }

  /**
   * Update the node attributes with the delta of attribute objects.
   */
  function updateAttrs(node: HTMLElement, oldAttrs: any, newAttrs: any): void {
    // Do nothing if the attrs are the same object.
    if (oldAttrs === newAttrs) {
      return;
    }

    // Remove attributes which no longer exist.
    for (let name in oldAttrs) {
      if (!(name in newAttrs)) {
        let mode = attrModeTable[name];
        if (mode === AttrMode.Property) {
          node.removeAttribute(name);
        } else if (mode === AttrMode.Attribute) {
          node.removeAttribute(name.toLowerCase());
        } else if (mode === AttrMode.Event) {
          (node as any)[name] = null;
        }
      }
    }

    // Add new attributes an update existing ones.
    for (let name in newAttrs) {
      let value = newAttrs[name];
      if (oldAttrs[name] !== value) {
        let mode = attrModeTable[name];
        if (mode === AttrMode.Property || mode === AttrMode.Event) {
          (node as any)[name] = value;
        } else if (mode === AttrMode.Attribute) {
          node.setAttribute(name.toLowerCase(), value);
        }
      }
    }

    // Handle the dataset values.
    let oldDataset = oldAttrs.dataset || emptyObject;
    let newDataset = newAttrs.dataset || emptyObject;
    if (oldDataset !== newDataset) {
      for (let name in oldDataset) {
        if (!(name in newDataset)) {
          node.removeAttribute('data-' + name);
        }
      }
      for (let name in newDataset) {
        let value = newDataset[name];
        if (oldDataset[name] !== value) {
          node.setAttribute('data-' + name, value);
        }
      }
    }

    // Handle the inline styles.
    let oldStyle = oldAttrs.style || emptyObject;
    let newStyle = newAttrs.style || emptyObject;
    if (oldStyle !== newStyle) {
      let nodeStyle = node.style as any;
      for (let name in oldStyle) {
        if (!(name in newStyle)) {
          nodeStyle[name] = '';
        }
      }
      for (let name in newStyle) {
        let value = newStyle[name];
        if (oldStyle[name] !== value) {
          nodeStyle[name] = value;
        }
      }
    }
  }

  /**
   * A mapping of string key to pair of element and rendered node.
   */
  interface IKeyMap {
    [key: string]: { vNode: VNode, element: HTMLElement };
  }

  /**
   * Collect a mapping of keyed elements for the host content.
   */
  function collectKeys(host: HTMLElement, content: VNode[]): IKeyMap {
    let node = host.firstChild;
    let keyed: IKeyMap = Object.create(null);
    for (let i = 0, n = content.length; i < n; ++i) {
      let vNode = content[i];
      if (vNode.type === 'element') {
        let key = vNode.attrs.key;
        if (key) keyed[key] = { vNode, element: node as HTMLElement };
      }
      node = node.nextSibling;
    }
    return keyed;
  }

  /**
   * Create and return a new DOM node for a virtual element.
   */
  function createDOMNode(elem: VNode): HTMLElement | Text {
    let node: HTMLElement | Text;
    if (elem.type === 'text') {
      node = document.createTextNode(elem.tag);
    } else {
      node = document.createElement(elem.tag);
      addAttrs(node as HTMLElement, elem.attrs);
      addContent(node as HTMLElement, elem.children);
    }
    return node;
  }

  /**
   * Create and add child content to a newly created DOM node.
   */
  function addContent(node: HTMLElement, content: VNode[]): void {
    for (let i = 0, n = content.length; i < n; ++i) {
      node.appendChild(createDOMNode(content[i]));
    }
  }

  /**
   * An enum of the element attribute types.
   */
  const enum AttrMode { Property, Attribute, Event }

  /**
   * A mapping of attribute name to attribute mode.
   */
  const attrModeTable: { [key: string]: AttrMode } = {
    accept:             AttrMode.Property,
    acceptCharset:      AttrMode.Property,
    accessKey:          AttrMode.Property,
    action:             AttrMode.Property,
    allowFullscreen:    AttrMode.Attribute,
    alt:                AttrMode.Property,
    autocomplete:       AttrMode.Property,
    autofocus:          AttrMode.Property,
    autoplay:           AttrMode.Property,
    checked:            AttrMode.Property,
    cite:               AttrMode.Property,
    className:          AttrMode.Property,
    colSpan:            AttrMode.Property,
    cols:               AttrMode.Property,
    contentEditable:    AttrMode.Property,
    controls:           AttrMode.Property,
    coords:             AttrMode.Property,
    crossOrigin:        AttrMode.Property,
    data:               AttrMode.Property,
    dateTime:           AttrMode.Property,
    default:            AttrMode.Property,
    dir:                AttrMode.Property,
    dirName:            AttrMode.Property,
    disabled:           AttrMode.Property,
    download:           AttrMode.Property,
    draggable:          AttrMode.Property,
    enctype:            AttrMode.Property,
    form:               AttrMode.Attribute,
    formAction:         AttrMode.Property,
    formEnctype:        AttrMode.Property,
    formMethod:         AttrMode.Property,
    formNoValidate:     AttrMode.Property,
    formTarget:         AttrMode.Property,
    headers:            AttrMode.Property,
    height:             AttrMode.Property,
    hidden:             AttrMode.Property,
    high:               AttrMode.Property,
    href:               AttrMode.Property,
    hreflang:           AttrMode.Property,
    htmlFor:            AttrMode.Property,
    id:                 AttrMode.Property,
    inputMode:          AttrMode.Property,
    isMap:              AttrMode.Property,
    kind:               AttrMode.Property,
    label:              AttrMode.Property,
    lang:               AttrMode.Property,
    list:               AttrMode.Attribute,
    loop:               AttrMode.Property,
    low:                AttrMode.Property,
    max:                AttrMode.Property,
    maxLength:          AttrMode.Property,
    media:              AttrMode.Attribute,
    mediaGroup:         AttrMode.Property,
    method:             AttrMode.Property,
    min:                AttrMode.Property,
    minLength:          AttrMode.Property,
    multiple:           AttrMode.Property,
    muted:              AttrMode.Property,
    name:               AttrMode.Property,
    noValidate:         AttrMode.Property,
    optimum:            AttrMode.Property,
    pattern:            AttrMode.Property,
    placeholder:        AttrMode.Property,
    poster:             AttrMode.Property,
    preload:            AttrMode.Property,
    readOnly:           AttrMode.Property,
    rel:                AttrMode.Property,
    required:           AttrMode.Property,
    reversed:           AttrMode.Property,
    rowSpan:            AttrMode.Property,
    rows:               AttrMode.Property,
    sandbox:            AttrMode.Property,
    scope:              AttrMode.Property,
    seamless:           AttrMode.Attribute,
    selected:           AttrMode.Property,
    shape:              AttrMode.Property,
    size:               AttrMode.Property,
    sizes:              AttrMode.Attribute,
    sorted:             AttrMode.Property,
    span:               AttrMode.Property,
    spellcheck:         AttrMode.Property,
    src:                AttrMode.Property,
    srcdoc:             AttrMode.Property,
    srclang:            AttrMode.Property,
    srcset:             AttrMode.Attribute,
    start:              AttrMode.Property,
    step:               AttrMode.Property,
    tabIndex:           AttrMode.Property,
    target:             AttrMode.Property,
    title:              AttrMode.Property,
    type:               AttrMode.Property,
    typeMustMatch:      AttrMode.Property,
    useMap:             AttrMode.Property,
    value:              AttrMode.Property,
    volume:             AttrMode.Property,
    width:              AttrMode.Property,
    wrap:               AttrMode.Property,
    onabort:            AttrMode.Event,
    onbeforecopy:       AttrMode.Event,
    onbeforecut:        AttrMode.Event,
    onbeforepaste:      AttrMode.Event,
    onblur:             AttrMode.Event,
    oncanplay:          AttrMode.Event,
    oncanplaythrough:   AttrMode.Event,
    onchange:           AttrMode.Event,
    onclick:            AttrMode.Event,
    oncontextmenu:      AttrMode.Event,
    oncopy:             AttrMode.Event,
    oncuechange:        AttrMode.Event,
    oncut:              AttrMode.Event,
    ondblclick:         AttrMode.Event,
    ondrag:             AttrMode.Event,
    ondragend:          AttrMode.Event,
    ondragenter:        AttrMode.Event,
    ondragleave:        AttrMode.Event,
    ondragover:         AttrMode.Event,
    ondragstart:        AttrMode.Event,
    ondrop:             AttrMode.Event,
    ondurationchange:   AttrMode.Event,
    onended:            AttrMode.Event,
    onemptied:          AttrMode.Event,
    onerror:            AttrMode.Event,
    onfocus:            AttrMode.Event,
    onhelp:             AttrMode.Event,
    oninput:            AttrMode.Event,
    onkeydown:          AttrMode.Event,
    onkeypress:         AttrMode.Event,
    onkeyup:            AttrMode.Event,
    onload:             AttrMode.Event,
    onloadeddata:       AttrMode.Event,
    onloadedmetadata:   AttrMode.Event,
    onloadstart:        AttrMode.Event,
    onmousedown:        AttrMode.Event,
    onmouseenter:       AttrMode.Event,
    onmouseleave:       AttrMode.Event,
    onmousemove:        AttrMode.Event,
    onmouseout:         AttrMode.Event,
    onmouseover:        AttrMode.Event,
    onmouseup:          AttrMode.Event,
    onmousewheel:       AttrMode.Event,
    onpaste:            AttrMode.Event,
    onpause:            AttrMode.Event,
    onplay:             AttrMode.Event,
    onplaying:          AttrMode.Event,
    onprogress:         AttrMode.Event,
    onratechange:       AttrMode.Event,
    onreadystatechange: AttrMode.Event,
    onreset:            AttrMode.Event,
    onscroll:           AttrMode.Event,
    onseeked:           AttrMode.Event,
    onseeking:          AttrMode.Event,
    onselect:           AttrMode.Event,
    onselectstart:      AttrMode.Event,
    onstalled:          AttrMode.Event,
    onsubmit:           AttrMode.Event,
    onsuspend:          AttrMode.Event,
    ontimeupdate:       AttrMode.Event,
    onvolumechange:     AttrMode.Event,
    onwaiting:          AttrMode.Event
  };

  /**
   * Insert an element into an array at a specified index.
   */
  function arrayInsert<T>(array: T[], i: number, value: T): void {
    for (let k = array.length; k > i; --k) {
      array[k] = array[k - 1];
    }
    array[i] = value;
  }

  /**
   * Move an element in an array from one index to another.
   */
  function arrayMove<T>(array: T[], i: number, j: number): void {
    if (i === j) {
      return;
    }
    let value = array[i];
    let d = i < j ? 1 : -1;
    for (let k = i; k !== j; k += d) {
      array[k] = array[k + d];
    }
    array[j] = value;
  }
}

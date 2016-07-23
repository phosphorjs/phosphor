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
 * *will* result in undefined rendering behavior.
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
   * The interpretation of the tag depends upon the node type:
   *   - 'element': the element tag name
   *   - 'text': the text content
   */
  tag: string;

  /**
   * The attributes for the node.
   *
   * #### Notes
   * The interpretation of the attrs depends upon the node type:
   *   - 'element': the element attributes
   *   - 'text': an empty object
   */
  attrs: IVNodeAttrs;

  /**
   * The array of child elements.
   *
   * #### Notes
   * The interpretation of the children depends upon the node type:
   *   - 'element': the element children
   *   - 'text': an empty array
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
 * A type alias for an `h()` factory child argument.
 */
export
type FactoryChild = (string | VNode) | Array<string | VNode>;


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
 * children by any desired means.
 */
export function h(tag: 'a', attrs?: IAnchorAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'abbr', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'address', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'area', attrs?: IAreaAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'article', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'aside', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'audio', attrs?: IMediaAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'b', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'bdi', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'bdo', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'blockquote', attrs?: IQuoteAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'br', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'button', attrs?: IButtonAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'canvas', attrs?: ICanvasAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'caption', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'cite', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'code', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'col', attrs?: ITableColAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'colgroup', attrs?: ITableColAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'data', attrs?: IDataAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'datalist', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'dd', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'del', attrs?: IModAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'dfn', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'div', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'dl', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'dt', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'em', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'embed', attrs?: IEmbedAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'fieldset', attrs?: IFieldSetAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'figcaption', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'figure', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'footer', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'form', attrs?: IFormAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'h1', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'h2', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'h3', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'h4', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'h5', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'h6', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'header', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'hr', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'i', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'iframe', attrs?: IIFrameAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'img', attrs?: IImageAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'input', attrs?: IInputAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'ins', attrs?: IModAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'kbd', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'label', attrs?: ILabelAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'legend', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'li', attrs?: ILIAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'main', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'map', attrs?: IMapAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'mark', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'meter', attrs?: IMeterAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'nav', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'noscript', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'object', attrs?: IObjectAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'ol', attrs?: IOListAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'optgroup', attrs?: IOptGroupAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'option', attrs?: IOptionAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'output', attrs?: IOutputAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'p', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'param', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'pre', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'progress', attrs?: IProgressAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'q', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'rp', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'rt', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'ruby', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 's', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'samp', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'section', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'select', attrs?: ISelectAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'small', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'source', attrs?: ISourceAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'span', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'strong', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'sub', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'summary', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'sup', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'table', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'tbody', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'td', attrs?: ITableDataCellAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'textarea', attrs?: ITextAreaAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'tfoot', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'th', attrs?: ITableHeaderCellAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'thead', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'time', attrs?: ITimeAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'title', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'tr', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'track', attrs?: ITrackAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'u', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'ul', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'var', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'video', attrs?: IVideoAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: 'wbr', attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: string, attrs?: IElementAttrs, ...children: FactoryChild[]): VNode;
export function h(tag: string, first?: any): VNode {
  // Setup the variables to hold the parsed data.
  let attrs: any;
  let children: any[];

  // Parse the first variadic arugment.
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
        Private.extend(children, child);
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
        children[i] = Private.createTextNode(child);
      }
    }
  }

  // Return a new virtual DOM node.
  return Private.createElementNode(tag, attrs, children);
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Create a virtual text node for the given string.
   */
  export
  function createTextNode(text: string): VNode {
    return new VNode('text', text, emptyObject, emptyArray);
  }

  /**
   * Create a virtual element node for the given parameters.
   */
  export
  function createElementNode(tag: string, attrs?: any, children?: any[]): VNode {
    attrs = attrs || emptyObject;
    children = children || emptyArray;
    return new VNode('element', tag, attrs, children);
  }

  /**
   * Extend the first array with elements of the second.
   *
   * Falsey values in the second array are ignored.
   */
  export
  function extend(first: any[], second: any[]): void {
    for (let i = 0, n = second.length; i < n; ++i) {
      if (second[i]) first.push(second[i]);
    }
  }

  /**
   * A shared frozen empty array.
   */
  const emptyArray = Object.freeze([]);

  /**
   * A shared frozen empty object.
   */
  const emptyObject = Object.freeze({});
}

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * The names of the supported HTML5 DOM element attributes.
 *
 * This list is not all-encompassing, rather it attempts to define the
 * attribute names which are relevant for use in a virtual DOM context.
 * If a standardized or widely supported name is missing, please open
 * an issue to have it added.
 *
 * The attribute names were collected from the following sources:
 *   - https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
 *   - https://www.w3.org/TR/html5/index.html#attributes-1
 *   - https://html.spec.whatwg.org/multipage/indices.html#attributes-3
 */
export
type ElementAttrNames = (
  'abbr' |
  'accept' |
  'accept-charset' |
  'accesskey' |
  'action' |
  'allowfullscreen' |
  'alt' |
  'autocomplete' |
  'autofocus' |
  'autoplay' |
  'autosave' |
  'checked' |
  'cite' |
  'class' |
  'cols' |
  'colspan' |
  'contenteditable' |
  'controls' |
  'coords' |
  'crossorigin' |
  'data' |
  'datetime' |
  'default' |
  'dir' |
  'dirname' |
  'disabled' |
  'download' |
  'draggable' |
  'dropzone' |
  'enctype' |
  'for' |
  'form' |
  'formaction' |
  'formenctype' |
  'formmethod' |
  'formnovalidate' |
  'formtarget' |
  'headers' |
  'height' |
  'hidden' |
  'high' |
  'href' |
  'hreflang' |
  'id' |
  'inputmode' |
  'integrity' |
  'ismap' |
  'kind' |
  'label' |
  'lang' |
  'list' |
  'loop' |
  'low' |
  'max' |
  'maxlength' |
  'media' |
  'mediagroup' |
  'method' |
  'min' |
  'minlength' |
  'multiple' |
  'muted' |
  'name' |
  'novalidate' |
  'optimum' |
  'pattern' |
  'placeholder' |
  'poster' |
  'preload' |
  'readonly' |
  'rel' |
  'required' |
  'reversed' |
  'rows' |
  'rowspan' |
  'sandbox' |
  'scope' |
  'selected' |
  'shape' |
  'size' |
  'sizes' |
  'span' |
  'spellcheck' |
  'src' |
  'srcdoc' |
  'srclang' |
  'srcset' |
  'start' |
  'step' |
  'tabindex' |
  'target' |
  'title' |
  'type' |
  'typemustmatch' |
  'usemap' |
  'value' |
  'width' |
  'wrap'
);


/**
 * The names of the supported HTML5 CSS property names.
 *
 * If a standardized or widely supported name is missing, please open
 * an issue to have it added.
 *
 * The property names were collected from the following sources:
 *   - TypeScript's `lib.dom.d.ts` file
 */
export
type CSSPropertyNames = (
  'alignContent' |
  'alignItems' |
  'alignSelf' |
  'alignmentBaseline' |
  'animation' |
  'animationDelay' |
  'animationDirection' |
  'animationDuration' |
  'animationFillMode' |
  'animationIterationCount' |
  'animationName' |
  'animationPlayState' |
  'animationTimingFunction' |
  'backfaceVisibility' |
  'background' |
  'backgroundAttachment' |
  'backgroundClip' |
  'backgroundColor' |
  'backgroundImage' |
  'backgroundOrigin' |
  'backgroundPosition' |
  'backgroundPositionX' |
  'backgroundPositionY' |
  'backgroundRepeat' |
  'backgroundSize' |
  'baselineShift' |
  'border' |
  'borderBottom' |
  'borderBottomColor' |
  'borderBottomLeftRadius' |
  'borderBottomRightRadius' |
  'borderBottomStyle' |
  'borderBottomWidth' |
  'borderCollapse' |
  'borderColor' |
  'borderImage' |
  'borderImageOutset' |
  'borderImageRepeat' |
  'borderImageSlice' |
  'borderImageSource' |
  'borderImageWidth' |
  'borderLeft' |
  'borderLeftColor' |
  'borderLeftStyle' |
  'borderLeftWidth' |
  'borderRadius' |
  'borderRight' |
  'borderRightColor' |
  'borderRightStyle' |
  'borderRightWidth' |
  'borderSpacing' |
  'borderStyle' |
  'borderTop' |
  'borderTopColor' |
  'borderTopLeftRadius' |
  'borderTopRightRadius' |
  'borderTopStyle' |
  'borderTopWidth' |
  'borderWidth' |
  'bottom' |
  'boxShadow' |
  'boxSizing' |
  'breakAfter' |
  'breakBefore' |
  'breakInside' |
  'captionSide' |
  'clear' |
  'clip' |
  'clipPath' |
  'clipRule' |
  'color' |
  'colorInterpolationFilters' |
  'columnCount' |
  'columnFill' |
  'columnGap' |
  'columnRule' |
  'columnRuleColor' |
  'columnRuleStyle' |
  'columnRuleWidth' |
  'columnSpan' |
  'columnWidth' |
  'columns' |
  'content' |
  'counterIncrement' |
  'counterReset' |
  'cssFloat' |
  'cssText' |
  'cursor' |
  'direction' |
  'display' |
  'dominantBaseline' |
  'emptyCells' |
  'enableBackground' |
  'fill' |
  'fillOpacity' |
  'fillRule' |
  'filter' |
  'flex' |
  'flexBasis' |
  'flexDirection' |
  'flexFlow' |
  'flexGrow' |
  'flexShrink' |
  'flexWrap' |
  'floodColor' |
  'floodOpacity' |
  'font' |
  'fontFamily' |
  'fontFeatureSettings' |
  'fontSize' |
  'fontSizeAdjust' |
  'fontStretch' |
  'fontStyle' |
  'fontVariant' |
  'fontWeight' |
  'glyphOrientationHorizontal' |
  'glyphOrientationVertical' |
  'height' |
  'imeMode' |
  'justifyContent' |
  'kerning' |
  'left' |
  'letterSpacing' |
  'lightingColor' |
  'lineHeight' |
  'listStyle' |
  'listStyleImage' |
  'listStylePosition' |
  'listStyleType' |
  'margin' |
  'marginBottom' |
  'marginLeft' |
  'marginRight' |
  'marginTop' |
  'marker' |
  'markerEnd' |
  'markerMid' |
  'markerStart' |
  'mask' |
  'maxHeight' |
  'maxWidth' |
  'minHeight' |
  'minWidth' |
  'msContentZoomChaining' |
  'msContentZoomLimit' |
  'msContentZoomLimitMax' |
  'msContentZoomLimitMin' |
  'msContentZoomSnap' |
  'msContentZoomSnapPoints' |
  'msContentZoomSnapType' |
  'msContentZooming' |
  'msFlowFrom' |
  'msFlowInto' |
  'msFontFeatureSettings' |
  'msGridColumn' |
  'msGridColumnAlign' |
  'msGridColumnSpan' |
  'msGridColumns' |
  'msGridRow' |
  'msGridRowAlign' |
  'msGridRowSpan' |
  'msGridRows' |
  'msHighContrastAdjust' |
  'msHyphenateLimitChars' |
  'msHyphenateLimitLines' |
  'msHyphenateLimitZone' |
  'msHyphens' |
  'msImeAlign' |
  'msOverflowStyle' |
  'msScrollChaining' |
  'msScrollLimit' |
  'msScrollLimitXMax' |
  'msScrollLimitXMin' |
  'msScrollLimitYMax' |
  'msScrollLimitYMin' |
  'msScrollRails' |
  'msScrollSnapPointsX' |
  'msScrollSnapPointsY' |
  'msScrollSnapType' |
  'msScrollSnapX' |
  'msScrollSnapY' |
  'msScrollTranslation' |
  'msTextCombineHorizontal' |
  'msTextSizeAdjust' |
  'msTouchAction' |
  'msTouchSelect' |
  'msUserSelect' |
  'msWrapFlow' |
  'msWrapMargin' |
  'msWrapThrough' |
  'opacity' |
  'order' |
  'orphans' |
  'outline' |
  'outlineColor' |
  'outlineStyle' |
  'outlineWidth' |
  'overflow' |
  'overflowX' |
  'overflowY' |
  'padding' |
  'paddingBottom' |
  'paddingLeft' |
  'paddingRight' |
  'paddingTop' |
  'pageBreakAfter' |
  'pageBreakBefore' |
  'pageBreakInside' |
  'perspective' |
  'perspectiveOrigin' |
  'pointerEvents' |
  'position' |
  'quotes' |
  'resize' |
  'right' |
  'rubyAlign' |
  'rubyOverhang' |
  'rubyPosition' |
  'stopColor' |
  'stopOpacity' |
  'stroke' |
  'strokeDasharray' |
  'strokeDashoffset' |
  'strokeLinecap' |
  'strokeLinejoin' |
  'strokeMiterlimit' |
  'strokeOpacity' |
  'strokeWidth' |
  'tableLayout' |
  'textAlign' |
  'textAlignLast' |
  'textAnchor' |
  'textDecoration' |
  'textIndent' |
  'textJustify' |
  'textKashida' |
  'textKashidaSpace' |
  'textOverflow' |
  'textShadow' |
  'textTransform' |
  'textUnderlinePosition' |
  'top' |
  'touchAction' |
  'transform' |
  'transformOrigin' |
  'transformStyle' |
  'transition' |
  'transitionDelay' |
  'transitionDuration' |
  'transitionProperty' |
  'transitionTimingFunction' |
  'unicodeBidi' |
  'verticalAlign' |
  'visibility' |
  'webkitAlignContent' |
  'webkitAlignItems' |
  'webkitAlignSelf' |
  'webkitAnimation' |
  'webkitAnimationDelay' |
  'webkitAnimationDirection' |
  'webkitAnimationDuration' |
  'webkitAnimationFillMode' |
  'webkitAnimationIterationCount' |
  'webkitAnimationName' |
  'webkitAnimationPlayState' |
  'webkitAnimationTimingFunction' |
  'webkitAppearance' |
  'webkitBackfaceVisibility' |
  'webkitBackgroundClip' |
  'webkitBackgroundOrigin' |
  'webkitBackgroundSize' |
  'webkitBorderBottomLeftRadius' |
  'webkitBorderBottomRightRadius' |
  'webkitBorderImage' |
  'webkitBorderRadius' |
  'webkitBorderTopLeftRadius' |
  'webkitBorderTopRightRadius' |
  'webkitBoxAlign' |
  'webkitBoxDirection' |
  'webkitBoxFlex' |
  'webkitBoxOrdinalGroup' |
  'webkitBoxOrient' |
  'webkitBoxPack' |
  'webkitBoxSizing' |
  'webkitColumnBreakAfter' |
  'webkitColumnBreakBefore' |
  'webkitColumnBreakInside' |
  'webkitColumnCount' |
  'webkitColumnGap' |
  'webkitColumnRule' |
  'webkitColumnRuleColor' |
  'webkitColumnRuleStyle' |
  'webkitColumnRuleWidth' |
  'webkitColumnSpan' |
  'webkitColumnWidth' |
  'webkitColumns' |
  'webkitFilter' |
  'webkitFlex' |
  'webkitFlexBasis' |
  'webkitFlexDirection' |
  'webkitFlexFlow' |
  'webkitFlexGrow' |
  'webkitFlexShrink' |
  'webkitFlexWrap' |
  'webkitJustifyContent' |
  'webkitOrder' |
  'webkitPerspective' |
  'webkitPerspectiveOrigin' |
  'webkitTapHighlightColor' |
  'webkitTextFillColor' |
  'webkitTextSizeAdjust' |
  'webkitTransform' |
  'webkitTransformOrigin' |
  'webkitTransformStyle' |
  'webkitTransition' |
  'webkitTransitionDelay' |
  'webkitTransitionDuration' |
  'webkitTransitionProperty' |
  'webkitTransitionTimingFunction' |
  'webkitUserModify' |
  'webkitUserSelect' |
  'webkitWritingMode' |
  'whiteSpace' |
  'widows' |
  'width' |
  'wordBreak' |
  'wordSpacing' |
  'wordWrap' |
  'writingMode' |
  'zIndex' |
  'zoom'
);


/**
 * A mapping of inline event name to event object type.
 *
 * This mapping is used to create the event listener properties for
 * the virtual DOM element attributes object. If a standardized or
 * widely supported name is missing, please open an issue to have it
 * added.
 *
 * The event names were collected from the following sources:
 *   - TypeScript's `lib.dom.d.ts` file
 *   - https://www.w3.org/TR/html5/index.html#attributes-1
 *   - https://html.spec.whatwg.org/multipage/webappapis.html#idl-definitions
 */
export
type ElementEventMap = {
  onabort: UIEvent;
  onauxclick: MouseEvent;
  onblur: FocusEvent;
  oncanplay: Event;
  oncanplaythrough: Event;
  onchange: Event;
  onclick: MouseEvent;
  oncontextmenu: PointerEvent;
  oncopy: ClipboardEvent;
  oncuechange: Event;
  oncut: ClipboardEvent;
  ondblclick: MouseEvent;
  ondrag: DragEvent;
  ondragend: DragEvent;
  ondragenter: DragEvent;
  ondragexit: DragEvent;
  ondragleave: DragEvent;
  ondragover: DragEvent;
  ondragstart: DragEvent;
  ondrop: DragEvent;
  ondurationchange: Event;
  onemptied: Event;
  onended: MediaStreamErrorEvent;
  onerror: ErrorEvent;
  onfocus: FocusEvent;
  oninput: Event;
  oninvalid: Event;
  onkeydown: KeyboardEvent;
  onkeypress: KeyboardEvent;
  onkeyup: KeyboardEvent;
  onload: Event;
  onloadeddata: Event;
  onloadedmetadata: Event;
  onloadend: Event;
  onloadstart: Event;
  onmousedown: MouseEvent;
  onmouseenter: MouseEvent;
  onmouseleave: MouseEvent;
  onmousemove: MouseEvent;
  onmouseout: MouseEvent;
  onmouseover: MouseEvent;
  onmouseup: MouseEvent;
  onmousewheel: WheelEvent;
  onpaste: ClipboardEvent;
  onpause: Event;
  onplay: Event;
  onplaying: Event;
  onpointercancel: PointerEvent;
  onpointerdown: PointerEvent;
  onpointerenter: PointerEvent;
  onpointerleave: PointerEvent;
  onpointermove: PointerEvent;
  onpointerout: PointerEvent;
  onpointerover: PointerEvent;
  onpointerup: PointerEvent;
  onprogress: ProgressEvent;
  onratechange: Event;
  onreset: Event;
  onscroll: UIEvent;
  onseeked: Event;
  onseeking: Event;
  onselect: UIEvent;
  onselectstart: Event;
  onstalled: Event;
  onsubmit: Event;
  onsuspend: Event;
  ontimeupdate: Event;
  onvolumechange: Event;
  onwaiting: Event;
};


/**
 * An object which represents a dataset for a virtual DOM element.
 *
 * The names of the dataset properties will be automatically prefixed
 * with `data-` before being added to the node, e.g. `{ thing: '12' }`
 * will be rendered as `data-thing='12'` in the DOM element.
 */
export
type ElementDataset = {
  readonly [name: string]: string;
};


/**
 * The inline style for for a virtual DOM element.
 *
 * Style attributes use the JS camel-cased property names instead of
 * the CSS hyphenated names for performance and security.
 */
export
type ElementInlineStyle = {
  readonly [T in CSSPropertyNames]?: string | null;
};


/**
 * The base attributes for a virtual element node.
 *
 * These are the attributes which are applied to a real DOM element via
 * `element.setAttribute()`. The supported attribute names are defined
 * by the `ElementAttrNames` type.
 *
 * Node attributes are specified using the lower-case HTML name instead
 * of the camel-case JS name due to browser inconsistencies in handling
 * the JS versions.
 */
export
type ElementBaseAttrs = {
  readonly [T in ElementAttrNames]?: string;
};


/**
 * The inline event listener attributes for a virtual element node.
 *
 * The supported listeners are defined by the `ElementEventMap` type.
 */
export
type ElementEventAttrs = {
  readonly [T in keyof ElementEventMap]?: (event: ElementEventMap[T]) => any;
};


/**
 * The special-cased attributes for a virtual element node.
 */
export
type ElementSpecialAttrs = {
  /**
   * The key id for the virtual element node.
   *
   * If a node is given a key id, the generated DOM node will not be
   * recreated during a rendering update if it only moves among its
   * siblings in the render tree.
   *
   * In general, reordering child nodes will cause the nodes to be
   * completely re-rendered. Keys allow this to be optimized away.
   *
   * If a key is provided, it must be unique among sibling nodes.
   */
  readonly key?: string;

  /**
   * The dataset for the rendered DOM element.
   */
  readonly dataset?: ElementDataset;

  /**
   * The inline style for the rendered DOM element.
   */
  readonly style?: ElementInlineStyle;
};


/**
 * The full set of attributes supported by a virtual element node.
 *
 * This is the combination of the base element attributes, the inline
 * element event listeners, and the special element attributes.
 */
export
type ElementAttrs = (
  ElementBaseAttrs &
  ElementEventAttrs &
  ElementSpecialAttrs
);


/**
 * A virtual node which represents plain text content.
 *
 * #### Notes
 * User code will not typically create a `VirtualTextNode` directly.
 * Instead, the `h()` function will be used to create an element tree.
 */
export
class VirtualTextNode {
  /**
   * The text content for the node.
   */
  readonly content: string;

  /**
   * The type of the node.
   *
   * This value can be used as a type guard for discriminating the
   * `VirtualNode` union type.
   */
  readonly type: 'text' = 'text';

  /**
   * Construct a new virtual text node.
   *
   * @param content - The text content for the node.
   */
  constructor(content: string) {
    this.content = content;
  }
}


/**
 * A virtual node which represents an HTML element.
 *
 * #### Notes
 * User code will not typically create a `VirtualElementNode` directly.
 * Instead, the `h()` function will be used to create an element tree.
 */
export
class VirtualElementNode {
  /**
   * The tag name for the element.
   */
  readonly tag: string;

  /**
   * The attributes for the element.
   */
  readonly attrs: ElementAttrs;

  /**
   * The children for the element.
   */
  readonly children: ReadonlyArray<VirtualNode>;

  /**
   * The type of the node.
   *
   * This value can be used as a type guard for discriminating the
   * `VirtualNode` union type.
   */
  readonly type: 'element' = 'element';

  /**
   * Construct a new virtual element node.
   *
   * @param tag - The element tag name.
   *
   * @param attrs - The element attributes.
   *
   * @param children - The element children.
   */
  constructor(tag: string, attrs: ElementAttrs, children: ReadonlyArray<VirtualNode>) {
    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
  }
}


/**
 * A type alias for a general virtual node.
 */
export
type VirtualNode = VirtualElementNode | VirtualTextNode;


/**
 * Create a new virtual element node.
 *
 * @param tag - The tag name for the element.
 *
 * @param attrs - The attributes for the element, if any.
 *
 * @param children - The children for the element, if any.
 *
 * @returns A new virtual element node for the given parameters.
 *
 * #### Notes
 * The children may be string literals, other virtual nodes, `null`, or
 * an array of those things. Strings are converted into text nodes, and
 * arrays are inlined as if the array contents were given as positional
 * arguments. This makes it simple to build up an array of children by
 * any desired means. `null` child values are simply ignored.
 *
 * A bound function for each HTML tag name is available as a static
 * function attached to the `h()` function. E.g. `h('div', ...)` is
 * equivalent to `h.div(...)`.
 */
export function h(tag: string, ...children: h.Child[]): VirtualElementNode;
export function h(tag: string, attrs: ElementAttrs, ...children: h.Child[]): VirtualElementNode;
export function h(tag: string): VirtualElementNode {
  let attrs: ElementAttrs = {};
  let children: VirtualNode[] = [];
  for (let i = 1, n = arguments.length; i < n; ++i) {
    let arg = arguments[i];
    if (typeof arg === 'string') {
      children.push(new VirtualTextNode(arg));
    } else if (arg instanceof VirtualTextNode) {
      children.push(arg);
    } else if (arg instanceof VirtualElementNode) {
      children.push(arg);
    } else if (arg instanceof Array) {
      extend(children, arg);
    } else if (i === 1 && arg && typeof arg === 'object') {
      attrs = arg;
    }
  }
  return new VirtualElementNode(tag, attrs, children);

  function extend(array: VirtualNode[], values: h.Child[]): void {
    for (let child of values) {
      if (typeof child === 'string') {
        array.push(new VirtualTextNode(child));
      } else if (child instanceof VirtualTextNode) {
        array.push(child);
      } else if (child instanceof VirtualElementNode) {
        array.push(child);
      }
    }
  }
}


/**
 * The namespace for the `h` function statics.
 */
export
namespace h {
  /**
   * A type alias for the supported child argument types.
   */
  export
  type Child = (string | VirtualNode | null) | Array<string | VirtualNode | null>;

  /**
   * A bound factory function for a specific `h()` tag.
   */
  export
  interface IFactory {
    (...children: Child[]): VirtualElementNode;
    (attrs: ElementAttrs, ...children: Child[]): VirtualElementNode;
  }

  export const a: IFactory = h.bind(undefined, 'a');
  export const abbr: IFactory = h.bind(undefined, 'abbr');
  export const address: IFactory = h.bind(undefined, 'address');
  export const area: IFactory = h.bind(undefined, 'area');
  export const article: IFactory = h.bind(undefined, 'article');
  export const aside: IFactory = h.bind(undefined, 'aside');
  export const audio: IFactory = h.bind(undefined, 'audio');
  export const b: IFactory = h.bind(undefined, 'b');
  export const bdi: IFactory = h.bind(undefined, 'bdi');
  export const bdo: IFactory = h.bind(undefined, 'bdo');
  export const blockquote: IFactory = h.bind(undefined, 'blockquote');
  export const br: IFactory = h.bind(undefined, 'br');
  export const button: IFactory = h.bind(undefined, 'button');
  export const canvas: IFactory = h.bind(undefined, 'canvas');
  export const caption: IFactory = h.bind(undefined, 'caption');
  export const cite: IFactory = h.bind(undefined, 'cite');
  export const code: IFactory = h.bind(undefined, 'code');
  export const col: IFactory = h.bind(undefined, 'col');
  export const colgroup: IFactory = h.bind(undefined, 'colgroup');
  export const data: IFactory = h.bind(undefined, 'data');
  export const datalist: IFactory = h.bind(undefined, 'datalist');
  export const dd: IFactory = h.bind(undefined, 'dd');
  export const del: IFactory = h.bind(undefined, 'del');
  export const dfn: IFactory = h.bind(undefined, 'dfn');
  export const div: IFactory = h.bind(undefined, 'div');
  export const dl: IFactory = h.bind(undefined, 'dl');
  export const dt: IFactory = h.bind(undefined, 'dt');
  export const em: IFactory = h.bind(undefined, 'em');
  export const embed: IFactory = h.bind(undefined, 'embed');
  export const fieldset: IFactory = h.bind(undefined, 'fieldset');
  export const figcaption: IFactory = h.bind(undefined, 'figcaption');
  export const figure: IFactory = h.bind(undefined, 'figure');
  export const footer: IFactory = h.bind(undefined, 'footer');
  export const form: IFactory = h.bind(undefined, 'form');
  export const h1: IFactory = h.bind(undefined, 'h1');
  export const h2: IFactory = h.bind(undefined, 'h2');
  export const h3: IFactory = h.bind(undefined, 'h3');
  export const h4: IFactory = h.bind(undefined, 'h4');
  export const h5: IFactory = h.bind(undefined, 'h5');
  export const h6: IFactory = h.bind(undefined, 'h6');
  export const header: IFactory = h.bind(undefined, 'header');
  export const hr: IFactory = h.bind(undefined, 'hr');
  export const i: IFactory = h.bind(undefined, 'i');
  export const iframe: IFactory = h.bind(undefined, 'iframe');
  export const img: IFactory = h.bind(undefined, 'img');
  export const input: IFactory = h.bind(undefined, 'input');
  export const ins: IFactory = h.bind(undefined, 'ins');
  export const kbd: IFactory = h.bind(undefined, 'kbd');
  export const label: IFactory = h.bind(undefined, 'label');
  export const legend: IFactory = h.bind(undefined, 'legend');
  export const li: IFactory = h.bind(undefined, 'li');
  export const main: IFactory = h.bind(undefined, 'main');
  export const map: IFactory = h.bind(undefined, 'map');
  export const mark: IFactory = h.bind(undefined, 'mark');
  export const meter: IFactory = h.bind(undefined, 'meter');
  export const nav: IFactory = h.bind(undefined, 'nav');
  export const noscript: IFactory = h.bind(undefined, 'noscript');
  export const object: IFactory = h.bind(undefined, 'object');
  export const ol: IFactory = h.bind(undefined, 'ol');
  export const optgroup: IFactory = h.bind(undefined, 'optgroup');
  export const option: IFactory = h.bind(undefined, 'option');
  export const output: IFactory = h.bind(undefined, 'output');
  export const p: IFactory = h.bind(undefined, 'p');
  export const param: IFactory = h.bind(undefined, 'param');
  export const pre: IFactory = h.bind(undefined, 'pre');
  export const progress: IFactory = h.bind(undefined, 'progress');
  export const q: IFactory = h.bind(undefined, 'q');
  export const rp: IFactory = h.bind(undefined, 'rp');
  export const rt: IFactory = h.bind(undefined, 'rt');
  export const ruby: IFactory = h.bind(undefined, 'ruby');
  export const s: IFactory = h.bind(undefined, 's');
  export const samp: IFactory = h.bind(undefined, 'samp');
  export const section: IFactory = h.bind(undefined, 'section');
  export const select: IFactory = h.bind(undefined, 'select');
  export const small: IFactory = h.bind(undefined, 'small');
  export const source: IFactory = h.bind(undefined, 'source');
  export const span: IFactory = h.bind(undefined, 'span');
  export const strong: IFactory = h.bind(undefined, 'strong');
  export const sub: IFactory = h.bind(undefined, 'sub');
  export const summary: IFactory = h.bind(undefined, 'summary');
  export const sup: IFactory = h.bind(undefined, 'sup');
  export const table: IFactory = h.bind(undefined, 'table');
  export const tbody: IFactory = h.bind(undefined, 'tbody');
  export const td: IFactory = h.bind(undefined, 'td');
  export const textarea: IFactory = h.bind(undefined, 'textarea');
  export const tfoot: IFactory = h.bind(undefined, 'tfoot');
  export const th: IFactory = h.bind(undefined, 'th');
  export const thead: IFactory = h.bind(undefined, 'thead');
  export const time: IFactory = h.bind(undefined, 'time');
  export const title: IFactory = h.bind(undefined, 'title');
  export const tr: IFactory = h.bind(undefined, 'tr');
  export const track: IFactory = h.bind(undefined, 'track');
  export const u: IFactory = h.bind(undefined, 'u');
  export const ul: IFactory = h.bind(undefined, 'ul');
  export const var_: IFactory = h.bind(undefined, 'var');
  export const video: IFactory = h.bind(undefined, 'video');
  export const wbr: IFactory = h.bind(undefined, 'wbr');
}

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

/**
 * The attributes available for all elements.
 *
 * Arbitrary 'data-*' attributes are also supported.
 */
export
interface IElementAttributes extends IVirtualElementData {
  accessKey?: string;
  className?: string;
  contentEditable?: string;
  dir?: string;
  draggable?: boolean;
  hidden?: any;
  id?: string;
  lang?: string;
  spellcheck?: boolean;
  style?: { [k: string]: string };
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
 * The attributes for <a> elements.
 */
export
interface IAnchorAttributes extends IElementAttributes {
  download?: string;
  href?: string;
  hreflang?: string;
  media?: string;
  rel?: string;
  target?: string;
  type?: string;
}


/**
 * The attributes for <area> elements.
 */
export
interface IAreaAttributes extends IElementAttributes {
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
 * The attributes for <button> elements.
 */
export
interface IButtonAttributes extends IElementAttributes {
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
 * The attributes for <canvas> elements.
 */
export
interface ICanvasAttributes extends IElementAttributes {
  width?: number;
  height?: number;
}


/**
 * The attributes for <data> elements.
 */
export
interface IDataAttributes extends IElementAttributes {
  value?: string;
}


/**
 * The attributes for <embed> elements.
 */
export
interface IEmbedAttributes extends IElementAttributes {
  height?: string;
  src?: string;
  type?: string;
  width?: string;
}


/**
 * The attributes for <fieldset> elements.
 */
export
interface IFieldSetAttributes extends IElementAttributes {
  disabled?: boolean;
  form?: string;
  name?: string;
}


/**
 * The attributes for <form> elements.
 */
export
interface IFormAttributes extends  IElementAttributes {
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
 * The attributes for <iframe> elements.
 */
export
interface IIFrameAttributes extends IElementAttributes {
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
 * The attributes for <img> elements.
 */
export
interface IImageAttributes extends  IElementAttributes {
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
 * The attributes for <input> elements.
 */
export
interface IInputAttributes extends IElementAttributes {
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
 * The attributes for <label> elements.
 */
export
interface ILabelAttributes extends IElementAttributes {
  form?: string;
  htmlFor?: string;
}


/**
 * The attributes for <li> elements.
 */
export
interface ILIAttributes extends IElementAttributes {
  value?: number;
}


/**
 * The attributes for <map> elements.
 */
export
interface IMapAttributes extends IElementAttributes {
  name?: string;
}


/**
 * The attributes for <meter> elements.
 */
export
interface IMeterAttributes extends IElementAttributes {
  high?: number;
  low?: number;
  max?: number;
  min?: number;
  optimum?: number;
  value?: number;
}


/**
 * The attributes for <audio> and <video> elements.
 */
export
interface IMediaAttributes extends IElementAttributes {
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
 * The attributes for <del> and <ins> elements.
 */
export
interface IModAttributes extends IElementAttributes {
  cite?: string;
  dateTime?: string;
}


/**
 * The attributes for <object> elements.
 */
export
interface IObjectAttributes extends IElementAttributes {
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
 * The attributes for <ol> elements.
 */
export
interface IOListAttributes extends IElementAttributes {
  reversed?: boolean;
  start?: number;
  type?: string;
}


/**
 * The attributes for <optgroup> elements.
 */
export
interface IOptGroupAttributes extends IElementAttributes {
  disabled?: boolean;
  label?: string;
}


/**
 * The attributes for <option> elements.
 */
export
interface IOptionAttributes extends IElementAttributes {
  disabled?: boolean;
  label?: string;
  selected?: boolean;
  value?: string;
}


/**
 * The attributes for <output> elements.
 */
export
interface IOutputAttributes extends IElementAttributes {
  form?: string;
  htmlFor?: string;
  name?: string;
}


/**
 * The attributes for <param> elements.
 */
export
interface IParamAttributes extends IElementAttributes {
  name?: string;
  value?: string;
}


/**
 * The attributes for <progress> elements.
 */
export
interface IProgressAttributes extends IElementAttributes {
  max?: number;
  value?: number;
}


/**
 * The attributes for <blockquote> elements.
 */
export
interface IQuoteAttributes extends IElementAttributes {
  cite?: string;
}


/**
 * The attributes for <select> elements.
 */
export
interface ISelectAttributes extends IElementAttributes {
  autofocus?: boolean;
  disabled?: boolean;
  form?: string;
  multiple?: boolean;
  name?: string;
  required?: boolean;
  size?: number;
}


/**
 * The attributes for <source> elements.
 */
export
interface ISourceAttributes extends IElementAttributes {
  media?: string;
  sizes?: string;
  src?: string;
  srcset?: string;
  type?: string;
}


/**
 * The attributes for <col> elements.
 */
export
interface ITableColAttributes extends IElementAttributes {
  span?: number;
}


/**
 * The attributes for <td> elements.
 */
export
interface ITableDataCellAttributes extends IElementAttributes {
  colSpan?: number;
  headers?: number;
  rowSpan?: number;
}


/**
 * The attributes for <th> elements.
 */
export
interface ITableHeaderCellAttributes extends IElementAttributes {
  colSpan?: number;
  headers?: string;
  rowSpan?: number;
  scope?: string;
  sorted?: string;
}


/**
 * The attributes for <textarea> elements.
 */
export
interface ITextAreaAttributes extends IElementAttributes {
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
 * The attributes for <time> elements.
 */
export
interface ITimeAttributes extends IElementAttributes {
  dateTime?: string;
}


/**
 * The attributes for <track> elements.
 */
export
interface ITrackAttributes extends IElementAttributes {
  default?: boolean;
  kind?: string;
  label?: string;
  src?: string;
  srclang?: string;
}


/**
 * The attributes for <video> elements.
 */
export
interface IVideoAttributes extends IMediaAttributes {
  height?: number;
  poster?: string;
  width?: number;
}


/**
 * The virtual DOM factory functions.
 */
export
var DOM = {
  a:          createFactory<IAnchorAttributes>('a'),
  abbr:       createFactory<IElementAttributes>('abbr'),
  address:    createFactory<IElementAttributes>('address'),
  area:       createFactory<IAreaAttributes>('area'),
  article:    createFactory<IElementAttributes>('article'),
  aside:      createFactory<IElementAttributes>('aside'),
  audio:      createFactory<IMediaAttributes>('audio'),
  b:          createFactory<IElementAttributes>('b'),
  bdi:        createFactory<IElementAttributes>('bdi'),
  bdo:        createFactory<IElementAttributes>('bdo'),
  blockquote: createFactory<IQuoteAttributes>('blockquote'),
  br:         createFactory<IElementAttributes>('br'),
  button:     createFactory<IButtonAttributes>('button'),
  canvas:     createFactory<ICanvasAttributes>('canvas'),
  caption:    createFactory<IElementAttributes>('caption'),
  cite:       createFactory<IElementAttributes>('cite'),
  code:       createFactory<IElementAttributes>('code'),
  col:        createFactory<ITableColAttributes>('col'),
  colgroup:   createFactory<ITableColAttributes>('colgroup'),
  data:       createFactory<IDataAttributes>('data'),
  datalist:   createFactory<IElementAttributes>('datalist'),
  dd:         createFactory<IElementAttributes>('dd'),
  del:        createFactory<IModAttributes>('del'),
  dfn:        createFactory<IElementAttributes>('dfn'),
  div:        createFactory<IElementAttributes>('div'),
  dl:         createFactory<IElementAttributes>('dl'),
  dt:         createFactory<IElementAttributes>('dt'),
  em:         createFactory<IElementAttributes>('em'),
  embed:      createFactory<IEmbedAttributes>('embed'),
  fieldset:   createFactory<IFieldSetAttributes>('fieldset'),
  figcaption: createFactory<IElementAttributes>('figcaption'),
  figure:     createFactory<IElementAttributes>('figure'),
  footer:     createFactory<IElementAttributes>('footer'),
  form:       createFactory<IFormAttributes>('form'),
  h1:         createFactory<IElementAttributes>('h1'),
  h2:         createFactory<IElementAttributes>('h2'),
  h3:         createFactory<IElementAttributes>('h3'),
  h4:         createFactory<IElementAttributes>('h4'),
  h5:         createFactory<IElementAttributes>('h5'),
  h6:         createFactory<IElementAttributes>('h6'),
  header:     createFactory<IElementAttributes>('header'),
  hr:         createFactory<IElementAttributes>('hr'),
  i:          createFactory<IElementAttributes>('i'),
  iframe:     createFactory<IIFrameAttributes>('iframe'),
  img:        createFactory<IImageAttributes>('img'),
  input:      createFactory<IInputAttributes>('input'),
  ins:        createFactory<IModAttributes>('ins'),
  kbd:        createFactory<IElementAttributes>('kbd'),
  label:      createFactory<ILabelAttributes>('label'),
  legend:     createFactory<IElementAttributes>('legend'),
  li:         createFactory<ILIAttributes>('li'),
  main:       createFactory<IElementAttributes>('main'),
  map:        createFactory<IMapAttributes>('map'),
  mark:       createFactory<IElementAttributes>('mark'),
  meter:      createFactory<IMeterAttributes>('meter'),
  nav:        createFactory<IElementAttributes>('nav'),
  object:     createFactory<IObjectAttributes>('object'),
  ol:         createFactory<IOListAttributes>('ol'),
  optgroup:   createFactory<IOptGroupAttributes>('optgroup'),
  option:     createFactory<IOptionAttributes>('option'),
  output:     createFactory<IOutputAttributes>('output'),
  p:          createFactory<IElementAttributes>('p'),
  param:      createFactory<IElementAttributes>('param'),
  pre:        createFactory<IElementAttributes>('pre'),
  progress:   createFactory<IProgressAttributes>('progress'),
  q:          createFactory<IElementAttributes>('q'),
  rp:         createFactory<IElementAttributes>('rp'),
  rt:         createFactory<IElementAttributes>('rt'),
  ruby:       createFactory<IElementAttributes>('ruby'),
  s:          createFactory<IElementAttributes>('s'),
  samp:       createFactory<IElementAttributes>('samp'),
  section:    createFactory<IElementAttributes>('section'),
  select:     createFactory<ISelectAttributes>('select'),
  small:      createFactory<IElementAttributes>('small'),
  source:     createFactory<ISourceAttributes>('source'),
  span:       createFactory<IElementAttributes>('span'),
  strong:     createFactory<IElementAttributes>('strong'),
  sub:        createFactory<IElementAttributes>('sub'),
  summary:    createFactory<IElementAttributes>('summary'),
  sup:        createFactory<IElementAttributes>('sup'),
  table:      createFactory<IElementAttributes>('table'),
  tbody:      createFactory<IElementAttributes>('tbody'),
  td:         createFactory<ITableDataCellAttributes>('td'),
  textarea:   createFactory<ITextAreaAttributes>('textarea'),
  tfoot:      createFactory<IElementAttributes>('tfoot'),
  th:         createFactory<ITableHeaderCellAttributes>('th'),
  thead:      createFactory<IElementAttributes>('thead'),
  time:       createFactory<ITimeAttributes>('time'),
  title:      createFactory<IElementAttributes>('title'),
  tr:         createFactory<IElementAttributes>('tr'),
  track:      createFactory<ITrackAttributes>('track'),
  u:          createFactory<IElementAttributes>('u'),
  ul:         createFactory<IElementAttributes>('ul'),
  var:        createFactory<IElementAttributes>('var'),
  video:      createFactory<IVideoAttributes>('video'),
  wbr:        createFactory<IElementAttributes>('wbr'),
};

} // module phosphor.virtualdom

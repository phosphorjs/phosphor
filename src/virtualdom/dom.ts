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
 */
export
interface IElementAttributes extends IElemData {
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
 * The virtual dom factory functions.
 */
export
var dom = {
  a:          createElemFactory<IAnchorAttributes>('a'),
  abbr:       createElemFactory<IElementAttributes>('abbr'),
  address:    createElemFactory<IElementAttributes>('address'),
  area:       createElemFactory<IAreaAttributes>('area'),
  article:    createElemFactory<IElementAttributes>('article'),
  aside:      createElemFactory<IElementAttributes>('aside'),
  audio:      createElemFactory<IMediaAttributes>('audio'),
  b:          createElemFactory<IElementAttributes>('b'),
  bdi:        createElemFactory<IElementAttributes>('bdi'),
  bdo:        createElemFactory<IElementAttributes>('bdo'),
  blockquote: createElemFactory<IQuoteAttributes>('blockquote'),
  br:         createElemFactory<IElementAttributes>('br'),
  button:     createElemFactory<IButtonAttributes>('button'),
  canvas:     createElemFactory<ICanvasAttributes>('canvas'),
  caption:    createElemFactory<IElementAttributes>('caption'),
  cite:       createElemFactory<IElementAttributes>('cite'),
  code:       createElemFactory<IElementAttributes>('code'),
  col:        createElemFactory<ITableColAttributes>('col'),
  colgroup:   createElemFactory<ITableColAttributes>('colgroup'),
  data:       createElemFactory<IDataAttributes>('data'),
  datalist:   createElemFactory<IElementAttributes>('datalist'),
  dd:         createElemFactory<IElementAttributes>('dd'),
  del:        createElemFactory<IModAttributes>('del'),
  dfn:        createElemFactory<IElementAttributes>('dfn'),
  div:        createElemFactory<IElementAttributes>('div'),
  dl:         createElemFactory<IElementAttributes>('dl'),
  dt:         createElemFactory<IElementAttributes>('dt'),
  em:         createElemFactory<IElementAttributes>('em'),
  embed:      createElemFactory<IEmbedAttributes>('embed'),
  fieldset:   createElemFactory<IFieldSetAttributes>('fieldset'),
  figcaption: createElemFactory<IElementAttributes>('figcaption'),
  figure:     createElemFactory<IElementAttributes>('figure'),
  footer:     createElemFactory<IElementAttributes>('footer'),
  form:       createElemFactory<IFormAttributes>('form'),
  h1:         createElemFactory<IElementAttributes>('h1'),
  h2:         createElemFactory<IElementAttributes>('h2'),
  h3:         createElemFactory<IElementAttributes>('h3'),
  h4:         createElemFactory<IElementAttributes>('h4'),
  h5:         createElemFactory<IElementAttributes>('h5'),
  h6:         createElemFactory<IElementAttributes>('h6'),
  header:     createElemFactory<IElementAttributes>('header'),
  hr:         createElemFactory<IElementAttributes>('hr'),
  i:          createElemFactory<IElementAttributes>('i'),
  iframe:     createElemFactory<IIFrameAttributes>('iframe'),
  img:        createElemFactory<IImageAttributes>('img'),
  input:      createElemFactory<IInputAttributes>('input'),
  ins:        createElemFactory<IModAttributes>('ins'),
  kbd:        createElemFactory<IElementAttributes>('kbd'),
  label:      createElemFactory<ILabelAttributes>('label'),
  legend:     createElemFactory<IElementAttributes>('legend'),
  li:         createElemFactory<ILIAttributes>('li'),
  main:       createElemFactory<IElementAttributes>('main'),
  map:        createElemFactory<IMapAttributes>('map'),
  mark:       createElemFactory<IElementAttributes>('mark'),
  meter:      createElemFactory<IMeterAttributes>('meter'),
  nav:        createElemFactory<IElementAttributes>('nav'),
  noscript:   createElemFactory<IElementAttributes>('noscript'),
  object:     createElemFactory<IObjectAttributes>('object'),
  ol:         createElemFactory<IOListAttributes>('ol'),
  optgroup:   createElemFactory<IOptGroupAttributes>('optgroup'),
  option:     createElemFactory<IOptionAttributes>('option'),
  output:     createElemFactory<IOutputAttributes>('output'),
  p:          createElemFactory<IElementAttributes>('p'),
  param:      createElemFactory<IElementAttributes>('param'),
  pre:        createElemFactory<IElementAttributes>('pre'),
  progress:   createElemFactory<IProgressAttributes>('progress'),
  q:          createElemFactory<IElementAttributes>('q'),
  rp:         createElemFactory<IElementAttributes>('rp'),
  rt:         createElemFactory<IElementAttributes>('rt'),
  ruby:       createElemFactory<IElementAttributes>('ruby'),
  s:          createElemFactory<IElementAttributes>('s'),
  samp:       createElemFactory<IElementAttributes>('samp'),
  section:    createElemFactory<IElementAttributes>('section'),
  select:     createElemFactory<ISelectAttributes>('select'),
  small:      createElemFactory<IElementAttributes>('small'),
  source:     createElemFactory<ISourceAttributes>('source'),
  span:       createElemFactory<IElementAttributes>('span'),
  strong:     createElemFactory<IElementAttributes>('strong'),
  sub:        createElemFactory<IElementAttributes>('sub'),
  summary:    createElemFactory<IElementAttributes>('summary'),
  sup:        createElemFactory<IElementAttributes>('sup'),
  table:      createElemFactory<IElementAttributes>('table'),
  tbody:      createElemFactory<IElementAttributes>('tbody'),
  td:         createElemFactory<ITableDataCellAttributes>('td'),
  textarea:   createElemFactory<ITextAreaAttributes>('textarea'),
  tfoot:      createElemFactory<IElementAttributes>('tfoot'),
  th:         createElemFactory<ITableHeaderCellAttributes>('th'),
  thead:      createElemFactory<IElementAttributes>('thead'),
  time:       createElemFactory<ITimeAttributes>('time'),
  title:      createElemFactory<IElementAttributes>('title'),
  tr:         createElemFactory<IElementAttributes>('tr'),
  track:      createElemFactory<ITrackAttributes>('track'),
  u:          createElemFactory<IElementAttributes>('u'),
  ul:         createElemFactory<IElementAttributes>('ul'),
  var:        createElemFactory<IElementAttributes>('var'),
  video:      createElemFactory<IVideoAttributes>('video'),
  wbr:        createElemFactory<IElementAttributes>('wbr'),
};

} // module phosphor.virtualdom

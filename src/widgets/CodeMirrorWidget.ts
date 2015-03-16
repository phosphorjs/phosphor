/*-----------------------------------------------------------------------------
| Copyright (c) 2014, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import ICoreEvent = core.ICoreEvent;

import SizePolicy = enums.SizePolicy;

import ResizeEvent = events.ResizeEvent;

import Point = geometry.Point;
import Size = geometry.Size;


/**
 * The class name added to code mirror widget classes.
 */
var CODE_MIRROR_WIDGET_CLASS = 'p-CodeMirrorWidget';


/**
 * The default size hint for a code mirror widget.
 */
var defaultSizeHint = new Size(500, 200);


/**
 * A widget which hosts a CodeMirror editor.
 */
export
class CodeMirrorWidget extends Widget {
  /**
   * Construct a new code mirror widget.
   */
  constructor(options?: CodeMirror.EditorConfiguration) {
    super();
    this.classList.add(CODE_MIRROR_WIDGET_CLASS);
    this._m_editor = this.createEditor(options);
    this.setSizePolicy(SizePolicy.Expanding, SizePolicy.Expanding);
  }

  /**
   * Get the code mirror editor for the widget.
   *
   * This widget does not attempt to wrap the code mirror api.
   * User code should interact with the editor object directly.
   */
  get editor(): CodeMirror.Editor {
    return this._m_editor;
  }

  /**
   * Calculate the preferred size for the widget.
   */
  sizeHint(): Size {
    return defaultSizeHint;
  }

  /**
   * Create the editor for the widget.
   *
   * This can be reimplemented by subclasses which require custom
   * creation of the editor instance. The default implementation
   * assumes `CodeMirror` is available in the global scope.
   */
  protected createEditor(options?: CodeMirror.EditorConfiguration): CodeMirror.Editor {
    return CodeMirror(this.node, options);
  }

  /**
   * A method invoked on an 'after-show' event.
   */
  protected afterShowEvent(event: ICoreEvent): void {
    var pos = this._m_scrollPos;
    if (pos) this._m_editor.scrollTo(pos.x, pos.y);
  }

  /**
   * A method invoked on a 'before-hide' event.
   */
  protected beforeHideEvent(event: ICoreEvent): void {
    var info = this._m_editor.getScrollInfo();
    this._m_scrollPos = new Point(info.left, info.top);
  }

  /**
   * A method invoked on an 'after-attach' event.
   */
  protected afterAttachEvent(event: ICoreEvent): void {
    this._m_editor.refresh();
  }

  /**
   * A method invoked on a 'resize' event.
   */
  protected resizeEvent(event: ResizeEvent): void {
    if (this.isVisible) {
      this._m_editor.setSize(event.width, event.height);
    }
  }

  private _m_editor: CodeMirror.Editor;
  private _m_scrollPos: Point = null;
}

} // module phosphor.widgets

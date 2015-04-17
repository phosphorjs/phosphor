/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.lib {

import IMessage = core.IMessage;

import Point = utility.Point;
import Size = utility.Size;

import BaseComponent = virtualdom.BaseComponent;
import IData = virtualdom.IData;
import IElement = virtualdom.IElement;
import createFactory = virtualdom.createFactory;

import ResizeMessage = widgets.ResizeMessage;
import SizePolicy = widgets.SizePolicy;
import Widget = widgets.Widget;


/**
 * The class name added to CodeMirrorWidget instances.
 */
var CODE_MIRROR_WIDGET_CLASS = 'p-CodeMirrorWidget';

/**
 * THe class name assigned to CodeMirrorComponent instances.
 */
var CODE_MIRROR_COMPONENT_CLASS = 'p-CodeMirrorComponent';


/**
 * A widget which hosts a CodeMirror editor.
 */
export
class CodeMirrorWidget extends Widget {
  /**
   * Construct a new code mirror widget.
   */
  constructor(config?: CodeMirror.EditorConfiguration) {
    super();
    this.addClass(CODE_MIRROR_WIDGET_CLASS);
    this._editor = this.createEditor(config);
    this.setSizePolicy(SizePolicy.Expanding, SizePolicy.Expanding);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._editor = null;
    super.dispose();
  }

  /**
   * Get the code mirror editor for the widget.
   *
   * This widget does not attempt to wrap the code mirror api.
   * User code should interact with the editor object directly.
   */
  get editor(): CodeMirror.Editor {
    return this._editor;
  }

  /**
   * Calculate the preferred size for the widget.
   */
  sizeHint(): Size {
    return new Size(500, 200);
  }

  /**
   * Create the editor for the widget.
   *
   * This can be reimplemented by subclasses which require custom
   * creation of the editor instance. The default implementation
   * assumes `CodeMirror` is available in the global scope.
   */
  protected createEditor(config?: CodeMirror.EditorConfiguration): CodeMirror.Editor {
    return CodeMirror(this.node, config);
  }

  /**
   * A method invoked on an 'after-show' message.
   */
  protected onAfterShow(msg: IMessage): void {
    var pos = this._scrollPos;
    if (pos) this._editor.scrollTo(pos.x, pos.y);
  }

  /**
   * A method invoked on a 'before-hide' message.
   */
  protected onBeforeHide(msg: IMessage): void {
    var info = this._editor.getScrollInfo();
    this._scrollPos = new Point(info.left, info.top);
  }

  /**
   * A method invoked on an 'after-attach' message.
   */
  protected onAfterAttach(msg: IMessage): void {
    this._editor.refresh();
  }

  /**
   * A method invoked on a 'resize' message.
   */
  protected onResize(msg: ResizeMessage): void {
    if (this.isVisible) {
      this._editor.setSize(msg.width, msg.height);
    }
  }

  private _editor: CodeMirror.Editor;
  private _scrollPos: Point = null;
}


/**
 * The data object for a code mirror component.
 */
export
interface ICodeMirrorData extends IData {
  config: CodeMirror.EditorConfiguration;
}


/**
 * A component which hosts a CodeMirror editor.
 */
export
class CodeMirrorComponent extends BaseComponent<ICodeMirrorData> {
  /**
   * The default class name for a code mirror component.
   */
  static className = CODE_MIRROR_COMPONENT_CLASS;

  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._editor = null;
    super.dispose();
  }

  /**
   * Initialize the component with new data and children.
   */
  init(data: ICodeMirrorData, children: IElement[]): void {
    super.init(data, children);
    if (!this._editor) {
      this._editor = this.createEditor();
    }
  }

  /**
   * Get the code mirror editor for the component.
   *
   * This component does not attempt to wrap the extensive code mirror
   * api. User code should interact with the editor object directly.
   */
  get editor(): CodeMirror.Editor {
    return this._editor;
  }

  /**
   * Create the editor for the component.
   *
   * This can be reimplemented by subclasses which require custom
   * creation of the editor instance. The default implementation
   * assumes `CodeMirror` is available in the global scope.
   */
  protected createEditor(): CodeMirror.Editor {
    return CodeMirror(this.node, this.data.config);
  }

  private _editor: CodeMirror.Editor = null;
}


/**
 * The default virtual element factory for the CodeMirrorComponent.
 */
export
var CodeMirrorFactory = createFactory(CodeMirrorComponent);

} // module phosphor.lib

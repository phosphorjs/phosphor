/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import ICoreEvent = core.ICoreEvent;

import SizePolicy = enums.SizePolicy;

import ResizeEvent = events.ResizeEvent;

import Point = geometry.Point;
import Size = geometry.Size;

import IVirtualElement = phosphor.virtualdom.IVirtualElement;
import createFactory = phosphor.virtualdom.createFactory;


/**
 * The class name added to code mirror component classes.
 */
var CODE_MIRROR_COMPONENT_CLASS = 'p-CodeMirrorComponent';


export interface ICodeMirrorData {
  config: CodeMirror.EditorConfiguration;
}


/**
 * A component which hosts a CodeMirror editor.
 */
export
class CodeMirrorComponent extends BaseComponent<ICodeMirrorData> {

  static tagName = 'div';

  static className = CODE_MIRROR_COMPONENT_CLASS;

  init(data: ICodeMirrorData, children: IVirtualElement[]): boolean {
    super.init(data, children);
    if (!this._m_editor) {
        this._m_editor = this.createEditor(data.config);
    }
    return false;
  }

  /**
   * Get the code mirror editor for the component.
   *
   * This widget does not attempt to wrap the code mirror api.
   * User code should interact with the editor object directly.
   */
  get editor(): CodeMirror.Editor {
    return this._m_editor;
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

  private _m_editor: CodeMirror.Editor = null;
  private _m_scrollPos: Point = null;
}

export var CodeMirrorFactory = createFactory(CodeMirrorComponent);


} // module phosphor.components

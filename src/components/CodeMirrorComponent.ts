/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import IVirtualElement = virtualdom.IVirtualElement;
import createFactory = virtualdom.createFactory;


/**
 * The data object for a code mirror component.
 */
export
interface ICodeMirrorData {
  config: CodeMirror.EditorConfiguration;
}


/**
 * A component which hosts a CodeMirror editor.
 */
export
class CodeMirrorComponent extends BaseComponent<ICodeMirrorData> {
  /**
   * The tag name for the component node.
   */
  static tagName = 'div';

  /**
   * The default class name for the component node.
   */
  static className = 'p-CodeMirrorComponent';

  /**
   * Initialize the component with new data and children.
   *
   * A code mirror component does not update its content using the
   * virtual DOM, so this method always returns false.
   */
  init(data: ICodeMirrorData, children: IVirtualElement[]): boolean {
    super.init(data, children);
    if (this._m_editor === null) {
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
}


/**
 * The default virtual element factory for the CodeMirrorComponent.
 */
export
var CodeMirrorFactory = createFactory(CodeMirrorComponent);

} // module phosphor.components

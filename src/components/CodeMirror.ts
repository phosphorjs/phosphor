/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import IData = virtualdom.IData;
import IElement = virtualdom.IElement;
import createFactory = virtualdom.createFactory;


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
  static className = 'p-CodeMirrorComponent';

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
    if (this._editor === null) {
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

} // module phosphor.components

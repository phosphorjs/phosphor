/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.lib {

import IMessage = core.IMessage;

import BaseComponent = virtualdom.BaseComponent;
import Elem = virtualdom.Elem;
import IData = virtualdom.IData;
import createFactory = virtualdom.createFactory;


/**
 * The class name added to CodeMirrorComponent instances.
 */
var CODE_MIRROR_COMPONENT_CLASS = 'p-CodeMirrorComponent';


/**
 * The data object for a code mirror component.
 */
export
interface ICodeMirrorData extends IData {
  config: CodeMirror.EditorConfiguration;
}


// TODO:
// - update editor config on re-render?
// - save/restore scroll position on move?
/**
 * A component which hosts a CodeMirror editor.
 */
export
class CodeMirrorComponent extends BaseComponent<ICodeMirrorData> {
  /**
   * Construct a new code mirror component.
   */
  constructor(data: ICodeMirrorData, children: Elem[]) {
    super(data, children);
    this.node.classList.add(CODE_MIRROR_COMPONENT_CLASS);
    this._editor = CodeMirror(this.node, data.config);
  }

  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._editor = null;
    super.dispose();
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
   * A method invoked on an 'after-attach' message.
   */
  protected onAfterAttach(msg: IMessage): void {
    this._editor.refresh();
  }

  private _editor: CodeMirror.Editor;
}


/**
 * The default element factory for the CodeMirrorComponent.
 */
export
var CodeMirrorFactory = createFactory(CodeMirrorComponent);

} // module phosphor.lib

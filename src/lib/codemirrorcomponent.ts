/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.lib {

import Elem = virtualdom.Elem;
import IComponent = virtualdom.IComponent;
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


/**
 * A component which hosts a CodeMirror editor.
 */
export
class CodeMirrorComponent implements IComponent<ICodeMirrorData> {
  /**
   * Construct a new code mirror component.
   */
  constructor() {
    this._node = document.createElement('div');
    this._node.className = CODE_MIRROR_COMPONENT_CLASS;
  }

  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._node = null;
    this._editor = null;
  }

  /**
   * Get the DOM node associated with the component.
   */
  get node(): HTMLElement {
    return this._node;
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
   * Initialize the component with new data and children.
   */
  init(data: ICodeMirrorData, children: Elem[]): void {
    if (this._editor === null) {
      this._editor = CodeMirror(this._node, data.config);
    } else {
      // TODO update editor options?
    }
  }

  /**
   * A method invoked after the node is attached to the DOM.
   */
  afterAttach(): void {
    this._editor.refresh();
  }

  private _node: HTMLElement;
  private _editor: CodeMirror.Editor = null;
}


/**
 * The default element factory for the CodeMirrorComponent.
 */
export
var CodeMirrorFactory = createFactory(CodeMirrorComponent);

} // module phosphor.lib

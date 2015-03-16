/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

/**
 * The class name added to Tab instances.
 */
var TAB_CLASS = 'p-Tab';

/**
 * The class name assigned to a tab text sub element.
 */
var TEXT_CLASS = 'p-Tab-text';

/**
 * The class name assigned to a tab icon sub element.
 */
var ICON_CLASS = 'p-Tab-icon';

/**
 * The class name assigned to a tab close icon sub element.
 */
var CLOSE_ICON_CLASS = 'p-Tab-close-icon';

/**
 * The class name added to the selected tab.
 */
var SELECTED_CLASS = 'p-mod-selected';

/**
 * The class name added to a closable tab.
 */
var CLOSABLE_CLASS = 'p-mod-closable';


/**
 * A concrete implementation of ITab.
 */
export
class Tab implements ITab {
  /**
   * Construct a new tab.
   */
  constructor(text?: string) {
    this._m_node = this.createNode();
    if (text) this.text = text;
  }

  /**
   * Get the text for the tab.
   */
  get text(): string {
    return (<HTMLElement>this._m_node.children[1]).textContent;
  }

  /**
   * Set the text for the tab.
   */
  set text(text: string) {
    (<HTMLElement>this._m_node.children[1]).textContent = text;
  }

  /**
   * Get whether the tab is selected.
   */
  get selected(): boolean {
    return this._m_node.classList.contains(SELECTED_CLASS);
  }

  /**
   * Set whether the tab is selected.
   */
  set selected(selected: boolean) {
    if (selected) {
      this._m_node.classList.add(SELECTED_CLASS);
    } else {
      this._m_node.classList.remove(SELECTED_CLASS);
    }
  }

  /**
   * Get whether the tab is closable.
   */
  get closable(): boolean {
    return this._m_node.classList.contains(CLOSABLE_CLASS);
  }

  /**
   * Set whether the tab is closable.
   */
  set closable(closable: boolean) {
    if (closable) {
      this._m_node.classList.add(CLOSABLE_CLASS);
    } else {
      this._m_node.classList.remove(CLOSABLE_CLASS);
    }
  }

  /**
   * The DOM node for the tab.
   */
  get node(): HTMLElement {
    return this._m_node;
  }

  /**
   * The DOM node for the close icon, if available.
   */
  get closeIconNode(): HTMLElement {
    return <HTMLElement>this._m_node.lastChild;
  }

  /**
   * Create the DOM node for the tab.
   */
  protected createNode(): HTMLElement {
    var node = document.createElement('li');
    var icon = document.createElement('span');
    var text = document.createElement('span');
    var closeIcon = document.createElement('span');
    node.className = TAB_CLASS;
    icon.className = ICON_CLASS;
    text.className = TEXT_CLASS;
    closeIcon.className = CLOSE_ICON_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(closeIcon);
    return node;
  }

  private _m_node: HTMLElement;
}

} // module phosphor.widgets

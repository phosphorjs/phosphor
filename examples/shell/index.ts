/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Bootstrapper = phosphor.shell.Bootstrapper;

import Widget = phosphor.widgets.Widget;


/**
 *
 */
function createContent(name: string): Widget {
  var widget = new Widget();
  widget.addClass('content');
  widget.addClass(name);
  return widget;
}


/**
 *
 */
class ExampleBootstrapper extends Bootstrapper {
  /**
   *
   */
  configurePlugins(): Promise<void> {
    return this.pluginList.add([

    ]);
  }

  /**
   *
   */
  configureShell(): void {
    var shell = this.shell;
    shell.addWidget('top', createContent('red'));
    shell.addWidget('left', createContent('yellow'));
    shell.addWidget('right', createContent('green'));
    shell.addWidget('bottom', createContent('red'));
    shell.addWidget('center', createContent('blue'));
  }
}


/**
 *
 */
function main(): void {
  var bootstrapper = new ExampleBootstrapper();
  bootstrapper.run();
}


window.onload = main;

} // module examples

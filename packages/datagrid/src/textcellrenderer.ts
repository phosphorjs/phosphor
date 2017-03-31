/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 *
 */
export
class TextCellRenderer extends SimpleCellRenderer {
  /**
   *
   */
  drawContent(gc: CanvasRenderingContext2D, config: CellRenderer.IConfig): void {
    // Bail if there is no cell value.
    if (config.value === null || config.value === undefined) {
      return;
    }

    //
    gc.fillStyle = 'black';
    gc.textBaseline = 'middle';

    //
    let text = config.value.toString();
    let x = config.x + 2;
    let y = config.y + config.height / 2;

    gc.fillText(text, x, y);
  }
}


/**
 * The namespace for the `TextCellRenderer` class statics.
 */
export
namespace TextCellRenderer {
  /**
   *
   */
  export
  interface IOptions extends SimpleCellRenderer.IOptions {

  }
}

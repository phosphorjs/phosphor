/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Component = phosphor.virtualdom.Component;
import Elem = phosphor.virtualdom.Elem;
import IData = phosphor.virtualdom.IData;
import createFactory = phosphor.virtualdom.createFactory;
import dom = phosphor.virtualdom.dom;
import render = phosphor.virtualdom.render;


/**
 * An object which holds an image name and path.
 */
interface IImageItem {
  name: string;
  path: string;
}


/**
 * Example image data - all public domain.
 */
var imageItems: IImageItem[] = [
  { name: 'Mt Saint Elias',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Mt_Saint_Elias_NOAA_2102.jpg/640px-Mt_Saint_Elias_NOAA_2102.jpg' },
  { name: 'Aiguille du Dru',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Aiguille_du_Dru_3.jpg/640px-Aiguille_du_Dru_3.jpg' },
  { name: 'Moraine Lake',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Moraine_Lake_17092005.jpg/640px-Moraine_Lake_17092005.jpg' },
  { name: 'Kalamitsi Beach',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/05/20100726_Kalamitsi_Beach_Ionian_Sea_Lefkada_island_Greece.jpg/640px-20100726_Kalamitsi_Beach_Ionian_Sea_Lefkada_island_Greece.jpg' },
  { name: 'Atlantic Ocean',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Clouds_over_the_Atlantic_Ocean.jpg/640px-Clouds_over_the_Atlantic_Ocean.jpg' },
  { name: "Rub' al Khali",
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Rub_al_Khali_002.JPG/640px-Rub_al_Khali_002.JPG' },
  { name: 'Hellyer Gorge',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Hellyer_Gorge%2C_Tasmania.jpg/640px-Hellyer_Gorge%2C_Tasmania.jpg' },
  { name: 'Omega Nebula',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Omega_Nebula.jpg/591px-Omega_Nebula.jpg' },
  { name: 'Crab Nebula',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/480px-Crab_Nebula.jpg' },
  { name: 'Blue Linckia',
    path: 'http://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Blue_Linckia_Starfish.JPG/360px-Blue_Linckia_Starfish.JPG' }
];


/**
 * A data object for an image viewer component.
 */
interface IImageViewerData extends IData {
  items: IImageItem[];
}


class ImageViewerComponent extends Component<IImageViewerData> {

  protected render(): Elem[] {
    var items = this.data.items;
    var target = items[this._index];
    var path = target ? target.path : '';
    var options = items.map(it => dom.option(it.name));
    return [
      dom.select({ onchange: this._onChange }, options),
      dom.br(), dom.br(),
      dom.img({ src: path })
    ];
  }

  private _onChange = (event: Event) => {
    this._index = (<HTMLSelectElement>event.target).selectedIndex;
    this.update();
  };

  private _index = 0;
}


/**
 * A factory function for an image viewer component.
 */
var ImageViewer = createFactory(ImageViewerComponent);


function main(): void {
  render(ImageViewer({ items: imageItems }), document.getElementById('main'));
}


window.onload = main;

} // module example

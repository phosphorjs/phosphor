/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Component = phosphor.components.Component;

import Direction = phosphor.enums.Direction;
import SizePolicy = phosphor.enums.SizePolicy;

import Size = phosphor.geometry.Size;

import BoxLayout = phosphor.layout.BoxLayout;

import IData = phosphor.virtualdom.IData;
import IElement = phosphor.virtualdom.IElement;
import createFactory = phosphor.virtualdom.createFactory;
import dom = phosphor.virtualdom.dom;

import ElementHost = phosphor.widgets.ElementHost;
import Widget = phosphor.widgets.Widget;


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
 * A data object for a selector component.
 */
interface ISelectorData extends IData {
  values: string[];
  onSelected: (value: string) => void;
}


/**
 * A simple component which renders a selector control.
 */
class SelectorComponent extends Component<ISelectorData> {

  static tagName = 'select';

  static className = 'SelectorComponent';

  constructor() {
    super();
    this.node.addEventListener('change', <any>this);
  }

  dispose(): void {
    this.node.removeEventListener('change', <any>this);
    super.dispose();
  }

  render(): IElement[] {
    return this.data.values.map(value => dom.option(value));
  }

  handleEvent(event: Event): void {
    if (event.type === 'change') {
      this.data.onSelected((<HTMLSelectElement>this.node).value);
    }
  }
}


/**
 * A factory function for a selector component.
 */
var Selector = createFactory(SelectorComponent);


/**
 * A simple widget which displays an image.
 *
 * This could just as easily be rendered as part of the component,
 * but for this example it demonstrates a simple custom widget.
 */
class SimpleImageWidget extends Widget {

  constructor() {
    super();
    this.classList.add('SimpleImageWidget');
    this.node.onload = () => this.updateGeometry();
  }

  get src(): string {
    return (<HTMLImageElement>this.node).src;
  }

  set src(src: string) {
    (<HTMLImageElement>this.node).src = src;
  }

  sizeHint(): Size {
    var img = <HTMLImageElement>this.node;
    return new Size(img.naturalWidth, img.naturalHeight);
  }

  protected createNode(): HTMLElement {
    return document.createElement('img');
  }
}


/**
 * A top level widget which combines a selector and image widget.
 */
class MainWidget extends Widget {

  constructor() {
    super();
    this.classList.add('MainWidget');

    var names = imageItems.map(item => item.name);
    var selector = Selector({ values: names, onSelected: this._onSelected });

    var host = new ElementHost(selector, 200, 24);
    host.horizontalSizePolicy = SizePolicy.Expanding;
    host.verticalSizePolicy = SizePolicy.Fixed;

    var image = this._m_imageWidget = new SimpleImageWidget();
    image.horizontalSizePolicy = SizePolicy.Fixed;
    image.verticalSizePolicy = SizePolicy.Fixed;
    image.src = imageItems[0].path;

    var layout = new BoxLayout(Direction.TopToBottom);
    layout.addWidget(host);
    layout.addWidget(image);
    this.layout = layout;
  }

  private _onSelected = (value: string): void => {
    for (var i = 0; i < imageItems.length; ++i) {
      var item = imageItems[i];
      if (item.name === value) {
        this._m_imageWidget.src = item.path;
        return;
      }
    }
    this._m_imageWidget.src = item.path;
  };

  private _m_imageWidget: SimpleImageWidget;
}


function main(): void {
  var mw = new MainWidget();

  mw.attach(document.getElementById('main'));
  mw.fitToHost();

  window.onresize = () => mw.fitToHost();
}


window.onload = main;

} // module example

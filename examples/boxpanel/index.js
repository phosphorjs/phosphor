"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var boxpanel_1 = require('../../lib/ui/boxpanel');
var widget_1 = require('../../lib/ui/widget');
require('../../styles/base.css');
require('./index.css');
function main() {
    var red = new widget_1.Widget();
    red.addClass('red');
    var yellow = new widget_1.Widget();
    yellow.addClass('yellow');
    var green = new widget_1.Widget();
    green.addClass('green');
    var blue = new widget_1.Widget();
    blue.addClass('blue');
    var panel = new boxpanel_1.BoxPanel();
    panel.id = 'main';
    panel.addWidget(red);
    panel.addWidget(yellow);
    panel.addWidget(green);
    panel.addWidget(blue);
    window.onresize = function () { panel.update(); };
    widget_1.Widget.attach(panel, document.body);
}
window.onload = main;

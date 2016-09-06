/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var boxpanel_1 = __webpack_require__(1);
	var widget_1 = __webpack_require__(16);
	__webpack_require__(19);
	__webpack_require__(23);
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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var mutation_1 = __webpack_require__(2);
	var vector_1 = __webpack_require__(5);
	var messaging_1 = __webpack_require__(6);
	var properties_1 = __webpack_require__(10);
	var platform_1 = __webpack_require__(11);
	var sizing_1 = __webpack_require__(12);
	var boxengine_1 = __webpack_require__(13);
	var panel_1 = __webpack_require__(14);
	var widget_1 = __webpack_require__(16);
	/**
	 * The class name added to BoxPanel instances.
	 */
	var BOX_PANEL_CLASS = 'p-BoxPanel';
	/**
	 * The class name added to a BoxPanel child.
	 */
	var CHILD_CLASS = 'p-BoxPanel-child';
	/**
	 * The class name added to left-to-right box layout parents.
	 */
	var LEFT_TO_RIGHT_CLASS = 'p-mod-left-to-right';
	/**
	 * The class name added to right-to-left box layout parents.
	 */
	var RIGHT_TO_LEFT_CLASS = 'p-mod-right-to-left';
	/**
	 * The class name added to top-to-bottom box layout parents.
	 */
	var TOP_TO_BOTTOM_CLASS = 'p-mod-top-to-bottom';
	/**
	 * The class name added to bottom-to-top box layout parents.
	 */
	var BOTTOM_TO_TOP_CLASS = 'p-mod-bottom-to-top';
	/**
	 * A panel which arranges its widgets in a single row or column.
	 *
	 * #### Notes
	 * This class provides a convenience wrapper around a [[BoxLayout]].
	 */
	var BoxPanel = (function (_super) {
	    __extends(BoxPanel, _super);
	    /**
	     * Construct a new box panel.
	     *
	     * @param options - The options for initializing the box panel.
	     */
	    function BoxPanel(options) {
	        if (options === void 0) { options = {}; }
	        _super.call(this, { layout: Private.createLayout(options) });
	        this.addClass(BOX_PANEL_CLASS);
	    }
	    Object.defineProperty(BoxPanel.prototype, "direction", {
	        /**
	         * Get the layout direction for the box panel.
	         */
	        get: function () {
	            return this.layout.direction;
	        },
	        /**
	         * Set the layout direction for the box panel.
	         */
	        set: function (value) {
	            this.layout.direction = value;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(BoxPanel.prototype, "spacing", {
	        /**
	         * Get the inter-element spacing for the box panel.
	         */
	        get: function () {
	            return this.layout.spacing;
	        },
	        /**
	         * Set the inter-element spacing for the box panel.
	         */
	        set: function (value) {
	            this.layout.spacing = value;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * A message handler invoked on a `'child-added'` message.
	     */
	    BoxPanel.prototype.onChildAdded = function (msg) {
	        msg.child.addClass(CHILD_CLASS);
	    };
	    /**
	     * A message handler invoked on a `'child-removed'` message.
	     */
	    BoxPanel.prototype.onChildRemoved = function (msg) {
	        msg.child.removeClass(CHILD_CLASS);
	    };
	    return BoxPanel;
	}(panel_1.Panel));
	exports.BoxPanel = BoxPanel;
	/**
	 * The namespace for the `BoxPanel` class statics.
	 */
	var BoxPanel;
	(function (BoxPanel) {
	    /**
	     * Get the box panel stretch factor for the given widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @returns The box panel stretch factor for the widget.
	     */
	    function getStretch(widget) {
	        return BoxLayout.getStretch(widget);
	    }
	    BoxPanel.getStretch = getStretch;
	    /**
	     * Set the box panel stretch factor for the given widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @param value - The value for the stretch factor.
	     */
	    function setStretch(widget, value) {
	        BoxLayout.setStretch(widget, value);
	    }
	    BoxPanel.setStretch = setStretch;
	    /**
	     * Get the box panel size basis for the given widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @returns The box panel size basis for the widget.
	     */
	    function getSizeBasis(widget) {
	        return BoxLayout.getSizeBasis(widget);
	    }
	    BoxPanel.getSizeBasis = getSizeBasis;
	    /**
	     * Set the box panel size basis for the given widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @param value - The value for the size basis.
	     */
	    function setSizeBasis(widget, value) {
	        BoxLayout.setSizeBasis(widget, value);
	    }
	    BoxPanel.setSizeBasis = setSizeBasis;
	})(BoxPanel = exports.BoxPanel || (exports.BoxPanel = {}));
	/**
	 * A layout which arranges its widgets in a single row or column.
	 */
	var BoxLayout = (function (_super) {
	    __extends(BoxLayout, _super);
	    /**
	     * Construct a new box layout.
	     *
	     * @param options - The options for initializing the layout.
	     */
	    function BoxLayout(options) {
	        if (options === void 0) { options = {}; }
	        _super.call(this);
	        this._fixed = 0;
	        this._spacing = 4;
	        this._dirty = false;
	        this._box = null;
	        this._sizers = new vector_1.Vector();
	        this._direction = 'top-to-bottom';
	        if (options.direction !== void 0) {
	            this._direction = options.direction;
	        }
	        if (options.spacing !== void 0) {
	            this._spacing = Private.clampSpacing(options.spacing);
	        }
	    }
	    Object.defineProperty(BoxLayout.prototype, "direction", {
	        /**
	         * Get the layout direction for the box layout.
	         */
	        get: function () {
	            return this._direction;
	        },
	        /**
	         * Set the layout direction for the box layout.
	         */
	        set: function (value) {
	            if (this._direction === value) {
	                return;
	            }
	            this._direction = value;
	            if (!this.parent) {
	                return;
	            }
	            Private.toggleDirection(this.parent, value);
	            this.parent.fit();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(BoxLayout.prototype, "spacing", {
	        /**
	         * Get the inter-element spacing for the box layout.
	         */
	        get: function () {
	            return this._spacing;
	        },
	        /**
	         * Set the inter-element spacing for the box layout.
	         */
	        set: function (value) {
	            value = Private.clampSpacing(value);
	            if (this._spacing === value) {
	                return;
	            }
	            this._spacing = value;
	            if (!this.parent) {
	                return;
	            }
	            this.parent.fit();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Attach a widget to the parent's DOM node.
	     *
	     * @param index - The current index of the widget in the layout.
	     *
	     * @param widget - The widget to attach to the parent.
	     *
	     * #### Notes
	     * This is a reimplementation of the superclass method.
	     */
	    BoxLayout.prototype.attachWidget = function (index, widget) {
	        // Create and add a new sizer for the widget.
	        this._sizers.insert(index, new boxengine_1.BoxSizer());
	        // Prepare the layout geometry for the widget.
	        widget_1.Widget.prepareGeometry(widget);
	        // Add the widget's node to the parent.
	        this.parent.node.appendChild(widget.node);
	        // Send an `'after-attach'` message if the parent is attached.
	        if (this.parent.isAttached)
	            messaging_1.sendMessage(widget, widget_1.WidgetMessage.AfterAttach);
	        // Post a layout request for the parent widget.
	        this.parent.fit();
	    };
	    /**
	     * Move a widget in the parent's DOM node.
	     *
	     * @param fromIndex - The previous index of the widget in the layout.
	     *
	     * @param toIndex - The current index of the widget in the layout.
	     *
	     * @param widget - The widget to move in the parent.
	     *
	     * #### Notes
	     * This is a reimplementation of the superclass method.
	     */
	    BoxLayout.prototype.moveWidget = function (fromIndex, toIndex, widget) {
	        // Move the sizer for the widget.
	        mutation_1.move(this._sizers, fromIndex, toIndex);
	        // Post an update request for the parent widget.
	        this.parent.update();
	    };
	    /**
	     * Detach a widget from the parent's DOM node.
	     *
	     * @param index - The previous index of the widget in the layout.
	     *
	     * @param widget - The widget to detach from the parent.
	     *
	     * #### Notes
	     * This is a reimplementation of the superclass method.
	     */
	    BoxLayout.prototype.detachWidget = function (index, widget) {
	        // Remove the sizer for the widget.
	        this._sizers.removeAt(index);
	        // Send a `'before-detach'` message if the parent is attached.
	        if (this.parent.isAttached)
	            messaging_1.sendMessage(widget, widget_1.WidgetMessage.BeforeDetach);
	        // Remove the widget's node from the parent.
	        this.parent.node.removeChild(widget.node);
	        // Reset the layout geometry for the widget.
	        widget_1.Widget.resetGeometry(widget);
	        // Post a layout request for the parent widget.
	        this.parent.fit();
	    };
	    /**
	     * A message handler invoked on a `'layout-changed'` message.
	     *
	     * #### Notes
	     * This is called when the layout is installed on its parent.
	     */
	    BoxLayout.prototype.onLayoutChanged = function (msg) {
	        Private.toggleDirection(this.parent, this.direction);
	        _super.prototype.onLayoutChanged.call(this, msg);
	    };
	    /**
	     * A message handler invoked on an `'after-show'` message.
	     */
	    BoxLayout.prototype.onAfterShow = function (msg) {
	        _super.prototype.onAfterShow.call(this, msg);
	        this.parent.update();
	    };
	    /**
	     * A message handler invoked on an `'after-attach'` message.
	     */
	    BoxLayout.prototype.onAfterAttach = function (msg) {
	        _super.prototype.onAfterAttach.call(this, msg);
	        this.parent.fit();
	    };
	    /**
	     * A message handler invoked on a `'child-shown'` message.
	     */
	    BoxLayout.prototype.onChildShown = function (msg) {
	        if (platform_1.IS_IE) {
	            messaging_1.sendMessage(this.parent, widget_1.WidgetMessage.FitRequest);
	        }
	        else {
	            this.parent.fit();
	        }
	    };
	    /**
	     * A message handler invoked on a `'child-hidden'` message.
	     */
	    BoxLayout.prototype.onChildHidden = function (msg) {
	        if (platform_1.IS_IE) {
	            messaging_1.sendMessage(this.parent, widget_1.WidgetMessage.FitRequest);
	        }
	        else {
	            this.parent.fit();
	        }
	    };
	    /**
	     * A message handler invoked on a `'resize'` message.
	     */
	    BoxLayout.prototype.onResize = function (msg) {
	        if (this.parent.isVisible) {
	            this._update(msg.width, msg.height);
	        }
	    };
	    /**
	     * A message handler invoked on an `'update-request'` message.
	     */
	    BoxLayout.prototype.onUpdateRequest = function (msg) {
	        if (this.parent.isVisible) {
	            this._update(-1, -1);
	        }
	    };
	    /**
	     * A message handler invoked on a `'fit-request'` message.
	     */
	    BoxLayout.prototype.onFitRequest = function (msg) {
	        if (this.parent.isAttached) {
	            this._fit();
	        }
	    };
	    /**
	     * Fit the layout to the total size required by the widgets.
	     */
	    BoxLayout.prototype._fit = function () {
	        // Compute the visible item count.
	        var nVisible = 0;
	        var widgets = this.widgets;
	        for (var i = 0, n = widgets.length; i < n; ++i) {
	            if (!widgets.at(i).isHidden)
	                nVisible++;
	        }
	        // Update the fixed space for the visible items.
	        this._fixed = this._spacing * Math.max(0, nVisible - 1);
	        // Setup the initial size limits.
	        var minW = 0;
	        var minH = 0;
	        var maxW = Infinity;
	        var maxH = Infinity;
	        var horz = Private.isHorizontal(this._direction);
	        if (horz) {
	            minW = this._fixed;
	            maxW = nVisible > 0 ? minW : maxW;
	        }
	        else {
	            minH = this._fixed;
	            maxH = nVisible > 0 ? minH : maxH;
	        }
	        // Update the sizers and computed size limits.
	        for (var i = 0, n = widgets.length; i < n; ++i) {
	            var widget = widgets.at(i);
	            var sizer = this._sizers.at(i);
	            if (widget.isHidden) {
	                sizer.minSize = 0;
	                sizer.maxSize = 0;
	                continue;
	            }
	            var limits = sizing_1.sizeLimits(widget.node);
	            sizer.sizeHint = BoxLayout.getSizeBasis(widget);
	            sizer.stretch = BoxLayout.getStretch(widget);
	            if (horz) {
	                sizer.minSize = limits.minWidth;
	                sizer.maxSize = limits.maxWidth;
	                minW += limits.minWidth;
	                maxW += limits.maxWidth;
	                minH = Math.max(minH, limits.minHeight);
	                maxH = Math.min(maxH, limits.maxHeight);
	            }
	            else {
	                sizer.minSize = limits.minHeight;
	                sizer.maxSize = limits.maxHeight;
	                minH += limits.minHeight;
	                maxH += limits.maxHeight;
	                minW = Math.max(minW, limits.minWidth);
	                maxW = Math.min(maxW, limits.maxWidth);
	            }
	        }
	        // Update the box sizing and add it to the size constraints.
	        var box = this._box = sizing_1.boxSizing(this.parent.node);
	        minW += box.horizontalSum;
	        minH += box.verticalSum;
	        maxW += box.horizontalSum;
	        maxH += box.verticalSum;
	        // Update the parent's size constraints.
	        var style = this.parent.node.style;
	        style.minWidth = minW + "px";
	        style.minHeight = minH + "px";
	        style.maxWidth = maxW === Infinity ? 'none' : maxW + "px";
	        style.maxHeight = maxH === Infinity ? 'none' : maxH + "px";
	        // Set the dirty flag to ensure only a single update occurs.
	        this._dirty = true;
	        // Notify the ancestor that it should fit immediately. This may
	        // cause a resize of the parent, fulfilling the required update.
	        var ancestor = this.parent.parent;
	        if (ancestor)
	            messaging_1.sendMessage(ancestor, widget_1.WidgetMessage.FitRequest);
	        // If the dirty flag is still set, the parent was not resized.
	        // Trigger the required update on the parent widget immediately.
	        if (this._dirty)
	            messaging_1.sendMessage(this.parent, widget_1.WidgetMessage.UpdateRequest);
	    };
	    /**
	     * Update the layout position and size of the widgets.
	     *
	     * The parent offset dimensions should be `-1` if unknown.
	     */
	    BoxLayout.prototype._update = function (offsetWidth, offsetHeight) {
	        // Clear the dirty flag to indicate the update occurred.
	        this._dirty = false;
	        // Bail early if there are no widgets to layout.
	        var widgets = this.widgets;
	        if (widgets.length === 0) {
	            return;
	        }
	        // Measure the parent if the offset dimensions are unknown.
	        if (offsetWidth < 0) {
	            offsetWidth = this.parent.node.offsetWidth;
	        }
	        if (offsetHeight < 0) {
	            offsetHeight = this.parent.node.offsetHeight;
	        }
	        // Ensure the parent box sizing data is computed.
	        var box = this._box || (this._box = sizing_1.boxSizing(this.parent.node));
	        // Compute the layout area adjusted for border and padding.
	        var top = box.paddingTop;
	        var left = box.paddingLeft;
	        var width = offsetWidth - box.horizontalSum;
	        var height = offsetHeight - box.verticalSum;
	        // Distribute the layout space and adjust the start position.
	        switch (this._direction) {
	            case 'left-to-right':
	                boxengine_1.boxCalc(this._sizers, Math.max(0, width - this._fixed));
	                break;
	            case 'top-to-bottom':
	                boxengine_1.boxCalc(this._sizers, Math.max(0, height - this._fixed));
	                break;
	            case 'right-to-left':
	                boxengine_1.boxCalc(this._sizers, Math.max(0, width - this._fixed));
	                left += width;
	                break;
	            case 'bottom-to-top':
	                boxengine_1.boxCalc(this._sizers, Math.max(0, height - this._fixed));
	                top += height;
	                break;
	        }
	        // Layout the widgets using the computed box sizes.
	        for (var i = 0, n = widgets.length; i < n; ++i) {
	            var widget = widgets.at(i);
	            if (widget.isHidden) {
	                continue;
	            }
	            var size = this._sizers.at(i).size;
	            switch (this._direction) {
	                case 'left-to-right':
	                    widget_1.Widget.setGeometry(widget, left, top, size, height);
	                    left += size + this._spacing;
	                    break;
	                case 'top-to-bottom':
	                    widget_1.Widget.setGeometry(widget, left, top, width, size);
	                    top += size + this._spacing;
	                    break;
	                case 'right-to-left':
	                    widget_1.Widget.setGeometry(widget, left - size, top, size, height);
	                    left -= size + this._spacing;
	                    break;
	                case 'bottom-to-top':
	                    widget_1.Widget.setGeometry(widget, left, top - size, width, size);
	                    top -= size + this._spacing;
	                    break;
	            }
	        }
	    };
	    return BoxLayout;
	}(panel_1.PanelLayout));
	exports.BoxLayout = BoxLayout;
	/**
	 * The namespace for the `BoxLayout` class statics.
	 */
	var BoxLayout;
	(function (BoxLayout) {
	    /**
	     * Get the box layout stretch factor for the given widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @returns The box layout stretch factor for the widget.
	     */
	    function getStretch(widget) {
	        return Private.stretchProperty.get(widget);
	    }
	    BoxLayout.getStretch = getStretch;
	    /**
	     * Set the box layout stretch factor for the given widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @param value - The value for the stretch factor.
	     */
	    function setStretch(widget, value) {
	        Private.stretchProperty.set(widget, value);
	    }
	    BoxLayout.setStretch = setStretch;
	    /**
	     * Get the box layout size basis for the given widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @returns The box layout size basis for the widget.
	     */
	    function getSizeBasis(widget) {
	        return Private.sizeBasisProperty.get(widget);
	    }
	    BoxLayout.getSizeBasis = getSizeBasis;
	    /**
	     * Set the box layout size basis for the given widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @param value - The value for the size basis.
	     */
	    function setSizeBasis(widget, value) {
	        Private.sizeBasisProperty.set(widget, value);
	    }
	    BoxLayout.setSizeBasis = setSizeBasis;
	})(BoxLayout = exports.BoxLayout || (exports.BoxLayout = {}));
	/**
	 * The namespace for the private module data.
	 */
	var Private;
	(function (Private) {
	    /**
	     * The property descriptor for a widget stretch factor.
	     */
	    Private.stretchProperty = new properties_1.AttachedProperty({
	        name: 'stretch',
	        value: 0,
	        coerce: function (owner, value) { return Math.max(0, Math.floor(value)); },
	        changed: onChildPropertyChanged
	    });
	    /**
	     * The property descriptor for a widget size basis.
	     */
	    Private.sizeBasisProperty = new properties_1.AttachedProperty({
	        name: 'sizeBasis',
	        value: 0,
	        coerce: function (owner, value) { return Math.max(0, Math.floor(value)); },
	        changed: onChildPropertyChanged
	    });
	    /**
	     * Create a box layout for the given panel options.
	     */
	    function createLayout(options) {
	        return options.layout || new BoxLayout(options);
	    }
	    Private.createLayout = createLayout;
	    /**
	     * Test whether a direction has horizontal orientation.
	     */
	    function isHorizontal(dir) {
	        return dir === 'left-to-right' || dir === 'right-to-left';
	    }
	    Private.isHorizontal = isHorizontal;
	    /**
	     * Toggle the CSS direction class for the given widget.
	     */
	    function toggleDirection(widget, dir) {
	        widget.toggleClass(LEFT_TO_RIGHT_CLASS, dir === 'left-to-right');
	        widget.toggleClass(RIGHT_TO_LEFT_CLASS, dir === 'right-to-left');
	        widget.toggleClass(TOP_TO_BOTTOM_CLASS, dir === 'top-to-bottom');
	        widget.toggleClass(BOTTOM_TO_TOP_CLASS, dir === 'bottom-to-top');
	    }
	    Private.toggleDirection = toggleDirection;
	    /**
	     * Clamp a spacing value to an integer >= 0.
	     */
	    function clampSpacing(value) {
	        return Math.max(0, Math.floor(value));
	    }
	    Private.clampSpacing = clampSpacing;
	    /**
	     * The change handler for the attached child properties.
	     */
	    function onChildPropertyChanged(child) {
	        var parent = child.parent;
	        var layout = parent && parent.layout;
	        if (layout instanceof BoxLayout)
	            parent.fit();
	    }
	})(Private || (Private = {}));


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var sequence_1 = __webpack_require__(3);
	/**
	 * Move an element in a sequence from one index to another.
	 *
	 * @param object - The sequence or array-like object to mutate.
	 *
	 * @param fromIndex - The index of the element to move.
	 *
	 * @param toIndex - The target index of the element.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Undefined Behavior
	 * A `fromIndex` which is non-integral or out of range.
	 *
	 * A `toIndex` which is non-integral or out of range.
	 *
	 * #### Example
	 * ```typescript
	 * import { move } from 'phosphor/lib/algorithm/mutation';
	 *
	 * let data = [0, 1, 2, 3, 4];
	 * move(data, 1, 2);  // [0, 2, 1, 3, 4]
	 * move(data, 4, 2);  // [0, 2, 4, 1, 3]
	 * ```
	 */
	function move(object, fromIndex, toIndex) {
	    if (object.length <= 1 || fromIndex === toIndex) {
	        return;
	    }
	    var d = fromIndex < toIndex ? 1 : -1;
	    var seq = sequence_1.asMutableSequence(object);
	    var value = seq.at(fromIndex);
	    for (var i = fromIndex; i !== toIndex; i += d) {
	        seq.set(i, seq.at(i + d));
	    }
	    seq.set(toIndex, value);
	}
	exports.move = move;
	/**
	 * Reverse a sequence in-place subject to an optional range.
	 *
	 * @param object - The sequence or array-like object to mutate.
	 *
	 * @param first - The index of the first element of the range. This
	 *   should be `<=` the `last` index. The default is `0`.
	 *
	 * @param last - The index of the last element of the range. This
	 *   should be `>=` the `first` index. The default is `length - 1`.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Undefined Behavior
	 * A `first` index which is non-integral or out of range.
	 *
	 * A `last` index which is non-integral or out of range.
	 *
	 * #### Example
	 * ```typescript
	 * import { reverse } from 'phosphor/lib/algorithm/mutation';
	 *
	 * let data = [0, 1, 2, 3, 4];
	 * reverse(data, 1, 3);  // [0, 3, 2, 1, 4]
	 * reverse(data, 3);     // [0, 3, 2, 4, 1]
	 * reverse(data);        // [1, 4, 2, 3, 0]
	 * ```
	 */
	function reverse(object, first, last) {
	    var length = object.length;
	    if (length <= 1) {
	        return;
	    }
	    if (first === void 0) {
	        first = 0;
	    }
	    if (last === void 0) {
	        last = length - 1;
	    }
	    if (first >= last) {
	        return;
	    }
	    var seq = sequence_1.asMutableSequence(object);
	    while (first < last) {
	        var front = seq.at(first);
	        var back = seq.at(last);
	        seq.set(first++, back);
	        seq.set(last--, front);
	    }
	}
	exports.reverse = reverse;
	/**
	 * Rotate the elements of a sequence by a positive or negative amount.
	 *
	 * @param object - The sequence or array-like object to mutate.
	 *
	 * @param delta - The amount of rotation to apply to the elements. A
	 *   positive value will rotate the elements to the left. A negative
	 *   value will rotate the elements to the right.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Undefined Behavior
	 * A `delta` amount which is non-integral.
	 *
	 * #### Example
	 * ```typescript
	 * import { rotate } from 'phosphor/lib/algorithm/mutation';
	 *
	 * let data = [0, 1, 2, 3, 4];
	 * rotate(data, 2);   // [2, 3, 4, 0, 1]
	 * rotate(data, -2);  // [0, 1, 2, 3, 4]
	 * rotate(data, 10);  // [0, 1, 2, 3, 4]
	 * rotate(data, 9);   // [4, 0, 1, 2, 3]
	 * ```
	 */
	function rotate(object, delta) {
	    var length = object.length;
	    if (length <= 1) {
	        return;
	    }
	    if (delta > 0) {
	        delta = delta % length;
	    }
	    else if (delta < 0) {
	        delta = ((delta % length) + length) % length;
	    }
	    if (delta === 0) {
	        return;
	    }
	    var seq = sequence_1.asMutableSequence(object);
	    reverse(seq, 0, delta - 1);
	    reverse(seq, delta, length - 1);
	    reverse(seq, 0, length - 1);
	}
	exports.rotate = rotate;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var iteration_1 = __webpack_require__(4);
	/**
	 * Cast a sequence or array-like object to a sequence.
	 *
	 * @param object - The sequence or array-like object of interest.
	 *
	 * @returns A sequence for the given object.
	 *
	 * #### Notes
	 * This function allows sequence algorithms to operate on user-defined
	 * sequence types and builtin array-like objects in a uniform fashion.
	 */
	function asSequence(object) {
	    var seq;
	    if (typeof object.at === 'function') {
	        seq = object;
	    }
	    else {
	        seq = new ArraySequence(object);
	    }
	    return seq;
	}
	exports.asSequence = asSequence;
	/**
	 * Cast a mutable sequence or array-like object to a mutable sequence.
	 *
	 * @param object - The sequence or array-like object of interest.
	 *
	 * @returns A mutable sequence for the given object.
	 *
	 * #### Notes
	 * This function allows sequence algorithms to operate on user-defined
	 * sequence types and builtin array-like objects in a uniform fashion.
	 */
	function asMutableSequence(object) {
	    var seq;
	    if (typeof object.set === 'function') {
	        seq = object;
	    }
	    else {
	        seq = new MutableArraySequence(object);
	    }
	    return seq;
	}
	exports.asMutableSequence = asMutableSequence;
	/**
	 * A sequence for an array-like object.
	 *
	 * #### Notes
	 * This sequence can be used for any builtin JS array-like object.
	 */
	var ArraySequence = (function () {
	    /**
	     * Construct a new array sequence.
	     *
	     * @param source - The array-like object of interest.
	     */
	    function ArraySequence(source) {
	        this._source = source;
	    }
	    Object.defineProperty(ArraySequence.prototype, "length", {
	        /**
	         * The length of the sequence.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._source.length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A new iterator which traverses the object's values.
	     */
	    ArraySequence.prototype.iter = function () {
	        return new iteration_1.ArrayIterator(this._source, 0);
	    };
	    /**
	     * Get the value at the specified index.
	     *
	     * @param index - The positive integer index of interest.
	     *
	     * @returns The value at the specified index.
	     *
	     * #### Undefined Behavior
	     * An `index` which is non-integral or out of range.
	     */
	    ArraySequence.prototype.at = function (index) {
	        return this._source[index];
	    };
	    return ArraySequence;
	}());
	exports.ArraySequence = ArraySequence;
	/**
	 * A sequence for a mutable array-like object.
	 *
	 * #### Notes
	 * This sequence can be used for any builtin JS array-like object.
	 */
	var MutableArraySequence = (function (_super) {
	    __extends(MutableArraySequence, _super);
	    function MutableArraySequence() {
	        _super.apply(this, arguments);
	    }
	    /**
	     * Set the value at the specified index.
	     *
	     * @param index - The positive integer index of interest.
	     *
	     * @param value - The value to set at the specified index.
	     *
	     * #### Undefined Behavior
	     * An `index` which is non-integral or out of range.
	     */
	    MutableArraySequence.prototype.set = function (index, value) {
	        this._source[index] = value;
	    };
	    return MutableArraySequence;
	}(ArraySequence));
	exports.MutableArraySequence = MutableArraySequence;


/***/ },
/* 4 */
/***/ function(module, exports) {

	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	"use strict";
	/**
	 * Create an iterator for an iterable or array-like object.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @returns A new iterator for the given object.
	 *
	 * #### Notes
	 * This function allows iteration algorithms to operate on user-defined
	 * iterable types and builtin array-like objects in a uniform fashion.
	 */
	function iter(object) {
	    var it;
	    if (typeof object.iter === 'function') {
	        it = object.iter();
	    }
	    else {
	        it = new ArrayIterator(object, 0);
	    }
	    return it;
	}
	exports.iter = iter;
	/**
	 * Create an array from an iterable of values.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @returns A new array of values from the given object.
	 */
	function toArray(object) {
	    var value;
	    var result = [];
	    var it = iter(object);
	    while ((value = it.next()) !== void 0) {
	        result[result.length] = value;
	    }
	    return result;
	}
	exports.toArray = toArray;
	/**
	 * An iterator which is always empty.
	 */
	var EmptyIterator = (function () {
	    /**
	     * Construct a new empty iterator.
	     */
	    function EmptyIterator() {
	    }
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A reference to `this` iterator.
	     */
	    EmptyIterator.prototype.iter = function () {
	        return this;
	    };
	    /**
	     * Create an independent clone of the current iterator.
	     *
	     * @returns A new independent clone of the current iterator.
	     */
	    EmptyIterator.prototype.clone = function () {
	        return new EmptyIterator();
	    };
	    /**
	     * Get the next value from the iterator.
	     *
	     * @returns Always `undefined`.
	     */
	    EmptyIterator.prototype.next = function () {
	        return void 0;
	    };
	    return EmptyIterator;
	}());
	exports.EmptyIterator = EmptyIterator;
	/**
	 * The namespace for the `EmptyIterator` class statics.
	 */
	var EmptyIterator;
	(function (EmptyIterator) {
	    /**
	     * A singleton instance of an empty iterator.
	     */
	    EmptyIterator.instance = new EmptyIterator();
	})(EmptyIterator = exports.EmptyIterator || (exports.EmptyIterator = {}));
	/**
	 * An iterator for an array-like object.
	 *
	 * #### Notes
	 * This iterator can be used for any builtin JS array-like object.
	 */
	var ArrayIterator = (function () {
	    /**
	     * Construct a new array iterator.
	     *
	     * @param source - The array-like object of interest.
	     *
	     * @param start - The starting index for iteration.
	     */
	    function ArrayIterator(source, start) {
	        this._source = source;
	        this._index = start;
	    }
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A reference to `this` iterator.
	     */
	    ArrayIterator.prototype.iter = function () {
	        return this;
	    };
	    /**
	     * Create an independent clone of the current iterator.
	     *
	     * @returns A new independent clone of the current iterator.
	     *
	     * #### Notes
	     * The source array is shared among clones.
	     */
	    ArrayIterator.prototype.clone = function () {
	        return new ArrayIterator(this._source, this._index);
	    };
	    /**
	     * Get the next value from the source array.
	     *
	     * @returns The next value from the source array, or `undefined`
	     *   if the iterator is exhausted.
	     */
	    ArrayIterator.prototype.next = function () {
	        if (this._index >= this._source.length) {
	            return void 0;
	        }
	        return this._source[this._index++];
	    };
	    return ArrayIterator;
	}());
	exports.ArrayIterator = ArrayIterator;
	/**
	 * Invoke a function for each value in an iterable.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @param fn - The callback function to invoke for each value.
	 *
	 * #### Notes
	 * Iteration cannot be terminated early.
	 */
	function each(object, fn) {
	    var value;
	    var it = iter(object);
	    while ((value = it.next()) !== void 0) {
	        fn(value);
	    }
	}
	exports.each = each;
	/**
	 * Test whether all values in an iterable satisfy a predicate.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @param fn - The predicate function to invoke for each value.
	 *
	 * @returns `true` if all values pass the test, `false` otherwise.
	 *
	 * #### Notes
	 * Iteration terminates on the first `false` predicate result.
	 */
	function every(object, fn) {
	    var value;
	    var it = iter(object);
	    while ((value = it.next()) !== void 0) {
	        if (!fn(value))
	            return false;
	    }
	    return true;
	}
	exports.every = every;
	/**
	 * Test whether any value in an iterable satisfies a predicate.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @param fn - The predicate function to invoke for each value.
	 *
	 * @returns `true` if any value passes the test, `false` otherwise.
	 *
	 * #### Notes
	 * Iteration terminates on the first `true` predicate result.
	 */
	function some(object, fn) {
	    var value;
	    var it = iter(object);
	    while ((value = it.next()) !== void 0) {
	        if (fn(value))
	            return true;
	    }
	    return false;
	}
	exports.some = some;
	function reduce(object, fn, initial) {
	    // Setup the iterator and fetch the first value.
	    var it = iter(object);
	    var first = it.next();
	    // An empty iterator and no initial value is an error.
	    if (first === void 0 && initial === void 0) {
	        throw new TypeError('Reduce of empty iterable with no initial value.');
	    }
	    // If the iterator is empty, return the initial value.
	    if (first === void 0) {
	        return initial;
	    }
	    // If the iterator has a single item and no initial value, the
	    // reducer is not invoked and the first item is the return value.
	    var second = it.next();
	    if (second === void 0 && initial === void 0) {
	        return first;
	    }
	    // If iterator has a single item and an initial value is provided,
	    // the reducer is invoked and that result is the return value.
	    if (second === void 0) {
	        return fn(initial, first);
	    }
	    // Setup the initial accumulator value.
	    var accumulator;
	    if (initial === void 0) {
	        accumulator = fn(first, second);
	    }
	    else {
	        accumulator = fn(fn(initial, first), second);
	    }
	    // Iterate the rest of the values, updating the accumulator.
	    var next;
	    while ((next = it.next()) !== void 0) {
	        accumulator = fn(accumulator, next);
	    }
	    // Return the final accumulated value.
	    return accumulator;
	}
	exports.reduce = reduce;
	/**
	 * Filter an iterable for values which pass a test.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @param fn - The predicate function to invoke for each value.
	 *
	 * @returns An iterator which yields the values which pass the test.
	 */
	function filter(object, fn) {
	    return new FilterIterator(iter(object), fn);
	}
	exports.filter = filter;
	/**
	 * An iterator which yields values which pass a test.
	 */
	var FilterIterator = (function () {
	    /**
	     * Construct a new filter iterator.
	     *
	     * @param source - The iterator of values of interest.
	     *
	     * @param fn - The predicate function to invoke for each value in
	     *   the iterator. It returns whether the value passes the test.
	     */
	    function FilterIterator(source, fn) {
	        this._source = source;
	        this._fn = fn;
	    }
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A reference to `this` iterator.
	     */
	    FilterIterator.prototype.iter = function () {
	        return this;
	    };
	    /**
	     * Create an independent clone of the current iterator.
	     *
	     * @returns A new independent clone of the current iterator.
	     *
	     * #### Notes
	     * The source iterator must be cloneable.
	     *
	     * The predicate function is shared among clones.
	     */
	    FilterIterator.prototype.clone = function () {
	        return new FilterIterator(this._source.clone(), this._fn);
	    };
	    /**
	     * Get the next value which passes the test.
	     *
	     * @returns The next value from the source iterator which passes
	     *   the predicate, or `undefined` if the iterator is exhausted.
	     */
	    FilterIterator.prototype.next = function () {
	        var value;
	        var fn = this._fn;
	        var it = this._source;
	        while ((value = it.next()) !== void 0) {
	            if (fn(value))
	                return value;
	        }
	        return void 0;
	    };
	    return FilterIterator;
	}());
	exports.FilterIterator = FilterIterator;
	/**
	 * Transform the values of an iterable with a mapping function.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @param fn - The mapping function to invoke for each value.
	 *
	 * @returns An iterator which yields the transformed values.
	 */
	function map(object, fn) {
	    return new MapIterator(iter(object), fn);
	}
	exports.map = map;
	/**
	 * An iterator which transforms values using a mapping function.
	 */
	var MapIterator = (function () {
	    /**
	     * Construct a new map iterator.
	     *
	     * @param source - The iterator of values of interest.
	     *
	     * @param fn - The mapping function to invoke for each value in the
	     *   iterator. It returns the transformed value.
	     */
	    function MapIterator(source, fn) {
	        this._source = source;
	        this._fn = fn;
	    }
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A reference to `this` iterator.
	     */
	    MapIterator.prototype.iter = function () {
	        return this;
	    };
	    /**
	     * Create an independent clone of the current iterator.
	     *
	     * @returns A new independent clone of the current iterator.
	     *
	     * #### Notes
	     * The source iterator must be cloneable.
	     *
	     * The mapping function is shared among clones.
	     */
	    MapIterator.prototype.clone = function () {
	        return new MapIterator(this._source.clone(), this._fn);
	    };
	    /**
	     * Get the next mapped value from the source iterator.
	     *
	     * @returns The next value from the source iterator transformed
	     *   by the mapper, or `undefined` if the iterator is exhausted.
	     */
	    MapIterator.prototype.next = function () {
	        var value = this._source.next();
	        if (value === void 0) {
	            return void 0;
	        }
	        return this._fn.call(void 0, value);
	    };
	    return MapIterator;
	}());
	exports.MapIterator = MapIterator;
	/**
	 * Attach an incremental index to an iterable.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @param start - The initial value of the index. The default is zero.
	 *
	 * @returns An iterator which yields `[index, value]` tuples.
	 */
	function enumerate(object, start) {
	    if (start === void 0) { start = 0; }
	    return new EnumerateIterator(iter(object), start);
	}
	exports.enumerate = enumerate;
	/**
	 * An iterator which attaches an incremental index to a source.
	 */
	var EnumerateIterator = (function () {
	    /**
	     * Construct a new enumerate iterator.
	     *
	     * @param source - The iterator of values of interest.
	     *
	     * @param start - The initial value of the index.
	     */
	    function EnumerateIterator(source, start) {
	        this._source = source;
	        this._index = start;
	    }
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A reference to `this` iterator.
	     */
	    EnumerateIterator.prototype.iter = function () {
	        return this;
	    };
	    /**
	     * Create an independent clone of the enumerate iterator.
	     *
	     * @returns A new iterator starting with the current value.
	     *
	     * #### Notes
	     * The source iterator must be cloneable.
	     */
	    EnumerateIterator.prototype.clone = function () {
	        return new EnumerateIterator(this._source.clone(), this._index);
	    };
	    /**
	     * Get the next value from the enumeration.
	     *
	     * @returns The next value from the enumeration, or `undefined` if
	     *   the iterator is exhausted.
	     */
	    EnumerateIterator.prototype.next = function () {
	        var value = this._source.next();
	        if (value === void 0) {
	            return void 0;
	        }
	        return [this._index++, value];
	    };
	    return EnumerateIterator;
	}());
	exports.EnumerateIterator = EnumerateIterator;
	/**
	 * Iterate several iterables in lockstep.
	 *
	 * @param objects - The iterables or array-like objects of interest.
	 *
	 * @returns An iterator which yields successive tuples of values where
	 *   each value is taken in turn from the provided iterables. It will
	 *   be as long as the shortest provided iterable.
	 */
	function zip() {
	    var objects = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        objects[_i - 0] = arguments[_i];
	    }
	    return new ZipIterator(objects.map(iter));
	}
	exports.zip = zip;
	/**
	 * An iterator which iterates several sources in lockstep.
	 */
	var ZipIterator = (function () {
	    /**
	     * Construct a new zip iterator.
	     *
	     * @param source - The iterators of interest.
	     */
	    function ZipIterator(source) {
	        this._source = source;
	    }
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A reference to `this` iterator.
	     */
	    ZipIterator.prototype.iter = function () {
	        return this;
	    };
	    /**
	     * Create an independent clone of the zip iterator.
	     *
	     * @returns A new iterator starting with the current value.
	     *
	     * #### Notes
	     * The source iterators must be cloneable.
	     */
	    ZipIterator.prototype.clone = function () {
	        return new ZipIterator(this._source.map(function (it) { return it.clone(); }));
	    };
	    /**
	     * Get the next zipped value from the iterator.
	     *
	     * @returns The next zipped value from the iterator, or `undefined`
	     *   when the first source iterator is exhausted.
	     */
	    ZipIterator.prototype.next = function () {
	        var iters = this._source;
	        var result = new Array(iters.length);
	        for (var i = 0, n = iters.length; i < n; ++i) {
	            var value = iters[i].next();
	            if (value === void 0) {
	                return void 0;
	            }
	            result[i] = value;
	        }
	        return result;
	    };
	    return ZipIterator;
	}());
	exports.ZipIterator = ZipIterator;
	/**
	 * Iterate over an iterable using a stepped increment.
	 *
	 * @param object - The iterable or array-like object of interest.
	 *
	 * @param step - The distance to step on each iteration. A value
	 *   of less than `1` will behave the same as a value of `1`.
	 *
	 * @returns An iterator which traverses the iterable step-wise.
	 */
	function stride(object, step) {
	    return new StrideIterator(iter(object), step);
	}
	exports.stride = stride;
	/**
	 * An iterator which traverses a source iterator step-wise.
	 */
	var StrideIterator = (function () {
	    /**
	     * Construct a new stride iterator.
	     *
	     * @param source - The iterator of values of interest.
	     *
	     * @param step - The distance to step on each iteration. A value
	     *   of less than `1` will behave the same as a value of `1`.
	     */
	    function StrideIterator(source, step) {
	        this._source = source;
	        this._step = step;
	    }
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A reference to `this` iterator.
	     */
	    StrideIterator.prototype.iter = function () {
	        return this;
	    };
	    /**
	     * Create an independent clone of the stride iterator.
	     *
	     * @returns A new iterator starting with the current value.
	     *
	     * #### Notes
	     * The source iterator must be cloneable.
	     */
	    StrideIterator.prototype.clone = function () {
	        return new StrideIterator(this._source.clone(), this._step);
	    };
	    /**
	     * Get the next stepped value from the iterator.
	     *
	     * @returns The next stepped value from the iterator, or `undefined`
	     *   when the source iterator is exhausted.
	     */
	    StrideIterator.prototype.next = function () {
	        var value = this._source.next();
	        if (value === void 0) {
	            return void 0;
	        }
	        var step = this._step;
	        while (--step > 0) {
	            this._source.next();
	        }
	        return value;
	    };
	    return StrideIterator;
	}());
	exports.StrideIterator = StrideIterator;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var iteration_1 = __webpack_require__(4);
	/**
	 * A generic vector data structure.
	 */
	var Vector = (function () {
	    /**
	     * Construct a new vector.
	     *
	     * @param values - The initial values for the vector.
	     */
	    function Vector(values) {
	        var _this = this;
	        this._array = [];
	        if (values)
	            iteration_1.each(values, function (value) { _this.pushBack(value); });
	    }
	    Object.defineProperty(Vector.prototype, "isEmpty", {
	        /**
	         * Test whether the vector is empty.
	         *
	         * @returns `true` if the vector is empty, `false` otherwise.
	         *
	         * #### Notes
	         * This is a read-only property.
	         *
	         * #### Complexity
	         * Constant.
	         *
	         * #### Iterator Validity
	         * No changes.
	         */
	        get: function () {
	            return this._array.length === 0;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Vector.prototype, "length", {
	        /**
	         * Get the length of the vector.
	         *
	         * @return The number of values in the vector.
	         *
	         * #### Notes
	         * This is a read-only property.
	         *
	         * #### Complexity
	         * Constant.
	         *
	         * #### Iterator Validity
	         * No changes.
	         */
	        get: function () {
	            return this._array.length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Vector.prototype, "front", {
	        /**
	         * Get the value at the front of the vector.
	         *
	         * @returns The value at the front of the vector, or `undefined` if
	         *   the vector is empty.
	         *
	         * #### Notes
	         * This is a read-only property.
	         *
	         * #### Complexity
	         * Constant.
	         *
	         * #### Iterator Validity
	         * No changes.
	         */
	        get: function () {
	            return this._array[0];
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Vector.prototype, "back", {
	        /**
	         * Get the value at the back of the vector.
	         *
	         * @returns The value at the back of the vector, or `undefined` if
	         *   the vector is empty.
	         *
	         * #### Notes
	         * This is a read-only property.
	         *
	         * #### Complexity
	         * Constant.
	         *
	         * #### Iterator Validity
	         * No changes.
	         */
	        get: function () {
	            return this._array[this._array.length - 1];
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Create an iterator over the values in the vector.
	     *
	     * @returns A new iterator starting at the front of the vector.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * No changes.
	     */
	    Vector.prototype.iter = function () {
	        return new iteration_1.ArrayIterator(this._array, 0);
	    };
	    /**
	     * Get the value at the specified index.
	     *
	     * @param index - The positive integer index of interest.
	     *
	     * @returns The value at the specified index.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * No changes.
	     *
	     * #### Undefined Behavior
	     * An `index` which is non-integral or out of range.
	     */
	    Vector.prototype.at = function (index) {
	        return this._array[index];
	    };
	    /**
	     * Set the value at the specified index.
	     *
	     * @param index - The positive integer index of interest.
	     *
	     * @param value - The value to set at the specified index.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * No changes.
	     *
	     * #### Undefined Behavior
	     * An `index` which is non-integral or out of range.
	     */
	    Vector.prototype.set = function (index, value) {
	        this._array[index] = value;
	    };
	    /**
	     * Add a value to the back of the vector.
	     *
	     * @param value - The value to add to the back of the vector.
	     *
	     * @returns The new length of the vector.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * No changes.
	     */
	    Vector.prototype.pushBack = function (value) {
	        return this._array.push(value);
	    };
	    /**
	     * Remove and return the value at the back of the vector.
	     *
	     * @returns The value at the back of the vector, or `undefined` if
	     *   the vector is empty.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * Iterators pointing at the removed value are invalidated.
	     */
	    Vector.prototype.popBack = function () {
	        return this._array.pop();
	    };
	    /**
	     * Insert a value into the vector at a specific index.
	     *
	     * @param index - The index at which to insert the value.
	     *
	     * @param value - The value to set at the specified index.
	     *
	     * @returns The new length of the vector.
	     *
	     * #### Complexity
	     * Linear.
	     *
	     * #### Iterator Validity
	     * No changes.
	     *
	     * #### Notes
	     * The `index` will be clamped to the bounds of the vector.
	     *
	     * #### Undefined Behavior
	     * An `index` which is non-integral.
	     */
	    Vector.prototype.insert = function (index, value) {
	        var array = this._array;
	        var n = array.length;
	        index = Math.max(0, Math.min(index, n));
	        for (var i = n; i > index; --i) {
	            array[i] = array[i - 1];
	        }
	        array[index] = value;
	        return n + 1;
	    };
	    /**
	     * Remove the first occurrence of a value from the vector.
	     *
	     * @param value - The value of interest.
	     *
	     * @returns The index of the removed value, or `-1` if the value
	     *   is not contained in the vector.
	     *
	     * #### Complexity
	     * Linear.
	     *
	     * #### Iterator Validity
	     * Iterators pointing at the removed value and beyond are invalidated.
	     *
	     * #### Notes
	     * Comparison is performed using strict `===` equality.
	     */
	    Vector.prototype.remove = function (value) {
	        var index = this._array.indexOf(value);
	        if (index !== -1)
	            this.removeAt(index);
	        return index;
	    };
	    /**
	     * Remove and return the value at a specific index.
	     *
	     * @param index - The index of the value of interest.
	     *
	     * @returns The value at the specified index, or `undefined` if the
	     *   index is out of range.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * Iterators pointing at the removed value and beyond are invalidated.
	     *
	     * #### Undefined Behavior
	     * An `index` which is non-integral.
	     */
	    Vector.prototype.removeAt = function (index) {
	        var array = this._array;
	        var n = array.length;
	        if (index < 0 || index >= n) {
	            return void 0;
	        }
	        var value = array[index];
	        for (var i = index + 1; i < n; ++i) {
	            array[i - 1] = array[i];
	        }
	        array.length = n - 1;
	        return value;
	    };
	    /**
	     * Remove all values from the vector.
	     *
	     * #### Complexity
	     * Linear.
	     *
	     * #### Iterator Validity
	     * All current iterators are invalidated.
	     */
	    Vector.prototype.clear = function () {
	        this._array.length = 0;
	    };
	    /**
	     * Swap the contents of the vector with the contents of another.
	     *
	     * @param other - The other vector holding the contents to swap.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * All current iterators remain valid, but will now point to the
	     * contents of the other vector involved in the swap.
	     */
	    Vector.prototype.swap = function (other) {
	        var array = other._array;
	        other._array = this._array;
	        this._array = array;
	    };
	    return Vector;
	}());
	exports.Vector = Vector;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate) {"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var iteration_1 = __webpack_require__(4);
	var queue_1 = __webpack_require__(9);
	/**
	 * A message which can be delivered to a message handler.
	 *
	 * #### Notes
	 * This class may be subclassed to create complex message types.
	 *
	 * **See also:** [[postMessage]] and [[sendMessage]].
	 */
	var Message = (function () {
	    /**
	     * Construct a new message.
	     *
	     * @param type - The type of the message.
	     */
	    function Message(type) {
	        this._type = type;
	    }
	    Object.defineProperty(Message.prototype, "type", {
	        /**
	         * The type of the message.
	         *
	         * #### Notes
	         * This value can be used to cast the message to a derived type.
	         *
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._type;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Message.prototype, "isConflatable", {
	        /**
	         * Test whether the message is conflatable.
	         *
	         * #### Notes
	         * Message conflation is an advanced topic. Most message types will
	         * not make use of this feature.
	         *
	         * If a conflatable message is posted to the event queue when another
	         * conflatable message of the same type and handler has already been
	         * posted, the `conflate()` method of the existing message will be
	         * invoked. If that method returns `true`, the new message will not
	         * be enqueued. This allows messages to be compressed, so that only
	         * a single instance of the message type is processed per cycle, no
	         * matter how many times messages of that type are posted.
	         *
	         * Custom message types may reimplement this property. The default
	         * implementation is always `false`.
	         *
	         * This is a read-only property.
	         *
	         * **See also:** [[conflateMessage]]
	         */
	        get: function () {
	            return false;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Conflate this message with another message of the same `type`.
	     *
	     * @param other - A conflatable message of the same `type`.
	     *
	     * @returns `true` if the message was successfully conflated, or
	     *   `false` otherwise.
	     *
	     * #### Notes
	     * Message conflation is an advanced topic. Most message types will
	     * not make use of this feature.
	     *
	     * This method is called automatically by the message loop when the
	     * given message is posted to the handler paired with this message.
	     * This message will already be enqueued and conflatable, and the
	     * given message will have the same `type` and also be conflatable.
	     *
	     * This method should merge the state of the other message into this
	     * message as needed so that when this message is finally delivered
	     * to the handler, it receives the most up-to-date information.
	     *
	     * If this method returns `true`, it signals that the other message
	     * was successfully conflated and it will not be enqueued.
	     *
	     * If this method returns `false`, the other message will be enqueued
	     * for normal delivery.
	     *
	     * Custom message types may reimplement this method. The default
	     * implementation always returns `false`.
	     *
	     * **See also:** [[isConflatable]]
	     */
	    Message.prototype.conflate = function (other) {
	        return false;
	    };
	    return Message;
	}());
	exports.Message = Message;
	/**
	 * A convenience message class which conflates automatically.
	 *
	 * #### Notes
	 * Message conflation is an advanced topic. Most user code will not
	 * make use of this class.
	 *
	 * This message class is useful for creating message instances which
	 * should be conflated, but which have no state other than `type`.
	 *
	 * If conflation of stateful messages is required, a custom `Message`
	 * subclass should be created.
	 */
	var ConflatableMessage = (function (_super) {
	    __extends(ConflatableMessage, _super);
	    function ConflatableMessage() {
	        _super.apply(this, arguments);
	    }
	    Object.defineProperty(ConflatableMessage.prototype, "isConflatable", {
	        /**
	         * Test whether the message is conflatable.
	         *
	         * #### Notes
	         * This property is always `true`.
	         *
	         * This is a read-only property.
	         */
	        get: function () {
	            return true;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Conflate this message with another message of the same `type`.
	     *
	     * #### Notes
	     * This method always returns `true`.
	     */
	    ConflatableMessage.prototype.conflate = function (other) {
	        return true;
	    };
	    return ConflatableMessage;
	}(Message));
	exports.ConflatableMessage = ConflatableMessage;
	/**
	 * Send a message to a message handler to process immediately.
	 *
	 * @param handler - The handler which should process the message.
	 *
	 * @param msg - The message to deliver to the handler.
	 *
	 * #### Notes
	 * The message will first be sent through any installed message hooks
	 * for the handler. If the message passes all hooks, it will then be
	 * delivered to the `processMessage` method of the handler.
	 *
	 * The message will not be conflated with pending posted messages.
	 *
	 * Exceptions in hooks and handlers will be caught and logged.
	 */
	function sendMessage(handler, msg) {
	    MessageLoop.sendMessage(handler, msg);
	}
	exports.sendMessage = sendMessage;
	/**
	 * Post a message to the message handler to process in the future.
	 *
	 * @param handler - The handler which should process the message.
	 *
	 * @param msg - The message to post to the handler.
	 *
	 * #### Notes
	 * The message will be conflated with the pending posted messages for
	 * the handler, if possible. If the message is not conflated, it will
	 * be queued for normal delivery on the next cycle of the event loop.
	 *
	 * Exceptions in hooks and handlers will be caught and logged.
	 */
	function postMessage(handler, msg) {
	    MessageLoop.postMessage(handler, msg);
	}
	exports.postMessage = postMessage;
	/**
	 * Install a message hook for a message handler.
	 *
	 * @param handler - The message handler of interest.
	 *
	 * @param hook - The message hook to install.
	 *
	 * #### Notes
	 * A message hook is invoked before a message is delivered to the
	 * handler. If the hook returns `false`, no other hooks will be
	 * invoked and the message will not be delivered to the handler.
	 *
	 * The most recently installed message hook is executed first.
	 *
	 * If the hook is already installed, it will be moved to the front.
	 *
	 * **See also:** [[removeMessageHook]]
	 */
	function installMessageHook(handler, hook) {
	    MessageLoop.installMessageHook(handler, hook);
	}
	exports.installMessageHook = installMessageHook;
	/**
	 * Remove an installed message hook for a message handler.
	 *
	 * @param handler - The message handler of interest.
	 *
	 * @param hook - The message hook to remove.
	 *
	 * #### Notes
	 * If the hook is not installed, this is a no-op.
	 *
	 * It is safe to call this function while the hook is executing.
	 */
	function removeMessageHook(handler, hook) {
	    MessageLoop.removeMessageHook(handler, hook);
	}
	exports.removeMessageHook = removeMessageHook;
	/**
	 * Clear all message data associated with a message handler.
	 *
	 * @param handler - The message handler of interest.
	 *
	 * #### Notes
	 * This will clear all pending messages and hooks for the handler.
	 */
	function clearMessageData(handler) {
	    MessageLoop.clearMessageData(handler);
	}
	exports.clearMessageData = clearMessageData;
	/**
	 * The namespace for the global singleton message loop.
	 */
	var MessageLoop;
	(function (MessageLoop) {
	    /**
	     * Send a message to a handler for immediate processing.
	     *
	     * This will first call all message hooks for the handler. If any
	     * hook rejects the message, the message will not be delivered.
	     */
	    function sendMessage(handler, msg) {
	        // Handle the common case of no message hooks.
	        var node = hooks.get(handler);
	        if (node === void 0) {
	            invokeHandler(handler, msg);
	            return;
	        }
	        // Run the message hooks and bail early if any hook returns false.
	        // A null hook indicates the hook was removed during dispatch.
	        for (; node !== null; node = node.next) {
	            if (node.hook !== null && !invokeHook(node.hook, handler, msg)) {
	                return;
	            }
	        }
	        // All message hooks returned true, so invoke the handler.
	        invokeHandler(handler, msg);
	    }
	    MessageLoop.sendMessage = sendMessage;
	    /**
	     * Post a message to a handler for processing in the future.
	     *
	     * This will first conflate the message, if possible. If it cannot
	     * be conflated, it will be queued for delivery on the next cycle
	     * of the event loop.
	     */
	    function postMessage(handler, msg) {
	        // Handle the common case a non-conflatable message first.
	        if (!msg.isConflatable) {
	            enqueueMessage(handler, msg);
	            return;
	        }
	        // Conflate message if possible.
	        var conflated = iteration_1.some(queue, function (posted) {
	            if (posted.handler !== handler) {
	                return false;
	            }
	            if (posted.msg.type !== msg.type) {
	                return false;
	            }
	            if (!posted.msg.isConflatable) {
	                return false;
	            }
	            return posted.msg.conflate(msg);
	        });
	        // If the message was not conflated, enqueue the message.
	        if (!conflated)
	            enqueueMessage(handler, msg);
	    }
	    MessageLoop.postMessage = postMessage;
	    /**
	     * Install a message hook for a handler.
	     *
	     * This will first remove the hook if it exists, then install the
	     * hook in front of other hooks for the handler.
	     */
	    function installMessageHook(handler, hook) {
	        // Remove the message hook if it's already installed.
	        removeMessageHook(handler, hook);
	        // Install the hook at the front of the list.
	        var next = hooks.get(handler) || null;
	        hooks.set(handler, { next: next, hook: hook });
	    }
	    MessageLoop.installMessageHook = installMessageHook;
	    /**
	     * Remove a message hook for a handler, if it exists.
	     */
	    function removeMessageHook(handler, hook) {
	        // Traverse the list and find the matching hook. If found, clear
	        // the reference to the hook and remove the node from the list.
	        // The node's next reference is *not* cleared so that dispatch
	        // may continue when the hook is removed during dispatch.
	        var prev = null;
	        var node = hooks.get(handler) || null;
	        for (; node !== null; prev = node, node = node.next) {
	            if (node.hook === hook) {
	                if (prev === null && node.next === null) {
	                    hooks.delete(handler);
	                }
	                else if (prev === null) {
	                    hooks.set(handler, node.next);
	                }
	                else {
	                    prev.next = node.next;
	                }
	                node.hook = null;
	                return;
	            }
	        }
	    }
	    MessageLoop.removeMessageHook = removeMessageHook;
	    /**
	     * Clear all message data for a handler.
	     *
	     * This will remove all message hooks and clear pending messages.
	     */
	    function clearMessageData(handler) {
	        // Clear all message hooks.
	        var node = hooks.get(handler) || null;
	        for (; node !== null; node = node.next) {
	            node.hook = null;
	        }
	        // Remove the handler from the hooks map.
	        hooks.delete(handler);
	        // Clear all pending messages.
	        iteration_1.each(queue, function (posted) {
	            if (posted.handler === handler) {
	                posted.handler = null;
	            }
	        });
	    }
	    MessageLoop.clearMessageData = clearMessageData;
	    /**
	     * The queue of posted message pairs.
	     */
	    var queue = new queue_1.Queue();
	    /**
	     * A mapping of handler to list of installed message hooks.
	     */
	    var hooks = new WeakMap();
	    /**
	     * A local reference to an event loop callback.
	     */
	    var defer = (function () {
	        var ok = typeof requestAnimationFrame === 'function';
	        return ok ? requestAnimationFrame : setImmediate;
	    })();
	    /**
	     * Whether a message loop cycle is pending.
	     */
	    var cyclePending = false;
	    /**
	     * Invoke a message hook with the specified handler and message.
	     *
	     * Returns the result of the hook, or `true` if the hook throws.
	     *
	     * Exceptions in the hook will be caught and logged.
	     */
	    function invokeHook(hook, handler, msg) {
	        var result;
	        try {
	            result = hook(handler, msg);
	        }
	        catch (err) {
	            result = true;
	            console.error(err);
	        }
	        return result;
	    }
	    /**
	     * Invoke a message handler with the specified message.
	     *
	     * Exceptions in the handler will be caught and logged.
	     */
	    function invokeHandler(handler, msg) {
	        try {
	            handler.processMessage(msg);
	        }
	        catch (err) {
	            console.error(err);
	        }
	    }
	    /**
	     * Add a message to the end of the message queue.
	     *
	     * This will automatically schedule a cycle of the loop.
	     */
	    function enqueueMessage(handler, msg) {
	        queue.pushBack({ handler: handler, msg: msg });
	        scheduleMessageLoop();
	    }
	    /**
	     * Schedule a message loop cycle to process any pending messages.
	     *
	     * This is a no-op if a loop cycle is already pending.
	     */
	    function scheduleMessageLoop() {
	        if (!cyclePending) {
	            defer(runMessageLoop);
	            cyclePending = true;
	        }
	    }
	    /**
	     * Run an iteration of the message loop.
	     *
	     * This will process all pending messages in the queue. If a message
	     * is added to the queue while the message loop is running, it will
	     * be processed on the next cycle of the loop.
	     */
	    function runMessageLoop() {
	        // Clear the pending flag so the next loop can be scheduled.
	        cyclePending = false;
	        // If the queue is empty, there is nothing else to do.
	        if (queue.isEmpty) {
	            return;
	        }
	        // Add a sentinel value to the end of the queue. The queue will
	        // only be processed up to the sentinel. Messages posted during
	        // this cycle will execute on the next cycle.
	        var sentinel = { handler: null, msg: null };
	        queue.pushBack(sentinel);
	        // Enter the message loop.
	        while (!queue.isEmpty) {
	            // Remove the first posted message in the queue.
	            var posted = queue.popFront();
	            // If the value is the sentinel, exit the loop.
	            if (posted === sentinel) {
	                return;
	            }
	            // Dispatch the message if the handler has not been cleared.
	            if (posted.handler !== null) {
	                sendMessage(posted.handler, posted.msg);
	            }
	        }
	    }
	})(MessageLoop || (MessageLoop = {}));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7).setImmediate))

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(8).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

	  immediateIds[id] = true;

	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });

	  return id;
	};

	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7).setImmediate, __webpack_require__(7).clearImmediate))

/***/ },
/* 8 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var iteration_1 = __webpack_require__(4);
	/**
	 * A generic FIFO queue data structure.
	 */
	var Queue = (function () {
	    /**
	     * Construct a new queue.
	     *
	     * @param values - The initial values for the queue.
	     */
	    function Queue(values) {
	        var _this = this;
	        this._length = 0;
	        this._front = null;
	        this._back = null;
	        if (values)
	            iteration_1.each(values, function (value) { _this.pushBack(value); });
	    }
	    Object.defineProperty(Queue.prototype, "isEmpty", {
	        /**
	         * Test whether the queue is empty.
	         *
	         * @returns `true` if the queue is empty, `false` otherwise.
	         *
	         * #### Notes
	         * This is a read-only property.
	         *
	         * #### Complexity
	         * Constant.
	         *
	         * #### Iterator Validity
	         * No changes.
	         */
	        get: function () {
	            return this._length === 0;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Queue.prototype, "length", {
	        /**
	         * Get the length of the queue.
	         *
	         * @return The number of values in the queue.
	         *
	         * #### Notes
	         * This is a read-only property.
	         *
	         * #### Complexity
	         * Constant.
	         *
	         * #### Iterator Validity
	         * No changes.
	         */
	        get: function () {
	            return this._length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Queue.prototype, "front", {
	        /**
	         * Get the value at the front of the queue.
	         *
	         * @returns The value at the front of the queue, or `undefined` if
	         *   the queue is empty.
	         *
	         * #### Notes
	         * This is a read-only property.
	         *
	         * #### Complexity
	         * Constant.
	         *
	         * #### Iterator Validity
	         * No changes.
	         */
	        get: function () {
	            return this._front ? this._front.value : void 0;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Queue.prototype, "back", {
	        /**
	         * Get the value at the back of the queue.
	         *
	         * @returns The value at the back of the queue, or `undefined` if
	         *   the queue is empty.
	         *
	         * #### Notes
	         * This is a read-only property.
	         *
	         * #### Complexity
	         * Constant.
	         *
	         * #### Iterator Validity
	         * No changes.
	         */
	        get: function () {
	            return this._back ? this._back.value : void 0;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Create an iterator over the values in the queue.
	     *
	     * @returns A new iterator starting at the front of the queue.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * No changes.
	     */
	    Queue.prototype.iter = function () {
	        return new QueueIterator(this._front);
	    };
	    /**
	     * Add a value to the back of the queue.
	     *
	     * @param value - The value to add to the back of the queue.
	     *
	     * @returns The new length of the queue.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * No changes.
	     */
	    Queue.prototype.pushBack = function (value) {
	        var node = new QueueNode(value);
	        if (this._length === 0) {
	            this._front = node;
	            this._back = node;
	        }
	        else {
	            this._back.next = node;
	            this._back = node;
	        }
	        return ++this._length;
	    };
	    /**
	     * Remove and return the value at the front of the queue.
	     *
	     * @returns The value at the front of the queue, or `undefined` if
	     *   the queue is empty.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * Iterators pointing at the removed value are invalidated.
	     */
	    Queue.prototype.popFront = function () {
	        if (this._length === 0) {
	            return void 0;
	        }
	        var node = this._front;
	        if (this._length === 1) {
	            this._front = null;
	            this._back = null;
	        }
	        else {
	            this._front = node.next;
	            node.next = null;
	        }
	        this._length--;
	        return node.value;
	    };
	    /**
	     * Remove all values from the queue.
	     *
	     * #### Complexity
	     * Linear.
	     *
	     * #### Iterator Validity
	     * All current iterators are invalidated.
	     */
	    Queue.prototype.clear = function () {
	        var node = this._front;
	        while (node) {
	            var next = node.next;
	            node.next = null;
	            node = next;
	        }
	        this._length = 0;
	        this._front = null;
	        this._back = null;
	    };
	    /**
	     * Swap the contents of the queue with the contents of another.
	     *
	     * @param other - The other queue holding the contents to swap.
	     *
	     * #### Complexity
	     * Constant.
	     *
	     * #### Iterator Validity
	     * All current iterators remain valid, but will now point to the
	     * contents of the other queue involved in the swap.
	     */
	    Queue.prototype.swap = function (other) {
	        var length = other._length;
	        var front = other._front;
	        var back = other._back;
	        other._length = this._length;
	        other._front = this._front;
	        other._back = this._back;
	        this._length = length;
	        this._front = front;
	        this._back = back;
	    };
	    return Queue;
	}());
	exports.Queue = Queue;
	/**
	 * An iterator for a queue.
	 */
	var QueueIterator = (function () {
	    /**
	     * Construct a new queue iterator.
	     *
	     * @param node - The node at the front of range.
	     */
	    function QueueIterator(node) {
	        this._node = node;
	    }
	    /**
	     * Create an iterator over the object's values.
	     *
	     * @returns A reference to `this` iterator.
	     */
	    QueueIterator.prototype.iter = function () {
	        return this;
	    };
	    /**
	     * Create an independent clone of the queue iterator.
	     *
	     * @returns A new iterator starting with the current value.
	     */
	    QueueIterator.prototype.clone = function () {
	        return new QueueIterator(this._node);
	    };
	    /**
	     * Get the next value from the queue.
	     *
	     * @returns The next value from the queue, or `undefined` if the
	     *   iterator is exhausted.
	     */
	    QueueIterator.prototype.next = function () {
	        if (!this._node) {
	            return void 0;
	        }
	        var value = this._node.value;
	        this._node = this._node.next;
	        return value;
	    };
	    return QueueIterator;
	}());
	/**
	 * The node type for a queue.
	 */
	var QueueNode = (function () {
	    /**
	     * Construct a new queue node.
	     *
	     * @param value - The value for the node.
	     */
	    function QueueNode(value) {
	        /**
	         * The next node the queue.
	         */
	        this.next = null;
	        this.value = value;
	    }
	    return QueueNode;
	}());


/***/ },
/* 10 */
/***/ function(module, exports) {

	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	"use strict";
	/**
	 * A class which attaches a value to an external object.
	 *
	 * #### Notes
	 * Attached properties are used to extend the state of an object with
	 * semantic data from an unrelated class. They also encapsulate value
	 * creation, coercion, and notification.
	 *
	 * Because attached property values are stored in a hash table, which
	 * in turn is stored in a WeakMap keyed on the owner object, there is
	 * non-trivial storage overhead involved in their use. The pattern is
	 * therefore best used for the storage of rare data.
	 */
	var AttachedProperty = (function () {
	    /**
	     * Construct a new attached property.
	     *
	     * @param options - The options for initializing the property.
	     */
	    function AttachedProperty(options) {
	        this._pid = nextPID();
	        this._name = options.name;
	        this._value = options.value;
	        this._create = options.create;
	        this._coerce = options.coerce;
	        this._compare = options.compare;
	        this._changed = options.changed;
	    }
	    Object.defineProperty(AttachedProperty.prototype, "name", {
	        /**
	         * Get the human readable name for the property.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._name;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Get the current value of the property for a given owner.
	     *
	     * @param owner - The property owner of interest.
	     *
	     * @returns The current value of the property.
	     *
	     * #### Notes
	     * If the value has not yet been set, the default value will be
	     * computed and assigned as the current value of the property.
	     */
	    AttachedProperty.prototype.get = function (owner) {
	        var value;
	        var map = ensureMap(owner);
	        if (this._pid in map) {
	            value = map[this._pid];
	        }
	        else {
	            value = map[this._pid] = this._createValue(owner);
	        }
	        return value;
	    };
	    /**
	     * Set the current value of the property for a given owner.
	     *
	     * @param owner - The property owner of interest.
	     *
	     * @param value - The value for the property.
	     *
	     * #### Notes
	     * If the value has not yet been set, the default value will be
	     * computed and used as the previous value for the comparison.
	     */
	    AttachedProperty.prototype.set = function (owner, value) {
	        var oldValue;
	        var map = ensureMap(owner);
	        if (this._pid in map) {
	            oldValue = map[this._pid];
	        }
	        else {
	            oldValue = map[this._pid] = this._createValue(owner);
	        }
	        var newValue = this._coerceValue(owner, value);
	        this._maybeNotify(owner, oldValue, map[this._pid] = newValue);
	    };
	    /**
	     * Explicitly coerce the current property value for a given owner.
	     *
	     * @param owner - The property owner of interest.
	     *
	     * #### Notes
	     * If the value has not yet been set, the default value will be
	     * computed and used as the previous value for the comparison.
	     */
	    AttachedProperty.prototype.coerce = function (owner) {
	        var oldValue;
	        var map = ensureMap(owner);
	        if (this._pid in map) {
	            oldValue = map[this._pid];
	        }
	        else {
	            oldValue = map[this._pid] = this._createValue(owner);
	        }
	        var newValue = this._coerceValue(owner, oldValue);
	        this._maybeNotify(owner, oldValue, map[this._pid] = newValue);
	    };
	    /**
	     * Get or create the default value for the given owner.
	     */
	    AttachedProperty.prototype._createValue = function (owner) {
	        var create = this._create;
	        return create ? create(owner) : this._value;
	    };
	    /**
	     * Coerce the value for the given owner.
	     */
	    AttachedProperty.prototype._coerceValue = function (owner, value) {
	        var coerce = this._coerce;
	        return coerce ? coerce(owner, value) : value;
	    };
	    /**
	     * Compare the old value and new value for equality.
	     */
	    AttachedProperty.prototype._compareValue = function (oldValue, newValue) {
	        var compare = this._compare;
	        return compare ? compare(oldValue, newValue) : oldValue === newValue;
	    };
	    /**
	     * Run the change notification if the given values are different.
	     */
	    AttachedProperty.prototype._maybeNotify = function (owner, oldValue, newValue) {
	        if (!this._changed || this._compareValue(oldValue, newValue)) {
	            return;
	        }
	        this._changed.call(void 0, owner, oldValue, newValue);
	    };
	    return AttachedProperty;
	}());
	exports.AttachedProperty = AttachedProperty;
	/**
	 * Clear the stored property data for the given property owner.
	 *
	 * @param owner - The property owner of interest.
	 *
	 * #### Notes
	 * This will clear all property values for the owner, but it will
	 * **not** run the change notification for any of the properties.
	 */
	function clearPropertyData(owner) {
	    ownerData.delete(owner);
	}
	exports.clearPropertyData = clearPropertyData;
	/**
	 * A weak mapping of property owner to property map.
	 */
	var ownerData = new WeakMap();
	/**
	 * A function which computes successive unique property ids.
	 */
	var nextPID = (function () {
	    var id = 0;
	    return function () {
	        var rand = Math.random();
	        var stem = ("" + rand).slice(2);
	        return "pid-" + stem + "-" + id++;
	    };
	})();
	/**
	 * Lookup the data map for the property owner.
	 *
	 * This will create the map if one does not already exist.
	 */
	function ensureMap(owner) {
	    var map = ownerData.get(owner);
	    if (map !== void 0)
	        return map;
	    map = Object.create(null);
	    ownerData.set(owner, map);
	    return map;
	}


/***/ },
/* 11 */
/***/ function(module, exports) {

	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	"use strict";
	/**
	 * A boolean indicating whether the platform is Mac.
	 */
	exports.IS_MAC = !!navigator.platform.match(/Mac/i);
	/**
	 * A boolean indicating whether the platform is Windows.
	 */
	exports.IS_WIN = !!navigator.platform.match(/Win/i);
	/**
	 * A flag indicating whether the browser is IE.
	 */
	exports.IS_IE = /Trident/.test(navigator.userAgent);


/***/ },
/* 12 */
/***/ function(module, exports) {

	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	"use strict";
	/**
	 * Compute the box sizing for a DOM node.
	 *
	 * @param node - The DOM node for which to compute the box sizing.
	 *
	 * @returns The box sizing data for the specified DOM node.
	 *
	 * #### Example
	 * ```typescript
	 * import { boxSizing } from 'phosphor/lib/dom/sizing';
	 *
	 * let div = document.createElement('div');
	 * div.style.borderTop = 'solid 10px black';
	 * document.body.appendChild(div);
	 *
	 * let sizing = boxSizing(div);
	 * sizing.borderTop;    // 10
	 * sizing.paddingLeft;  // 0
	 * // etc...
	 * ```
	 */
	function boxSizing(node) {
	    var cstyle = window.getComputedStyle(node);
	    var bt = parseInt(cstyle.borderTopWidth, 10) || 0;
	    var bl = parseInt(cstyle.borderLeftWidth, 10) || 0;
	    var br = parseInt(cstyle.borderRightWidth, 10) || 0;
	    var bb = parseInt(cstyle.borderBottomWidth, 10) || 0;
	    var pt = parseInt(cstyle.paddingTop, 10) || 0;
	    var pl = parseInt(cstyle.paddingLeft, 10) || 0;
	    var pr = parseInt(cstyle.paddingRight, 10) || 0;
	    var pb = parseInt(cstyle.paddingBottom, 10) || 0;
	    var hs = bl + pl + pr + br;
	    var vs = bt + pt + pb + bb;
	    return {
	        borderTop: bt,
	        borderLeft: bl,
	        borderRight: br,
	        borderBottom: bb,
	        paddingTop: pt,
	        paddingLeft: pl,
	        paddingRight: pr,
	        paddingBottom: pb,
	        horizontalSum: hs,
	        verticalSum: vs
	    };
	}
	exports.boxSizing = boxSizing;
	/**
	 * Compute the size limits for a DOM node.
	 *
	 * @param node - The node for which to compute the size limits.
	 *
	 * @returns The size limit data for the specified DOM node.
	 *
	 * #### Example
	 * ```typescript
	 * import { sizeLimits } from 'phosphor/lib/dom/sizing';
	 *
	 * let div = document.createElement('div');
	 * div.style.minWidth = '90px';
	 * document.body.appendChild(div);
	 *
	 * let limits = sizeLimits(div);
	 * limits.minWidth;   // 90
	 * limits.maxHeight;  // Infinity
	 * // etc...
	 * ```
	 */
	function sizeLimits(node) {
	    var cstyle = window.getComputedStyle(node);
	    return {
	        minWidth: parseInt(cstyle.minWidth, 10) || 0,
	        minHeight: parseInt(cstyle.minHeight, 10) || 0,
	        maxWidth: parseInt(cstyle.maxWidth, 10) || Infinity,
	        maxHeight: parseInt(cstyle.maxHeight, 10) || Infinity
	    };
	}
	exports.sizeLimits = sizeLimits;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var sequence_1 = __webpack_require__(3);
	/**
	 * A sizer object for use with the [[boxCalc]] function.
	 *
	 * #### Notes
	 * A box sizer holds the geometry information for an object along a
	 * layout orientation.
	 *
	 * For best performance, this class should be treated as a raw data
	 * struct. It should not typically be subclassed.
	 */
	var BoxSizer = (function () {
	    function BoxSizer() {
	        /**
	         * The preferred size for the sizer.
	         *
	         * #### Notes
	         * The sizer will be given this initial size subject to its size
	         * bounds. The sizer will not deviate from this size unless such
	         * deviation is required to fit into the available layout space.
	         *
	         * There is no limit to this value, but it will be clamped to the
	         * bounds defined by [[minSize]] and [[maxSize]].
	         *
	         * The default value is `0`.
	         */
	        this.sizeHint = 0;
	        /**
	         * The minimum size of the sizer.
	         *
	         * #### Notes
	         * The sizer will never be sized less than this value, even if
	         * it means the sizer will overflow the available layout space.
	         *
	         * It is assumed that this value lies in the range `[0, Infinity)`
	         * and that it is `<=` to [[maxSize]]. Failure to adhere to this
	         * constraint will yield undefined results.
	         *
	         * The default value is `0`.
	         */
	        this.minSize = 0;
	        /**
	         * The maximum size of the sizer.
	         *
	         * #### Notes
	         * The sizer will never be sized greater than this value, even if
	         * it means the sizer will underflow the available layout space.
	         *
	         * It is assumed that this value lies in the range `[0, Infinity]`
	         * and that it is `>=` to [[minSize]]. Failure to adhere to this
	         * constraint will yield undefined results.
	         *
	         * The default value is `Infinity`.
	         */
	        this.maxSize = Infinity;
	        /**
	         * The stretch factor for the sizer.
	         *
	         * #### Notes
	         * This controls how much the sizer stretches relative to its sibling
	         * sizers when layout space is distributed. A stretch factor of zero
	         * is special and will cause the sizer to only be resized after all
	         * other sizers with a stretch factor greater than zero have been
	         * resized to their limits.
	         *
	         * It is assumed that this value is an integer that lies in the range
	         * `[0, Infinity)`. Failure to adhere to this constraint will yield
	         * undefined results.
	         *
	         * The default value is `1`.
	         */
	        this.stretch = 1;
	        /**
	         * The computed size of the sizer.
	         *
	         * #### Notes
	         * This value is the output of a call to [[boxCalc]]. It represents
	         * the computed size for the object along the layout orientation,
	         * and will always lie in the range `[minSize, maxSize]`.
	         *
	         * This value is output only.
	         *
	         * Changing this value will have no effect.
	         */
	        this.size = 0;
	        /**
	         * An internal storage property for the layout algorithm.
	         *
	         * #### Notes
	         * This value is used as temporary storage by the layout algorithm.
	         *
	         * Changing this value will have no effect.
	         */
	        this.done = false;
	    }
	    return BoxSizer;
	}());
	exports.BoxSizer = BoxSizer;
	/**
	 * Compute the optimal layout sizes for a sequence of box sizers.
	 *
	 * This distributes the available layout space among the box sizers
	 * according to the following algorithm:
	 *
	 * 1. Initialize the sizers's size to its size hint and compute the
	 *    sums for each of size hint, min size, and max size.
	 *
	 * 2. If the total size hint equals the available space, return.
	 *
	 * 3. If the available space is less than the total min size, set all
	 *    sizers to their min size and return.
	 *
	 * 4. If the available space is greater than the total max size, set
	 *    all sizers to their max size and return.
	 *
	 * 5. If the layout space is less than the total size hint, distribute
	 *    the negative delta as follows:
	 *
	 *    a. Shrink each sizer with a stretch factor greater than zero by
	 *       an amount proportional to the negative space and the sum of
	 *       stretch factors. If the sizer reaches its min size, remove
	 *       it and its stretch factor from the computation.
	 *
	 *    b. If after adjusting all stretch sizers there remains negative
	 *       space, distribute the space equally among the sizers with a
	 *       stretch factor of zero. If a sizer reaches its min size,
	 *       remove it from the computation.
	 *
	 * 6. If the layout space is greater than the total size hint,
	 *    distribute the positive delta as follows:
	 *
	 *    a. Expand each sizer with a stretch factor greater than zero by
	 *       an amount proportional to the postive space and the sum of
	 *       stretch factors. If the sizer reaches its max size, remove
	 *       it and its stretch factor from the computation.
	 *
	 *    b. If after adjusting all stretch sizers there remains positive
	 *       space, distribute the space equally among the sizers with a
	 *       stretch factor of zero. If a sizer reaches its max size,
	 *       remove it from the computation.
	 *
	 * 7. return
	 *
	 * @param sizers - The sizers for a particular layout line.
	 *
	 * @param space - The available layout space for the sizers.
	 *
	 * #### Notes
	 * The [[size]] of each sizer is updated with the computed size.
	 *
	 * This function can be called at any time to recompute the layout for
	 * an existing sequence of sizers. The previously computed results will
	 * have no effect on the new output. It is therefore not necessary to
	 * create new sizer objects on each resize event.
	 */
	function boxCalc(object, space) {
	    // Bail early if there is nothing to do.
	    var count = object.length;
	    if (count === 0) {
	        return;
	    }
	    // Cast the object to a sequence of sizers.
	    var sizers = sequence_1.asSequence(object);
	    // Setup the size and stretch counters.
	    var totalMin = 0;
	    var totalMax = 0;
	    var totalSize = 0;
	    var totalStretch = 0;
	    var stretchCount = 0;
	    // Setup the sizers and compute the totals.
	    for (var i = 0; i < count; ++i) {
	        var sizer = sizers.at(i);
	        var min = sizer.minSize;
	        var max = sizer.maxSize;
	        var hint = sizer.sizeHint;
	        sizer.done = false;
	        sizer.size = Math.max(min, Math.min(hint, max));
	        totalSize += sizer.size;
	        totalMin += min;
	        totalMax += max;
	        if (sizer.stretch > 0) {
	            totalStretch += sizer.stretch;
	            stretchCount++;
	        }
	    }
	    // If the space is equal to the total size, return.
	    if (space === totalSize) {
	        return;
	    }
	    // If the space is less than the total min, minimize each sizer.
	    if (space <= totalMin) {
	        for (var i = 0; i < count; ++i) {
	            var sizer = sizers.at(i);
	            sizer.size = sizer.minSize;
	        }
	        return;
	    }
	    // If the space is greater than the total max, maximize each sizer.
	    if (space >= totalMax) {
	        for (var i = 0; i < count; ++i) {
	            var sizer = sizers.at(i);
	            sizer.size = sizer.maxSize;
	        }
	        return;
	    }
	    // The loops below perform sub-pixel precision sizing. A near zero
	    // value is used for compares instead of zero to ensure that the
	    // loop terminates when the subdivided space is reasonably small.
	    var nearZero = 0.01;
	    // A counter which is decremented each time a sizer is resized to
	    // its limit. This ensures the loops terminate even if there is
	    // space remaining to distribute.
	    var notDoneCount = count;
	    // Distribute negative delta space.
	    if (space < totalSize) {
	        // Shrink each stretchable sizer by an amount proportional to its
	        // stretch factor. If a sizer reaches its min size it's marked as
	        // done. The loop progresses in phases where each sizer is given
	        // a chance to consume its fair share for the pass, regardless of
	        // whether a sizer before it reached its limit. This continues
	        // until the stretchable sizers or the free space is exhausted.
	        var freeSpace = totalSize - space;
	        while (stretchCount > 0 && freeSpace > nearZero) {
	            var distSpace = freeSpace;
	            var distStretch = totalStretch;
	            for (var i = 0; i < count; ++i) {
	                var sizer = sizers.at(i);
	                if (sizer.done || sizer.stretch === 0) {
	                    continue;
	                }
	                var amt = sizer.stretch * distSpace / distStretch;
	                if (sizer.size - amt <= sizer.minSize) {
	                    freeSpace -= sizer.size - sizer.minSize;
	                    totalStretch -= sizer.stretch;
	                    sizer.size = sizer.minSize;
	                    sizer.done = true;
	                    notDoneCount--;
	                    stretchCount--;
	                }
	                else {
	                    freeSpace -= amt;
	                    sizer.size -= amt;
	                }
	            }
	        }
	        // Distribute any remaining space evenly among the non-stretchable
	        // sizers. This progresses in phases in the same manner as above.
	        while (notDoneCount > 0 && freeSpace > nearZero) {
	            var amt = freeSpace / notDoneCount;
	            for (var i = 0; i < count; ++i) {
	                var sizer = sizers.at(i);
	                if (sizer.done) {
	                    continue;
	                }
	                if (sizer.size - amt <= sizer.minSize) {
	                    freeSpace -= sizer.size - sizer.minSize;
	                    sizer.size = sizer.minSize;
	                    sizer.done = true;
	                    notDoneCount--;
	                }
	                else {
	                    freeSpace -= amt;
	                    sizer.size -= amt;
	                }
	            }
	        }
	    }
	    else {
	        // Expand each stretchable sizer by an amount proportional to its
	        // stretch factor. If a sizer reaches its max size it's marked as
	        // done. The loop progresses in phases where each sizer is given
	        // a chance to consume its fair share for the pass, regardless of
	        // whether a sizer before it reached its limit. This continues
	        // until the stretchable sizers or the free space is exhausted.
	        var freeSpace = space - totalSize;
	        while (stretchCount > 0 && freeSpace > nearZero) {
	            var distSpace = freeSpace;
	            var distStretch = totalStretch;
	            for (var i = 0; i < count; ++i) {
	                var sizer = sizers.at(i);
	                if (sizer.done || sizer.stretch === 0) {
	                    continue;
	                }
	                var amt = sizer.stretch * distSpace / distStretch;
	                if (sizer.size + amt >= sizer.maxSize) {
	                    freeSpace -= sizer.maxSize - sizer.size;
	                    totalStretch -= sizer.stretch;
	                    sizer.size = sizer.maxSize;
	                    sizer.done = true;
	                    notDoneCount--;
	                    stretchCount--;
	                }
	                else {
	                    freeSpace -= amt;
	                    sizer.size += amt;
	                }
	            }
	        }
	        // Distribute any remaining space evenly among the non-stretchable
	        // sizers. This progresses in phases in the same manner as above.
	        while (notDoneCount > 0 && freeSpace > nearZero) {
	            var amt = freeSpace / notDoneCount;
	            for (var i = 0; i < count; ++i) {
	                var sizer = sizers.at(i);
	                if (sizer.done) {
	                    continue;
	                }
	                if (sizer.size + amt >= sizer.maxSize) {
	                    freeSpace -= sizer.maxSize - sizer.size;
	                    sizer.size = sizer.maxSize;
	                    sizer.done = true;
	                    notDoneCount--;
	                }
	                else {
	                    freeSpace -= amt;
	                    sizer.size += amt;
	                }
	            }
	        }
	    }
	}
	exports.boxCalc = boxCalc;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var mutation_1 = __webpack_require__(2);
	var searching_1 = __webpack_require__(15);
	var vector_1 = __webpack_require__(5);
	var messaging_1 = __webpack_require__(6);
	var widget_1 = __webpack_require__(16);
	/**
	 * The class name added to Panel instances.
	 */
	var PANEL_CLASS = 'p-Panel';
	/**
	 * A simple and convenient panel widget class.
	 *
	 * #### Notes
	 * This class is suitable as a base class for implementing a variety of
	 * convenience panel widgets, but can also be used directly with CSS to
	 * arrange a collection of widgets.
	 *
	 * This class provides a convenience wrapper around a [[PanelLayout]].
	 */
	var Panel = (function (_super) {
	    __extends(Panel, _super);
	    /**
	     * Construct a new panel.
	     *
	     * @param options - The options for initializing the panel.
	     */
	    function Panel(options) {
	        if (options === void 0) { options = {}; }
	        _super.call(this);
	        this.addClass(PANEL_CLASS);
	        this.layout = Private.createLayout(options);
	    }
	    Object.defineProperty(Panel.prototype, "widgets", {
	        /**
	         * A read-only sequence of the widgets in the panel.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this.layout.widgets;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Add a widget to the end of the panel.
	     *
	     * @param widget - The widget to add to the panel.
	     *
	     * #### Notes
	     * If the is already contained in the panel, it will be moved.
	     */
	    Panel.prototype.addWidget = function (widget) {
	        this.layout.addWidget(widget);
	    };
	    /**
	     * Insert a widget at the specified index.
	     *
	     * @param index - The index at which to insert the widget.
	     *
	     * @param widget - The widget to insert into to the panel.
	     *
	     * #### Notes
	     * If the widget is already contained in the panel, it will be moved.
	     */
	    Panel.prototype.insertWidget = function (index, widget) {
	        this.layout.insertWidget(index, widget);
	    };
	    return Panel;
	}(widget_1.Widget));
	exports.Panel = Panel;
	/**
	 * A concrete layout implementation suitable for many use cases.
	 *
	 * #### Notes
	 * This class is suitable as a base class for implementing a variety of
	 * layouts, but can also be used directly with standard CSS to layout a
	 * collection of widgets.
	 */
	var PanelLayout = (function (_super) {
	    __extends(PanelLayout, _super);
	    function PanelLayout() {
	        _super.apply(this, arguments);
	        this._widgets = new vector_1.Vector();
	    }
	    /**
	     * Dispose of the resources held by the layout.
	     *
	     * #### Notes
	     * This will clear and dispose all widgets in the layout.
	     *
	     * All reimplementations should call the superclass method.
	     *
	     * This method is called automatically when the parent is disposed.
	     */
	    PanelLayout.prototype.dispose = function () {
	        while (this._widgets.length > 0) {
	            this._widgets.popBack().dispose();
	        }
	        _super.prototype.dispose.call(this);
	    };
	    Object.defineProperty(PanelLayout.prototype, "widgets", {
	        /**
	         * A read-only sequence of the widgets in the layout.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._widgets;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Create an iterator over the widgets in the layout.
	     *
	     * @returns A new iterator over the widgets in the layout.
	     */
	    PanelLayout.prototype.iter = function () {
	        return this._widgets.iter();
	    };
	    /**
	     * Add a widget to the end of the layout.
	     *
	     * @param widget - The widget to add to the layout.
	     *
	     * #### Notes
	     * If the widget is already contained in the layout, it will be moved.
	     */
	    PanelLayout.prototype.addWidget = function (widget) {
	        this.insertWidget(this._widgets.length, widget);
	    };
	    /**
	     * Insert a widget into the layout at the specified index.
	     *
	     * @param index - The index at which to insert the widget.
	     *
	     * @param widget - The widget to insert into the layout.
	     *
	     * #### Notes
	     * The index will be clamped to the bounds of the widgets.
	     *
	     * If the widget is already added to the layout, it will be moved.
	     */
	    PanelLayout.prototype.insertWidget = function (index, widget) {
	        // Remove the widget from its current parent. This is a no-op
	        // if the widget's parent is already the layout parent widget.
	        widget.parent = this.parent;
	        // Look up the current index of the widget.
	        var i = searching_1.indexOf(this._widgets, widget);
	        // Clamp the insert index to the vector bounds.
	        var j = Math.max(0, Math.min(Math.floor(index), this._widgets.length));
	        // If the widget is not in the vector, insert it.
	        if (i === -1) {
	            // Insert the widget into the vector.
	            this._widgets.insert(j, widget);
	            // If the layout is parented, attach the widget to the DOM.
	            if (this.parent)
	                this.attachWidget(j, widget);
	            // There is nothing more to do.
	            return;
	        }
	        // Otherwise, the widget exists in the vector and should be moved.
	        // Adjust the index if the location is at the end of the vector.
	        if (j === this._widgets.length)
	            j--;
	        // Bail if there is no effective move.
	        if (i === j)
	            return;
	        // Move the widget to the new location.
	        mutation_1.move(this._widgets, i, j);
	        // If the layout is parented, move the widget in the DOM.
	        if (this.parent)
	            this.moveWidget(i, j, widget);
	    };
	    /**
	     * Remove a widget from the layout.
	     *
	     * @param widget - The widget to remove from the layout.
	     *
	     * @returns The index occupied by the widget, or `-1` if the widget
	     *   was not contained in the layout.
	     *
	     * #### Notes
	     * A widget is automatically removed from the layout when its `parent`
	     * is set to `null`. This method should only be invoked directly when
	     * removing a widget from a layout which has yet to be installed on a
	     * parent widget.
	     *
	     * This method does *not* modify the widget's `parent`.
	     */
	    PanelLayout.prototype.removeWidget = function (widget) {
	        var index = searching_1.indexOf(this._widgets, widget);
	        if (index !== -1)
	            this.removeWidgetAt(index);
	        return index;
	    };
	    /**
	     * Remove the widget at a given index from the layout.
	     *
	     * @param index - The index of the widget to remove.
	     *
	     * @returns The widget occupying the index, or `null` if the index
	     *   is out of range.
	     *
	     * #### Notes
	     * A widget is automatically removed from the layout when its `parent`
	     * is set to `null`. This method should only be invoked directly when
	     * removing a widget from a layout which has yet to be installed on a
	     * parent widget.
	     *
	     * This method does *not* modify the widget's `parent`.
	     */
	    PanelLayout.prototype.removeWidgetAt = function (index) {
	        // Bail if the index is out of range.
	        var i = Math.floor(index);
	        if (i < 0 || i >= this._widgets.length) {
	            return null;
	        }
	        // Remove the widget from the vector.
	        var widget = this._widgets.removeAt(i);
	        // If the layout is parented, detach the widget from the DOM.
	        if (this.parent)
	            this.detachWidget(i, widget);
	        // Return the removed widget.
	        return widget;
	    };
	    /**
	     * Attach a widget to the parent's DOM node.
	     *
	     * @param index - The current index of the widget in the layout.
	     *
	     * @param widget - The widget to attach to the parent.
	     *
	     * #### Notes
	     * This method is called automatically by the panel layout at the
	     * appropriate time. It should not be called directly by user code.
	     *
	     * The default implementation adds the widgets's node to the parent's
	     * node at the proper location, and sends an `'after-attach'` message
	     * to the widget if the parent is attached to the DOM.
	     *
	     * Subclasses may reimplement this method to control how the widget's
	     * node is added to the parent's node, but the reimplementation must
	     * send an `'after-attach'` message to the widget if the parent is
	     * attached to the DOM.
	     */
	    PanelLayout.prototype.attachWidget = function (index, widget) {
	        // Look up the next sibling reference node.
	        var ref = this.parent.node.children[index];
	        // Insert the widget's node before the sibling.
	        this.parent.node.insertBefore(widget.node, ref);
	        // Send an `'after-attach'` message if the parent is attached.
	        if (this.parent.isAttached)
	            messaging_1.sendMessage(widget, widget_1.WidgetMessage.AfterAttach);
	    };
	    /**
	     * Move a widget in the parent's DOM node.
	     *
	     * @param fromIndex - The previous index of the widget in the layout.
	     *
	     * @param toIndex - The current index of the widget in the layout.
	     *
	     * @param widget - The widget to move in the parent.
	     *
	     * #### Notes
	     * This method is called automatically by the panel layout at the
	     * appropriate time. It should not be called directly by user code.
	     *
	     * The default implementation moves the widget's node to the proper
	     * location in the parent's node and sends both a `'before-detach'`
	     * and an `'after-attach'` message to the widget if the parent is
	     * attached to the DOM.
	     *
	     * Subclasses may reimplement this method to control how the widget's
	     * node is moved in the parent's node, but the reimplementation must
	     * send both a `'before-detach'` and an `'after-attach'` message to
	     * the widget if the parent is attached to the DOM.
	     */
	    PanelLayout.prototype.moveWidget = function (fromIndex, toIndex, widget) {
	        // Send a `'before-detach'` message if the parent is attached.
	        if (this.parent.isAttached)
	            messaging_1.sendMessage(widget, widget_1.WidgetMessage.BeforeDetach);
	        // Remove the widget's node from the parent.
	        this.parent.node.removeChild(widget.node);
	        // Look up the next sibling reference node.
	        var ref = this.parent.node.children[toIndex];
	        // Insert the widget's node before the sibling.
	        this.parent.node.insertBefore(widget.node, ref);
	        // Send an `'after-attach'` message if the parent is attached.
	        if (this.parent.isAttached)
	            messaging_1.sendMessage(widget, widget_1.WidgetMessage.AfterAttach);
	    };
	    /**
	     * Detach a widget from the parent's DOM node.
	     *
	     * @param index - The previous index of the widget in the layout.
	     *
	     * @param widget - The widget to detach from the parent.
	     *
	     * #### Notes
	     * This method is called automatically by the panel layout at the
	     * appropriate time. It should not be called directly by user code.
	     *
	     * The default implementation removes the widget's node from the
	     * parent's node, and sends a `'before-detach'` message to the widget
	     * if the parent is attached to the DOM.
	     *
	     * Subclasses may reimplement this method to control how the widget's
	     * node is removed from the parent's node, but the reimplementation
	     * must send a `'before-detach'` message to the widget if the parent
	     * is attached to the DOM.
	     */
	    PanelLayout.prototype.detachWidget = function (index, widget) {
	        // Send a `'before-detach'` message if the parent is attached.
	        if (this.parent.isAttached)
	            messaging_1.sendMessage(widget, widget_1.WidgetMessage.BeforeDetach);
	        // Remove the widget's node from the parent.
	        this.parent.node.removeChild(widget.node);
	    };
	    /**
	     * A message handler invoked on a `'layout-changed'` message.
	     *
	     * #### Notes
	     * This is called when the layout is installed on its parent.
	     *
	     * The default implementation attaches all widgets to the DOM.
	     *
	     * This may be reimplemented by subclasses as needed.
	     */
	    PanelLayout.prototype.onLayoutChanged = function (msg) {
	        for (var i = 0; i < this._widgets.length; ++i) {
	            var widget = this._widgets.at(i);
	            widget.parent = this.parent;
	            this.attachWidget(i, widget);
	        }
	    };
	    /**
	     * A message handler invoked on a `'child-removed'` message.
	     *
	     * #### Notes
	     * This will remove the child widget from the layout.
	     *
	     * Subclasses should **not** typically reimplement this method.
	     */
	    PanelLayout.prototype.onChildRemoved = function (msg) {
	        this.removeWidget(msg.child);
	    };
	    return PanelLayout;
	}(widget_1.Layout));
	exports.PanelLayout = PanelLayout;
	/**
	 * The namespace for the private module data.
	 */
	var Private;
	(function (Private) {
	    /**
	     * Create a panel layout for the given panel options.
	     */
	    function createLayout(options) {
	        return options.layout || new PanelLayout();
	    }
	    Private.createLayout = createLayout;
	})(Private || (Private = {}));


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var iteration_1 = __webpack_require__(4);
	var sequence_1 = __webpack_require__(3);
	/**
	 * Find the first value in an iterable which matches a predicate.
	 *
	 * @param object - The iterable or array-like object to search.
	 *
	 * @param fn - The predicate function to apply to the values.
	 *
	 * @returns The first matching value, or `undefined` if no matching
	 *   value is found.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Example
	 * ```typescript
	 * import { find } from 'phosphor/lib/algorithm/searching';
	 *
	 * interface IAnimal { species: string, name: string };
	 *
	 * function isCat(value: IAnimal): boolean {
	 *   return value.species === 'cat';
	 * }
	 *
	 * let data: IAnimal[] = [
	 *   { species: 'dog', name: 'spot' },
	 *   { species: 'cat', name: 'fluffy' },
	 *   { species: 'alligator', name: 'pocho' },
	 * ];
	 *
	 * find(data, isCat).name;  // 'fluffy'
	 * ```
	 */
	function find(object, fn) {
	    var value;
	    var it = iteration_1.iter(object);
	    while ((value = it.next()) !== void 0) {
	        if (fn(value)) {
	            return value;
	        }
	    }
	    return void 0;
	}
	exports.find = find;
	/**
	 * Find the minimum value in an iterable.
	 *
	 * @param object - The iterable or array-like object to search.
	 *
	 * @param fn - The 3-way comparison function to apply to the values.
	 *   It should return `< 0` if the first value is less than the second.
	 *   `0` if the values are equivalent, or `> 0` if the first value is
	 *   greater than the second.
	 *
	 * @returns The minimum value in the iterable. If multiple values are
	 *   equivalent to the minimum, the left-most value is returned. If
	 *   the iterable is empty, this returns `undefined`.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Example
	 * ```typescript
	 * import { min } from 'phosphor/lib/algorithm/searching';
	 *
	 * function numberCmp(a: number, b: number): number {
	 *   return a - b;
	 * }
	 *
	 * min([7, 4, 0, 3, 9, 4], numberCmp);  // 0
	 * ```
	 */
	function min(object, fn) {
	    var it = iteration_1.iter(object);
	    var result = it.next();
	    if (result === void 0) {
	        return void 0;
	    }
	    var value;
	    while ((value = it.next()) !== void 0) {
	        if (fn(value, result) < 0) {
	            result = value;
	        }
	    }
	    return result;
	}
	exports.min = min;
	/**
	 * Find the maximum value in an iterable.
	 *
	 * @param object - The iterable or array-like object to search.
	 *
	 * @param fn - The 3-way comparison function to apply to the values.
	 *   It should return `< 0` if the first value is less than the second.
	 *   `0` if the values are equivalent, or `> 0` if the first value is
	 *   greater than the second.
	 *
	 * @returns The maximum value in the iterable. If multiple values are
	 *   equivalent to the maximum, the left-most value is returned. If
	 *   the iterable is empty, this returns `undefined`.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Example
	 * ```typescript
	 * import { max } from 'phosphor/lib/algorithm/searching';
	 *
	 * function numberCmp(a: number, b: number): number {
	 *   return a - b;
	 * }
	 *
	 * max([7, 4, 0, 3, 9, 4], numberCmp);  // 9
	 * ```
	 */
	function max(object, fn) {
	    var it = iteration_1.iter(object);
	    var result = it.next();
	    if (result === void 0) {
	        return void 0;
	    }
	    var value;
	    while ((value = it.next()) !== void 0) {
	        if (fn(value, result) > 0) {
	            result = value;
	        }
	    }
	    return result;
	}
	exports.max = max;
	/**
	 * Find the index of the first occurrence of a value in a sequence.
	 *
	 * @param object - The sequence or array-like object to search.
	 *
	 * @param value - The value to locate in the sequence. Values are
	 *   compared using strict `===` equality.
	 *
	 * @param fromIndex - The starting index of the search. The default
	 *   value is `0`.
	 *
	 * @returns The index of the first occurrence of the value, or `-1`
	 *   if the value is not found.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Undefined Behavior
	 * A `fromIndex` which is non-integral or `< 0`.
	 *
	 * #### Example
	 * ```typescript
	 * import { indexOf } from 'phosphor/lib/algorithm/searching';
	 *
	 * let data = ['one', 'two', 'three', 'four', 'one'];
	 * indexOf(data, 'red');     // -1
	 * indexOf(data, 'one');     // 0
	 * indexOf(data, 'one', 1);  // 4
	 * indexOf(data, 'two', 2);  // -1
	 * ```
	 */
	function indexOf(object, value, fromIndex) {
	    var length = object.length;
	    if (length === 0) {
	        return -1;
	    }
	    var start;
	    if (fromIndex === void 0) {
	        start = 0;
	    }
	    else {
	        start = fromIndex;
	    }
	    var seq = sequence_1.asSequence(object);
	    for (var i = start; i < length; ++i) {
	        if (seq.at(i) === value) {
	            return i;
	        }
	    }
	    return -1;
	}
	exports.indexOf = indexOf;
	/**
	 * Find the index of the last occurrence of a value in a sequence.
	 *
	 * @param object - The sequence or array-like object to search.
	 *
	 * @param value - The value to locate in the sequence. Values are
	 *   compared using strict `===` equality.
	 *
	 * @param fromIndex - The starting index of the search. The default
	 *   value is `length - 1`.
	 *
	 * @returns The index of the last occurrence of the value, or `-1`
	 *   if the value is not found.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Undefined Behavior
	 * A `fromIndex` which is non-integral or `>= length`.
	 *
	 * #### Example
	 * ```typescript
	 * import { lastIndexOf } from 'phosphor/lib/algorithm/searching';
	 *
	 * let data = ['one', 'two', 'three', 'four', 'one'];
	 * lastIndexOf(data, 'red');     // -1
	 * lastIndexOf(data, 'one');     // 4
	 * lastIndexOf(data, 'one', 1);  // 0
	 * lastIndexOf(data, 'two', 2);  // 1
	 * ```
	 */
	function lastIndexOf(object, value, fromIndex) {
	    var length = object.length;
	    if (length === 0) {
	        return -1;
	    }
	    var start;
	    if (fromIndex === void 0) {
	        start = length - 1;
	    }
	    else {
	        start = fromIndex;
	    }
	    var seq = sequence_1.asSequence(object);
	    for (var i = start; i >= 0; --i) {
	        if (seq.at(i) === value) {
	            return i;
	        }
	    }
	    return -1;
	}
	exports.lastIndexOf = lastIndexOf;
	/**
	 * Find the index of the first value which matches a predicate.
	 *
	 * @param object - The sequence or array-like object to search.
	 *
	 * @param fn - The predicate function to apply to the values.
	 *
	 * @param fromIndex - The starting index of the search. The default
	 *   value is `0`.
	 *
	 * @returns The index of the first matching value, or `-1` if no
	 *   matching value is found.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Undefined Behavior
	 * A `fromIndex` which is non-integral or `< 0`.
	 *
	 * Modifying the length of the sequence while searching.
	 *
	 * #### Example
	 * ```typescript
	 * import { findIndex } from 'phosphor/lib/algorithm/searching';
	 *
	 * function isEven(value: number): boolean {
	 *   return value % 2 === 0;
	 * }
	 *
	 * let data = [1, 2, 3, 4, 3, 2, 1];
	 * findIndex(data, isEven);     // 1
	 * findIndex(data, isEven, 4);  // 5
	 * findIndex(data, isEven, 6);  // -1
	 * ```
	 */
	function findIndex(object, fn, fromIndex) {
	    var length = object.length;
	    if (length === 0) {
	        return -1;
	    }
	    var start;
	    if (fromIndex === void 0) {
	        start = 0;
	    }
	    else {
	        start = fromIndex;
	    }
	    var seq = sequence_1.asSequence(object);
	    for (var i = start; i < length; ++i) {
	        if (fn(seq.at(i), i)) {
	            return i;
	        }
	    }
	    return -1;
	}
	exports.findIndex = findIndex;
	/**
	 * Find the index of the last value which matches a predicate.
	 *
	 * @param object - The sequence or array-like object to search.
	 *
	 * @param fn - The predicate function to apply to the values.
	 *
	 * @param fromIndex - The starting index of the search. The default
	 *   value is `length - 1`.
	 *
	 * @returns The index of the last matching value, or `-1` if no
	 *   matching value is found.
	 *
	 * #### Complexity
	 * Linear.
	 *
	 * #### Undefined Behavior
	 * A `fromIndex` which is non-integral or `>= length`.
	 *
	 * Modifying the length of the sequence while searching.
	 *
	 * #### Example
	 * ```typescript
	 * import { findLastIndex } from 'phosphor/lib/algorithm/searching';
	 *
	 * function isEven(value: number): boolean {
	 *   return value % 2 === 0;
	 * }
	 *
	 * let data = [1, 2, 3, 4, 3, 2, 1];
	 * findLastIndex(data, isEven);     // 5
	 * findLastIndex(data, isEven, 4);  // 3
	 * findLastIndex(data, isEven, 0);  // -1
	 * ```
	 */
	function findLastIndex(object, fn, fromIndex) {
	    var length = object.length;
	    if (length === 0) {
	        return -1;
	    }
	    var start;
	    if (fromIndex === void 0) {
	        start = length - 1;
	    }
	    else {
	        start = fromIndex;
	    }
	    var seq = sequence_1.asSequence(object);
	    for (var i = start; i >= 0; --i) {
	        if (fn(seq.at(i), i)) {
	            return i;
	        }
	    }
	    return -1;
	}
	exports.findLastIndex = findLastIndex;
	/**
	 * Find the index of the first element which compares `>=` to a value.
	 *
	 * @param sequence - The sequence or array-like object to search.
	 *   It must be sorted in ascending order.
	 *
	 * @param value - The value to locate in the sequence.
	 *
	 * @param fn - The 3-way comparison function to apply to the values.
	 *   It should return `< 0` if an element is less than a value, `0` if
	 *   an element is equal to a value, or `> 0` if an element is greater
	 *   than a value.
	 *
	 * @returns The index of the first element which compares `>=` to the
	 *   value, or `length` if there is no such element.
	 *
	 * #### Complexity
	 * Logarithmic.
	 *
	 * #### Undefined Behavior
	 * A sequence which is not sorted in ascending order.
	 *
	 * Modifying the length of the sequence while searching.
	 *
	 * #### Example
	 * ```typescript
	 * import { lowerBound } from 'phosphor/lib/algorithm/searching';
	 *
	 * function numberCmp(a: number, b: number): number {
	 *   return a - b;
	 * }
	 *
	 * let data = [0, 3, 4, 7, 7, 9];
	 * lowerBound(data, 0, numberCmp);   // 0
	 * lowerBound(data, 6, numberCmp);   // 3
	 * lowerBound(data, 7, numberCmp);   // 3
	 * lowerBound(data, -1, numberCmp);  // 0
	 * lowerBound(data, 10, numberCmp);  // 6
	 * ```
	 */
	function lowerBound(object, value, fn) {
	    var n = object.length;
	    if (n === 0) {
	        return 0;
	    }
	    var begin = 0;
	    var half;
	    var middle;
	    var seq = sequence_1.asSequence(object);
	    while (n > 0) {
	        half = n / 2 | 0;
	        middle = begin + half;
	        if (fn(seq.at(middle), value) < 0) {
	            begin = middle + 1;
	            n -= half + 1;
	        }
	        else {
	            n = half;
	        }
	    }
	    return begin;
	}
	exports.lowerBound = lowerBound;
	/**
	 * Find the index of the first element which compares `>` than a value.
	 *
	 * @param sequence - The sequence or array-like object to search.
	 *   It must be sorted in ascending order.
	 *
	 * @param value - The value to locate in the sequence.
	 *
	 * @param fn - The 3-way comparison function to apply to the values.
	 *   It should return `< 0` if an element is less than a value, `0` if
	 *   an element is equal to a value, or `> 0` if an element is greater
	 *   than a value.
	 *
	 * @returns The index of the first element which compares `>` than the
	 *   value, or `length` if there is no such element.
	 *
	 * #### Complexity
	 * Logarithmic.
	 *
	 * #### Undefined Behavior
	 * A sequence which is not sorted in ascending order.
	 *
	 * Modifying the length of the sequence while searching.
	 *
	 * #### Example
	 * ```typescript
	 * import { upperBound } from 'phosphor/lib/algorithm/searching';
	 *
	 * function numberCmp(a: number, b: number): number {
	 *   return a - b;
	 * }
	 *
	 * let data = [0, 3, 4, 7, 7, 9];
	 * upperBound(data, 0, numberCmp);   // 1
	 * upperBound(data, 6, numberCmp);   // 3
	 * upperBound(data, 7, numberCmp);   // 5
	 * upperBound(data, -1, numberCmp);  // 0
	 * upperBound(data, 10, numberCmp);  // 6
	 * ```
	 */
	function upperBound(object, value, fn) {
	    var n = object.length;
	    if (n === 0) {
	        return 0;
	    }
	    var begin = 0;
	    var half;
	    var middle;
	    var seq = sequence_1.asSequence(object);
	    while (n > 0) {
	        half = n / 2 | 0;
	        middle = begin + half;
	        if (fn(seq.at(middle), value) > 0) {
	            n = half;
	        }
	        else {
	            begin = middle + 1;
	            n -= half + 1;
	        }
	    }
	    return begin;
	}
	exports.upperBound = upperBound;
	/**
	 * A namespace which holds string searching functionality.
	 */
	var StringSearch;
	(function (StringSearch) {
	    /**
	     * Compute the sum-of-squares match for the given search text.
	     *
	     * @param sourceText - The text which should be searched.
	     *
	     * @param queryText - The query text to locate in the source text.
	     *
	     * @returns The match result object, or `null` if there is no match.
	     *
	     * #### Complexity
	     * Linear on `sourceText`.
	     *
	     * #### Notes
	     * This scoring algorithm uses a sum-of-squares approach to determine
	     * the score. In order for there to be a match, all of the characters
	     * in `queryText` **must** appear in `sourceText` in order. The index
	     * of each matching character is squared and added to the score. This
	     * means that early and consecutive character matches are preferred.
	     *
	     * The character match is performed with strict equality. It is case
	     * sensitive and does not ignore whitespace. If those behaviors are
	     * required, the text should be transformed before scoring.
	     */
	    function sumOfSquares(sourceText, queryText) {
	        var score = 0;
	        var indices = new Array(queryText.length);
	        for (var i = 0, j = 0, n = queryText.length; i < n; ++i, ++j) {
	            j = sourceText.indexOf(queryText[i], j);
	            if (j === -1) {
	                return null;
	            }
	            indices[i] = j;
	            score += j * j;
	        }
	        return { score: score, indices: indices };
	    }
	    StringSearch.sumOfSquares = sumOfSquares;
	    /**
	     * Highlight the matched characters of a source string.
	     *
	     * @param source - The text which should be highlighted.
	     *
	     * @param indices - The indices of the matched characters. They must
	     *   appear in increasing order and must be in bounds of the source.
	     *
	     * @returns A string with interpolated `<mark>` tags.
	     */
	    function highlight(sourceText, indices) {
	        var k = 0;
	        var last = 0;
	        var result = '';
	        var n = indices.length;
	        while (k < n) {
	            var i = indices[k];
	            var j = indices[k];
	            while (++k < n && indices[k] === j + 1) {
	                j++;
	            }
	            var head = sourceText.slice(last, i);
	            var chunk = sourceText.slice(i, j + 1);
	            result += head + "<mark>" + chunk + "</mark>";
	            last = j + 1;
	        }
	        return result + sourceText.slice(last);
	    }
	    StringSearch.highlight = highlight;
	})(StringSearch = exports.StringSearch || (exports.StringSearch = {}));


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var iteration_1 = __webpack_require__(4);
	var messaging_1 = __webpack_require__(6);
	var properties_1 = __webpack_require__(10);
	var signaling_1 = __webpack_require__(17);
	var title_1 = __webpack_require__(18);
	/**
	 * The class name added to Widget instances.
	 */
	var WIDGET_CLASS = 'p-Widget';
	/**
	 * The class name added to hidden widgets.
	 */
	var HIDDEN_CLASS = 'p-mod-hidden';
	/**
	 * The base class of the Phosphor widget hierarchy.
	 *
	 * #### Notes
	 * This class will typically be subclassed in order to create a useful
	 * widget. However, it can be used directly to host externally created
	 * content.
	 */
	var Widget = (function () {
	    /**
	     * Construct a new widget.
	     *
	     * @param options - The options for initializing the widget.
	     */
	    function Widget(options) {
	        if (options === void 0) { options = {}; }
	        this._flags = 0;
	        this._layout = null;
	        this._parent = null;
	        this._node = Private.createNode(options);
	        this.addClass(WIDGET_CLASS);
	    }
	    /**
	     * Dispose of the widget and its descendant widgets.
	     *
	     * #### Notes
	     * It is unsafe to use the widget after it has been disposed.
	     *
	     * All calls made to this method after the first are a no-op.
	     */
	    Widget.prototype.dispose = function () {
	        // Do nothing if the widget is already disposed.
	        if (this.isDisposed) {
	            return;
	        }
	        // Set the disposed flag and emit the disposed signal.
	        this.setFlag(WidgetFlag.IsDisposed);
	        this.disposed.emit(void 0);
	        // Remove or detach the widget if necessary.
	        if (this.parent) {
	            this.parent = null;
	        }
	        else if (this.isAttached) {
	            Widget.detach(this);
	        }
	        // Dispose of the widget layout.
	        if (this._layout) {
	            this._layout.dispose();
	            this._layout = null;
	        }
	        // Clear the attached data associated with the widget.
	        signaling_1.clearSignalData(this);
	        messaging_1.clearMessageData(this);
	        properties_1.clearPropertyData(this);
	        // Clear the reference to the DOM node.
	        this._node = null;
	    };
	    Object.defineProperty(Widget.prototype, "isDisposed", {
	        /**
	         * Test whether the widget has been disposed.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this.testFlag(WidgetFlag.IsDisposed);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Widget.prototype, "isAttached", {
	        /**
	         * Test whether the widget's node is attached to the DOM.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this.testFlag(WidgetFlag.IsAttached);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Widget.prototype, "isHidden", {
	        /**
	         * Test whether the widget is explicitly hidden.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this.testFlag(WidgetFlag.IsHidden);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Widget.prototype, "isVisible", {
	        /**
	         * Test whether the widget is visible.
	         *
	         * #### Notes
	         * A widget is visible when it is attached to the DOM, is not
	         * explicitly hidden, and has no explicitly hidden ancestors.
	         *
	         * This is a read-only property.
	         */
	        get: function () {
	            return this.testFlag(WidgetFlag.IsVisible);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Widget.prototype, "node", {
	        /**
	         * Get the DOM node owned by the widget.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._node;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Widget.prototype, "id", {
	        /**
	         * Get the id of the widget's DOM node.
	         */
	        get: function () {
	            return this._node.id;
	        },
	        /**
	         * Set the id of the widget's DOM node.
	         */
	        set: function (value) {
	            this._node.id = value;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Widget.prototype, "title", {
	        /**
	         * Get the title object for the widget.
	         *
	         * #### Notes
	         * The title object is used by some container widgets when displaying
	         * the widget alongside some title, such as a tab panel or side bar.
	         *
	         * Since not all widgets will use the title, it is created on demand.
	         *
	         * The `owner` property of the title is set to this widget.
	         *
	         * This is a read-only property.
	         */
	        get: function () {
	            return Private.titleProperty.get(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Widget.prototype, "parent", {
	        /**
	         * Get the parent of the widget.
	         *
	         * #### Notes
	         * This will be `null` if the widget does not have a parent.
	         */
	        get: function () {
	            return this._parent;
	        },
	        /**
	         * Set the parent of the widget.
	         *
	         * #### Notes
	         * Children are typically added to a widget by using a layout, which
	         * means user code will not normally set the parent widget directly.
	         *
	         * The widget will be automatically removed from its old parent.
	         *
	         * This is a no-op if there is no effective parent change.
	         */
	        set: function (value) {
	            value = value || null;
	            if (this._parent === value) {
	                return;
	            }
	            if (value && this.contains(value)) {
	                throw new Error('Invalid parent widget.');
	            }
	            if (this._parent && !this._parent.isDisposed) {
	                messaging_1.sendMessage(this._parent, new ChildMessage('child-removed', this));
	            }
	            this._parent = value;
	            if (this._parent && !this._parent.isDisposed) {
	                messaging_1.sendMessage(this._parent, new ChildMessage('child-added', this));
	            }
	            messaging_1.sendMessage(this, WidgetMessage.ParentChanged);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Widget.prototype, "layout", {
	        /**
	         * Get the layout for the widget.
	         *
	         * #### Notes
	         * This will be `null` if the widget does not have a layout.
	         */
	        get: function () {
	            return this._layout;
	        },
	        /**
	         * Set the layout for the widget.
	         *
	         * #### Notes
	         * The layout is single-use only. It cannot be set to `null` and it
	         * cannot be changed after the first assignment.
	         *
	         * The layout is disposed automatically when the widget is disposed.
	         */
	        set: function (value) {
	            value = value || null;
	            if (this._layout === value) {
	                return;
	            }
	            if (this.testFlag(WidgetFlag.DisallowLayout)) {
	                throw new Error('Cannot set widget layout.');
	            }
	            if (this._layout) {
	                throw new Error('Cannot change widget layout.');
	            }
	            if (value.parent) {
	                throw new Error('Cannot change layout parent.');
	            }
	            this._layout = value;
	            value.parent = this;
	            messaging_1.sendMessage(this, WidgetMessage.LayoutChanged);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Create an iterator over the widget's children.
	     *
	     * @returns A new iterator over the children of the widget.
	     *
	     * #### Notes
	     * The widget must have a populated layout in order to have children.
	     *
	     * If a layout is not installed, the returned iterator will be empty.
	     */
	    Widget.prototype.children = function () {
	        return iteration_1.iter(this._layout || iteration_1.EmptyIterator.instance);
	    };
	    /**
	     * Test whether a widget is a descendant of this widget.
	     *
	     * @param widget - The descendant widget of interest.
	     *
	     * @returns `true` if the widget is a descendant, `false` otherwise.
	     */
	    Widget.prototype.contains = function (widget) {
	        for (; widget; widget = widget._parent) {
	            if (widget === this)
	                return true;
	        }
	        return false;
	    };
	    /**
	     * Test whether the widget's DOM node has the given class name.
	     *
	     * @param name - The class name of interest.
	     *
	     * @returns `true` if the node has the class, `false` otherwise.
	     */
	    Widget.prototype.hasClass = function (name) {
	        return this._node.classList.contains(name);
	    };
	    /**
	     * Add a class name to the widget's DOM node.
	     *
	     * @param name - The class name to add to the node.
	     *
	     * #### Notes
	     * If the class name is already added to the node, this is a no-op.
	     *
	     * The class name must not contain whitespace.
	     */
	    Widget.prototype.addClass = function (name) {
	        this._node.classList.add(name);
	    };
	    /**
	     * Remove a class name from the widget's DOM node.
	     *
	     * @param name - The class name to remove from the node.
	     *
	     * #### Notes
	     * If the class name is not yet added to the node, this is a no-op.
	     *
	     * The class name must not contain whitespace.
	     */
	    Widget.prototype.removeClass = function (name) {
	        this._node.classList.remove(name);
	    };
	    /**
	     * Toggle a class name on the widget's DOM node.
	     *
	     * @param name - The class name to toggle on the node.
	     *
	     * @param force - Whether to force add the class (`true`) or force
	     *   remove the class (`false`). If not provided, the presence of
	     *   the class will be toggled from its current state.
	     *
	     * @returns `true` if the class is now present, `false` otherwise.
	     *
	     * #### Notes
	     * The class name must not contain whitespace.
	     */
	    Widget.prototype.toggleClass = function (name, force) {
	        if (force === true) {
	            this._node.classList.add(name);
	            return true;
	        }
	        if (force === false) {
	            this._node.classList.remove(name);
	            return false;
	        }
	        return this._node.classList.toggle(name);
	    };
	    /**
	     * Post an `'update-request'` message to the widget.
	     *
	     * #### Notes
	     * This is a simple convenience method for posting the message.
	     */
	    Widget.prototype.update = function () {
	        messaging_1.postMessage(this, WidgetMessage.UpdateRequest);
	    };
	    /**
	     * Post a `'fit-request'` message to the widget.
	     *
	     * #### Notes
	     * This is a simple convenience method for posting the message.
	     */
	    Widget.prototype.fit = function () {
	        messaging_1.postMessage(this, WidgetMessage.FitRequest);
	    };
	    /**
	     * Post an `'activate-request'` message to the widget.
	     *
	     * #### Notes
	     * This is a simple convenience method for posting the message.
	     */
	    Widget.prototype.activate = function () {
	        messaging_1.postMessage(this, WidgetMessage.ActivateRequest);
	    };
	    /**
	     * Post a `'deactivate-request'` message to the widget.
	     *
	     * #### Notes
	     * This is a simple convenience method for posting the message.
	     */
	    Widget.prototype.deactivate = function () {
	        messaging_1.postMessage(this, WidgetMessage.DeactivateRequest);
	    };
	    /**
	     * Send a `'close-request'` message to the widget.
	     *
	     * #### Notes
	     * This is a simple convenience method for sending the message.
	     */
	    Widget.prototype.close = function () {
	        messaging_1.sendMessage(this, WidgetMessage.CloseRequest);
	    };
	    /**
	     * Show the widget and make it visible to its parent widget.
	     *
	     * #### Notes
	     * This causes the [[isHidden]] property to be `false`.
	     *
	     * If the widget is not explicitly hidden, this is a no-op.
	     */
	    Widget.prototype.show = function () {
	        if (!this.testFlag(WidgetFlag.IsHidden)) {
	            return;
	        }
	        this.clearFlag(WidgetFlag.IsHidden);
	        this.removeClass(HIDDEN_CLASS);
	        if (this.isAttached && (!this.parent || this.parent.isVisible)) {
	            messaging_1.sendMessage(this, WidgetMessage.AfterShow);
	        }
	        if (this.parent) {
	            messaging_1.sendMessage(this.parent, new ChildMessage('child-shown', this));
	        }
	    };
	    /**
	     * Hide the widget and make it hidden to its parent widget.
	     *
	     * #### Notes
	     * This causes the [[isHidden]] property to be `true`.
	     *
	     * If the widget is explicitly hidden, this is a no-op.
	     */
	    Widget.prototype.hide = function () {
	        if (this.testFlag(WidgetFlag.IsHidden)) {
	            return;
	        }
	        if (this.isAttached && (!this.parent || this.parent.isVisible)) {
	            messaging_1.sendMessage(this, WidgetMessage.BeforeHide);
	        }
	        this.setFlag(WidgetFlag.IsHidden);
	        this.addClass(HIDDEN_CLASS);
	        if (this.parent) {
	            messaging_1.sendMessage(this.parent, new ChildMessage('child-hidden', this));
	        }
	    };
	    /**
	     * Show or hide the widget according to a boolean value.
	     *
	     * @param hidden - `true` to hide the widget, or `false` to show it.
	     *
	     * #### Notes
	     * This is a convenience method for `hide()` and `show()`.
	     */
	    Widget.prototype.setHidden = function (hidden) {
	        if (hidden) {
	            this.hide();
	        }
	        else {
	            this.show();
	        }
	    };
	    /**
	     * Test whether the given widget flag is set.
	     *
	     * #### Notes
	     * This will not typically be called directly by user code.
	     */
	    Widget.prototype.testFlag = function (flag) {
	        return (this._flags & flag) !== 0;
	    };
	    /**
	     * Set the given widget flag.
	     *
	     * #### Notes
	     * This will not typically be called directly by user code.
	     */
	    Widget.prototype.setFlag = function (flag) {
	        this._flags |= flag;
	    };
	    /**
	     * Clear the given widget flag.
	     *
	     * #### Notes
	     * This will not typically be called directly by user code.
	     */
	    Widget.prototype.clearFlag = function (flag) {
	        this._flags &= ~flag;
	    };
	    /**
	     * Process a message sent to the widget.
	     *
	     * @param msg - The message sent to the widget.
	     *
	     * #### Notes
	     * Subclasses may reimplement this method as needed.
	     */
	    Widget.prototype.processMessage = function (msg) {
	        switch (msg.type) {
	            case 'resize':
	                this.notifyLayout(msg);
	                this.onResize(msg);
	                break;
	            case 'update-request':
	                this.notifyLayout(msg);
	                this.onUpdateRequest(msg);
	                break;
	            case 'fit-request':
	                this.notifyLayout(msg);
	                this.onFitRequest(msg);
	                break;
	            case 'after-show':
	                this.setFlag(WidgetFlag.IsVisible);
	                this.notifyLayout(msg);
	                this.onAfterShow(msg);
	                break;
	            case 'before-hide':
	                this.notifyLayout(msg);
	                this.onBeforeHide(msg);
	                this.clearFlag(WidgetFlag.IsVisible);
	                break;
	            case 'after-attach':
	                var visible = !this.isHidden && (!this.parent || this.parent.isVisible);
	                if (visible)
	                    this.setFlag(WidgetFlag.IsVisible);
	                this.setFlag(WidgetFlag.IsAttached);
	                this.notifyLayout(msg);
	                this.onAfterAttach(msg);
	                break;
	            case 'before-detach':
	                this.notifyLayout(msg);
	                this.onBeforeDetach(msg);
	                this.clearFlag(WidgetFlag.IsVisible);
	                this.clearFlag(WidgetFlag.IsAttached);
	                break;
	            case 'activate-request':
	                this.notifyLayout(msg);
	                this.onActivateRequest(msg);
	                break;
	            case 'deactivate-request':
	                this.notifyLayout(msg);
	                this.onDeactivateRequest(msg);
	                break;
	            case 'close-request':
	                this.notifyLayout(msg);
	                this.onCloseRequest(msg);
	                break;
	            case 'child-added':
	                this.notifyLayout(msg);
	                this.onChildAdded(msg);
	                break;
	            case 'child-removed':
	                this.notifyLayout(msg);
	                this.onChildRemoved(msg);
	                break;
	            default:
	                this.notifyLayout(msg);
	                break;
	        }
	    };
	    /**
	     * Invoke the message processing routine of the widget's layout.
	     *
	     * @param msg - The message to dispatch to the layout.
	     *
	     * #### Notes
	     * This is a no-op if the widget does not have a layout.
	     *
	     * This will not typically be called directly by user code.
	     */
	    Widget.prototype.notifyLayout = function (msg) {
	        if (this._layout)
	            this._layout.processParentMessage(msg);
	    };
	    /**
	     * A message handler invoked on a `'close-request'` message.
	     *
	     * #### Notes
	     * The default implementation unparents or detaches the widget.
	     */
	    Widget.prototype.onCloseRequest = function (msg) {
	        if (this.parent) {
	            this.parent = null;
	        }
	        else if (this.isAttached) {
	            Widget.detach(this);
	        }
	    };
	    /**
	     * A message handler invoked on a `'resize'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onResize = function (msg) { };
	    /**
	     * A message handler invoked on an `'update-request'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onUpdateRequest = function (msg) { };
	    /**
	     * A message handler invoked on a `'fit-request'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onFitRequest = function (msg) { };
	    /**
	     * A message handler invoked on an `'activate-request'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onActivateRequest = function (msg) { };
	    /**
	     * A message handler invoked on a `'deactivate-request'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onDeactivateRequest = function (msg) { };
	    /**
	     * A message handler invoked on an `'after-show'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onAfterShow = function (msg) { };
	    /**
	     * A message handler invoked on a `'before-hide'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onBeforeHide = function (msg) { };
	    /**
	     * A message handler invoked on an `'after-attach'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onAfterAttach = function (msg) { };
	    /**
	     * A message handler invoked on a `'before-detach'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onBeforeDetach = function (msg) { };
	    /**
	     * A message handler invoked on a `'child-added'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onChildAdded = function (msg) { };
	    /**
	     * A message handler invoked on a `'child-removed'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Widget.prototype.onChildRemoved = function (msg) { };
	    return Widget;
	}());
	exports.Widget = Widget;
	// Define the signals for the `Widget` class.
	signaling_1.defineSignal(Widget.prototype, 'disposed');
	/**
	 * The namespace for the `Widget` class statics.
	 */
	var Widget;
	(function (Widget) {
	    // TODO - should this be an instance method?
	    /**
	     * Attach a widget to a host DOM node.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @param host - The DOM node to use as the widget's host.
	     *
	     * #### Notes
	     * This will throw an error if the widget is not a root widget, if
	     * the widget is already attached, or if the host is not attached
	     * to the DOM.
	     */
	    function attach(widget, host) {
	        if (widget.parent) {
	            throw new Error('Cannot attach child widget.');
	        }
	        if (widget.isAttached || document.body.contains(widget.node)) {
	            throw new Error('Widget already attached.');
	        }
	        if (!document.body.contains(host)) {
	            throw new Error('Host not attached.');
	        }
	        host.appendChild(widget.node);
	        messaging_1.sendMessage(widget, WidgetMessage.AfterAttach);
	    }
	    Widget.attach = attach;
	    // TODO - should this be an instance method?
	    /**
	     * Detach the widget from its host DOM node.
	     *
	     * @param widget - The widget of interest.
	     *
	     * #### Notes
	     * This will throw an error if the widget is not a root widget, or
	     * if the widget is not attached to the DOM.
	     */
	    function detach(widget) {
	        if (widget.parent) {
	            throw new Error('Cannot detach child widget.');
	        }
	        if (!widget.isAttached || !document.body.contains(widget.node)) {
	            throw new Error('Widget not attached.');
	        }
	        messaging_1.sendMessage(widget, WidgetMessage.BeforeDetach);
	        widget.node.parentNode.removeChild(widget.node);
	    }
	    Widget.detach = detach;
	    /**
	     * Prepare a widget for absolute layout geometry.
	     *
	     * @param widget - The widget of interest.
	     *
	     * #### Notes
	     * This sets the inline style position of the widget to `absolute`.
	     */
	    function prepareGeometry(widget) {
	        widget.node.style.position = 'absolute';
	    }
	    Widget.prepareGeometry = prepareGeometry;
	    /**
	     * Reset the layout geometry of a widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * #### Notes
	     * This clears the inline style position and geometry of the widget.
	     */
	    function resetGeometry(widget) {
	        var style = widget.node.style;
	        var rect = Private.rectProperty.get(widget);
	        rect.top = NaN;
	        rect.left = NaN;
	        rect.width = NaN;
	        rect.height = NaN;
	        style.position = '';
	        style.top = '';
	        style.left = '';
	        style.width = '';
	        style.height = '';
	    }
	    Widget.resetGeometry = resetGeometry;
	    /**
	     * Set the absolute layout geometry of a widget.
	     *
	     * @param widget - The widget of interest.
	     *
	     * @param left - The desired offset left position of the widget.
	     *
	     * @param top - The desired offset top position of the widget.
	     *
	     * @param width - The desired offset width of the widget.
	     *
	     * @param height - The desired offset height of the widget.
	     *
	     * #### Notes
	     * All dimensions are assumed to be pixels with coordinates relative
	     * to the origin of the widget's offset parent.
	     *
	     * The widget's node is assumed to be position `absolute`.
	     *
	     * If the widget is resized from its previous size, a `ResizeMessage`
	     * will be automatically sent to the widget.
	     */
	    function setGeometry(widget, left, top, width, height) {
	        var resized = false;
	        var style = widget.node.style;
	        var rect = Private.rectProperty.get(widget);
	        if (rect.top !== top) {
	            rect.top = top;
	            style.top = top + "px";
	        }
	        if (rect.left !== left) {
	            rect.left = left;
	            style.left = left + "px";
	        }
	        if (rect.width !== width) {
	            resized = true;
	            rect.width = width;
	            style.width = width + "px";
	        }
	        if (rect.height !== height) {
	            resized = true;
	            rect.height = height;
	            style.height = height + "px";
	        }
	        if (resized) {
	            messaging_1.sendMessage(widget, new ResizeMessage(width, height));
	        }
	    }
	    Widget.setGeometry = setGeometry;
	})(Widget = exports.Widget || (exports.Widget = {}));
	/**
	 * An abstract base class for creating Phosphor layouts.
	 *
	 * #### Notes
	 * A layout is used to add widgets to a parent and to arrange those
	 * widgets within the parent's DOM node.
	 *
	 * This class implements the base functionality which is required of
	 * nearly all layouts. It must be subclassed in order to be useful.
	 *
	 * Notably, this class does not define a uniform interface for adding
	 * widgets to the layout. A subclass should define that API in a way
	 * which is meaningful for its intended use.
	 */
	var Layout = (function () {
	    function Layout() {
	        this._disposed = false;
	        this._parent = null;
	    }
	    /**
	     * Dispose of the resources held by the layout.
	     *
	     * #### Notes
	     * This should be reimplemented to clear and dispose of the widgets.
	     *
	     * All reimplementations should call the superclass method.
	     *
	     * This method is called automatically when the parent is disposed.
	     */
	    Layout.prototype.dispose = function () {
	        this._disposed = true;
	        this._parent = null;
	        signaling_1.clearSignalData(this);
	        properties_1.clearPropertyData(this);
	    };
	    Object.defineProperty(Layout.prototype, "isDisposed", {
	        /**
	         * Test whether the layout is disposed.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._disposed;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Layout.prototype, "parent", {
	        /**
	         * Get the parent widget of the layout.
	         */
	        get: function () {
	            return this._parent;
	        },
	        /**
	         * Set the parent widget of the layout.
	         *
	         * #### Notes
	         * This is set automatically when installing the layout on the parent
	         * widget. The parent widget should not be set directly by user code.
	         */
	        set: function (value) {
	            if (!value) {
	                throw new Error('Cannot set parent widget to null.');
	            }
	            if (this._parent === value) {
	                return;
	            }
	            if (this._parent) {
	                throw new Error('Cannot change parent widget.');
	            }
	            if (value.layout !== this) {
	                throw new Error('Invalid parent widget.');
	            }
	            this._parent = value;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Process a message sent to the parent widget.
	     *
	     * @param msg - The message sent to the parent widget.
	     *
	     * #### Notes
	     * This method is called by the parent widget to process a message.
	     *
	     * Subclasses may reimplement this method as needed.
	     */
	    Layout.prototype.processParentMessage = function (msg) {
	        switch (msg.type) {
	            case 'resize':
	                this.onResize(msg);
	                break;
	            case 'update-request':
	                this.onUpdateRequest(msg);
	                break;
	            case 'fit-request':
	                this.onFitRequest(msg);
	                break;
	            case 'after-show':
	                this.onAfterShow(msg);
	                break;
	            case 'before-hide':
	                this.onBeforeHide(msg);
	                break;
	            case 'after-attach':
	                this.onAfterAttach(msg);
	                break;
	            case 'before-detach':
	                this.onBeforeDetach(msg);
	                break;
	            case 'child-removed':
	                this.onChildRemoved(msg);
	                break;
	            case 'child-shown':
	                this.onChildShown(msg);
	                break;
	            case 'child-hidden':
	                this.onChildHidden(msg);
	                break;
	            case 'layout-changed':
	                this.onLayoutChanged(msg);
	                break;
	        }
	    };
	    /**
	     * A message handler invoked on a `'resize'` message.
	     *
	     * #### Notes
	     * The layout should ensure that its widgets are resized according
	     * to the specified layout space, and that they are sent a `'resize'`
	     * message if appropriate.
	     *
	     * The default implementation of this method sends an `UnknownSize`
	     * resize message to all widgets.
	     *
	     * This may be reimplemented by subclasses as needed.
	     */
	    Layout.prototype.onResize = function (msg) {
	        iteration_1.each(this, function (widget) { messaging_1.sendMessage(widget, ResizeMessage.UnknownSize); });
	    };
	    /**
	     * A message handler invoked on an `'update-request'` message.
	     *
	     * #### Notes
	     * The layout should ensure that its widgets are resized according
	     * to the available layout space, and that they are sent a `'resize'`
	     * message if appropriate.
	     *
	     * The default implementation of this method sends an `UnknownSize`
	     * resize message to all widgets.
	     *
	     * This may be reimplemented by subclasses as needed.
	     */
	    Layout.prototype.onUpdateRequest = function (msg) {
	        iteration_1.each(this, function (widget) { messaging_1.sendMessage(widget, ResizeMessage.UnknownSize); });
	    };
	    /**
	     * A message handler invoked on an `'after-attach'` message.
	     *
	     * #### Notes
	     * The default implementation of this method forwards the message
	     * to all widgets. It assumes all widget nodes are attached to the
	     * parent widget node.
	     *
	     * This may be reimplemented by subclasses as needed.
	     */
	    Layout.prototype.onAfterAttach = function (msg) {
	        iteration_1.each(this, function (widget) { messaging_1.sendMessage(widget, msg); });
	    };
	    /**
	     * A message handler invoked on a `'before-detach'` message.
	     *
	     * #### Notes
	     * The default implementation of this method forwards the message
	     * to all widgets. It assumes all widget nodes are attached to the
	     * parent widget node.
	     *
	     * This may be reimplemented by subclasses as needed.
	     */
	    Layout.prototype.onBeforeDetach = function (msg) {
	        iteration_1.each(this, function (widget) { messaging_1.sendMessage(widget, msg); });
	    };
	    /**
	     * A message handler invoked on an `'after-show'` message.
	     *
	     * #### Notes
	     * The default implementation of this method forwards the message to
	     * all non-hidden widgets. It assumes all widget nodes are attached
	     * to the parent widget node.
	     *
	     * This may be reimplemented by subclasses as needed.
	     */
	    Layout.prototype.onAfterShow = function (msg) {
	        iteration_1.each(this, function (widget) { if (!widget.isHidden)
	            messaging_1.sendMessage(widget, msg); });
	    };
	    /**
	     * A message handler invoked on a `'before-hide'` message.
	     *
	     * #### Notes
	     * The default implementation of this method forwards the message to
	     * all non-hidden widgets. It assumes all widget nodes are attached
	     * to the parent widget node.
	     *
	     * This may be reimplemented by subclasses as needed.
	     */
	    Layout.prototype.onBeforeHide = function (msg) {
	        iteration_1.each(this, function (widget) { if (!widget.isHidden)
	            messaging_1.sendMessage(widget, msg); });
	    };
	    /**
	     * A message handler invoked on a `'fit-request'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Layout.prototype.onFitRequest = function (msg) { };
	    /**
	     * A message handler invoked on a `'child-shown'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Layout.prototype.onChildShown = function (msg) { };
	    /**
	     * A message handler invoked on a `'child-hidden'` message.
	     *
	     * #### Notes
	     * The default implementation of this handler is a no-op.
	     */
	    Layout.prototype.onChildHidden = function (msg) { };
	    return Layout;
	}());
	exports.Layout = Layout;
	// TODO should this be in the Widget namespace?
	/**
	 * An enum of widget bit flags.
	 */
	(function (WidgetFlag) {
	    /**
	     * The widget has been disposed.
	     */
	    WidgetFlag[WidgetFlag["IsDisposed"] = 1] = "IsDisposed";
	    /**
	     * The widget is attached to the DOM.
	     */
	    WidgetFlag[WidgetFlag["IsAttached"] = 2] = "IsAttached";
	    /**
	     * The widget is hidden.
	     */
	    WidgetFlag[WidgetFlag["IsHidden"] = 4] = "IsHidden";
	    /**
	     * The widget is visible.
	     */
	    WidgetFlag[WidgetFlag["IsVisible"] = 8] = "IsVisible";
	    /**
	     * A layout cannot be set on the widget.
	     */
	    WidgetFlag[WidgetFlag["DisallowLayout"] = 16] = "DisallowLayout";
	})(exports.WidgetFlag || (exports.WidgetFlag = {}));
	var WidgetFlag = exports.WidgetFlag;
	// TODO should this be in the Widget namespace?
	/**
	 * A collection of stateless messages related to widgets.
	 */
	var WidgetMessage;
	(function (WidgetMessage) {
	    /**
	     * A singleton `'after-show'` message.
	     *
	     * #### Notes
	     * This message is sent to a widget after it becomes visible.
	     *
	     * This message is **not** sent when the widget is being attached.
	     */
	    WidgetMessage.AfterShow = new messaging_1.Message('after-show');
	    /**
	     * A singleton `'before-hide'` message.
	     *
	     * #### Notes
	     * This message is sent to a widget before it becomes not-visible.
	     *
	     * This message is **not** sent when the widget is being detached.
	     */
	    WidgetMessage.BeforeHide = new messaging_1.Message('before-hide');
	    /**
	     * A singleton `'after-attach'` message.
	     *
	     * #### Notes
	     * This message is sent to a widget after it is attached.
	     */
	    WidgetMessage.AfterAttach = new messaging_1.Message('after-attach');
	    /**
	     * A singleton `'before-detach'` message.
	     *
	     * #### Notes
	     * This message is sent to a widget before it is detached.
	     */
	    WidgetMessage.BeforeDetach = new messaging_1.Message('before-detach');
	    /**
	     * A singleton `'parent-changed'` message.
	     *
	     * #### Notes
	     * This message is sent to a widget when its parent has changed.
	     */
	    WidgetMessage.ParentChanged = new messaging_1.Message('parent-changed');
	    /**
	     * A singleton `'layout-changed'` message.
	     *
	     * #### Notes
	     * This message is sent to a widget when its layout has changed.
	     */
	    WidgetMessage.LayoutChanged = new messaging_1.Message('layout-changed');
	    /**
	     * A singleton conflatable `'update-request'` message.
	     *
	     * #### Notes
	     * This message can be dispatched to supporting widgets in order to
	     * update their content based on the current widget state. Not all
	     * widgets will respond to messages of this type.
	     *
	     * For widgets with a layout, this message will inform the layout to
	     * update the position and size of its child widgets.
	     */
	    WidgetMessage.UpdateRequest = new messaging_1.ConflatableMessage('update-request');
	    /**
	     * A singleton conflatable `'fit-request'` message.
	     *
	     * #### Notes
	     * For widgets with a layout, this message will inform the layout to
	     * recalculate its size constraints to fit the space requirements of
	     * its child widgets, and to update their position and size. Not all
	     * layouts will respond to messages of this type.
	     */
	    WidgetMessage.FitRequest = new messaging_1.ConflatableMessage('fit-request');
	    /**
	     * A singleton conflatable `'activate-request'` message.
	     *
	     * #### Notes
	     * This message should be dispatched to a widget when it should
	     * perform the actions necessary to activate the widget, which
	     * may include focusing its node or descendant node.
	     */
	    WidgetMessage.ActivateRequest = new messaging_1.ConflatableMessage('activate-request');
	    /**
	     * A singleton conflatable `'deactivate-request'` message.
	     *
	     * #### Notes
	     * This message should be dispatched to a widget when it should
	     * perform the actions necessary to decactivate the widget, which
	     * may include blurring its node or descendant node.
	     */
	    WidgetMessage.DeactivateRequest = new messaging_1.ConflatableMessage('deactivate-request');
	    /**
	     * A singleton conflatable `'close-request'` message.
	     *
	     * #### Notes
	     * This message should be dispatched to a widget when it should close
	     * and remove itself from the widget hierarchy.
	     */
	    WidgetMessage.CloseRequest = new messaging_1.ConflatableMessage('close-request');
	})(WidgetMessage = exports.WidgetMessage || (exports.WidgetMessage = {}));
	// TODO should this be in the Widget namespace?
	/**
	 * A message class for child related messages.
	 */
	var ChildMessage = (function (_super) {
	    __extends(ChildMessage, _super);
	    /**
	     * Construct a new child message.
	     *
	     * @param type - The message type.
	     *
	     * @param child - The child widget for the message.
	     */
	    function ChildMessage(type, child) {
	        _super.call(this, type);
	        this._child = child;
	    }
	    Object.defineProperty(ChildMessage.prototype, "child", {
	        /**
	         * The child widget for the message.
	         *
	         * #### Notes
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._child;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return ChildMessage;
	}(messaging_1.Message));
	exports.ChildMessage = ChildMessage;
	// TODO should this be in the Widget namespace?
	/**
	 * A message class for `'resize'` messages.
	 */
	var ResizeMessage = (function (_super) {
	    __extends(ResizeMessage, _super);
	    /**
	     * Construct a new resize message.
	     *
	     * @param width - The **offset width** of the widget, or `-1` if
	     *   the width is not known.
	     *
	     * @param height - The **offset height** of the widget, or `-1` if
	     *   the height is not known.
	     */
	    function ResizeMessage(width, height) {
	        _super.call(this, 'resize');
	        this._width = width;
	        this._height = height;
	    }
	    Object.defineProperty(ResizeMessage.prototype, "width", {
	        /**
	         * The offset width of the widget.
	         *
	         * #### Notes
	         * This will be `-1` if the width is unknown.
	         *
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._width;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ResizeMessage.prototype, "height", {
	        /**
	         * The offset height of the widget.
	         *
	         * #### Notes
	         * This will be `-1` if the height is unknown.
	         *
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._height;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return ResizeMessage;
	}(messaging_1.Message));
	exports.ResizeMessage = ResizeMessage;
	/**
	 * The namespace for the `ResizeMessage` class statics.
	 */
	var ResizeMessage;
	(function (ResizeMessage) {
	    /**
	     * A singleton `'resize'` message with an unknown size.
	     */
	    ResizeMessage.UnknownSize = new ResizeMessage(-1, -1);
	})(ResizeMessage = exports.ResizeMessage || (exports.ResizeMessage = {}));
	/**
	 * The namespace for the private module data.
	 */
	var Private;
	(function (Private) {
	    /**
	     * A property descriptor for a widget absolute geometry rect.
	     */
	    Private.rectProperty = new properties_1.AttachedProperty({
	        name: 'rect',
	        create: function () { return ({ top: NaN, left: NaN, width: NaN, height: NaN }); },
	    });
	    /**
	     * An attached property for the widget title object.
	     */
	    Private.titleProperty = new properties_1.AttachedProperty({
	        name: 'title',
	        create: function (owner) { return new title_1.Title({ owner: owner }); },
	    });
	    /**
	     * Create a DOM node for the given widget options.
	     */
	    function createNode(options) {
	        return options.node || document.createElement('div');
	    }
	    Private.createNode = createNode;
	})(Private || (Private = {}));


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate) {/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	"use strict";
	/**
	 * Define a signal property on a prototype object.
	 *
	 * @param target - The prototype for the class of interest.
	 *
	 * @param name - The name of the signal property.
	 *
	 * #### Notes
	 * The defined signal property is read-only.
	 *
	 * #### Example
	 * ```typescript
	 * class SomeClass {
	 *   valueChanged: ISignal<SomeClass, number>;
	 * }
	 *
	 * defineSignal(SomeClass.prototype, 'valueChanged');
	 */
	function defineSignal(target, name) {
	    var token = Object.freeze({});
	    Object.defineProperty(target, name, {
	        get: function () { return new Signal(this, token); }
	    });
	}
	exports.defineSignal = defineSignal;
	/**
	 * Remove all connections where the given object is the sender.
	 *
	 * @param sender - The sender object of interest.
	 *
	 * #### Example
	 * ```typescript
	 * disconnectSender(someObject);
	 * ```
	 */
	function disconnectSender(sender) {
	    // If there are no receivers, there is nothing to do.
	    var receiverList = senderData.get(sender);
	    if (receiverList === void 0) {
	        return;
	    }
	    // Clear the connections and schedule a cleanup of the
	    // receiver's corresponding list of sender connections.
	    for (var i = 0, n = receiverList.length; i < n; ++i) {
	        var conn = receiverList[i];
	        var senderList = receiverData.get(conn.thisArg || conn.slot);
	        scheduleCleanup(senderList);
	        conn.token = null;
	    }
	    // Schedule a cleanup of the receiver list.
	    scheduleCleanup(receiverList);
	}
	exports.disconnectSender = disconnectSender;
	/**
	 * Remove all connections where the given object is the receiver.
	 *
	 * @param receiver - The receiver object of interest.
	 *
	 * #### Notes
	 * If a `thisArg` is provided when connecting a signal, that object
	 * is considered the receiver. Otherwise, the `callback` is used as
	 * the receiver.
	 *
	 * #### Example
	 * ```typescript
	 * // disconnect a regular object receiver
	 * disconnectReceiver(myObject);
	 *
	 * // disconnect a plain callback receiver
	 * disconnectReceiver(myCallback);
	 * ```
	 */
	function disconnectReceiver(receiver) {
	    // If there are no senders, there is nothing to do.
	    var senderList = receiverData.get(receiver);
	    if (senderList === void 0) {
	        return;
	    }
	    // Clear the connections and schedule a cleanup of the
	    // senders's corresponding list of receiver connections.
	    for (var i = 0, n = senderList.length; i < n; ++i) {
	        var conn = senderList[i];
	        var receiverList = senderData.get(conn.sender);
	        scheduleCleanup(receiverList);
	        conn.token = null;
	    }
	    // Schedule a cleanup of the sender list.
	    scheduleCleanup(senderList);
	}
	exports.disconnectReceiver = disconnectReceiver;
	/**
	 * Clear all signal data associated with the given object.
	 *
	 * @param obj - The object for which the signal data should be cleared.
	 *
	 * #### Notes
	 * This removes all signal connections where the object is used as
	 * either the sender or the receiver.
	 *
	 * #### Example
	 * ```typescript
	 * clearSignalData(someObject);
	 * ```
	 */
	function clearSignalData(obj) {
	    disconnectSender(obj);
	    disconnectReceiver(obj);
	}
	exports.clearSignalData = clearSignalData;
	/**
	 * A concrete implementation of `ISignal`.
	 */
	var Signal = (function () {
	    /**
	     * Construct a new signal.
	     *
	     * @param sender - The object which owns the signal.
	     *
	     * @param token - The unique token identifying the signal.
	     */
	    function Signal(sender, token) {
	        this._sender = sender;
	        this._token = token;
	    }
	    /**
	     * Connect a slot to the signal.
	     *
	     * @param slot - The slot to invoke when the signal is emitted.
	     *
	     * @param thisArg - The `this` context for the slot. If provided,
	     *   this must be a non-primitive object.
	     *
	     * @returns `true` if the connection succeeds, `false` otherwise.
	     */
	    Signal.prototype.connect = function (slot, thisArg) {
	        return connect(this._sender, this._token, slot, thisArg);
	    };
	    /**
	     * Disconnect a slot from the signal.
	     *
	     * @param slot - The slot to disconnect from the signal.
	     *
	     * @param thisArg - The `this` context for the slot. If provided,
	     *   this must be a non-primitive object.
	     *
	     * @returns `true` if the connection is removed, `false` otherwise.
	     */
	    Signal.prototype.disconnect = function (slot, thisArg) {
	        return disconnect(this._sender, this._token, slot, thisArg);
	    };
	    /**
	     * Emit the signal and invoke the connected slots.
	     *
	     * @param args - The args to pass to the connected slots.
	     */
	    Signal.prototype.emit = function (args) {
	        emit(this._sender, this._token, args);
	    };
	    return Signal;
	}());
	/**
	 * A weak mapping of sender to list of receiver connections.
	 */
	var senderData = new WeakMap();
	/**
	 * A weak mapping of receiver to list of sender connections.
	 */
	var receiverData = new WeakMap();
	/**
	 * A set of connection lists which are pending cleanup.
	 */
	var dirtySet = new Set();
	/**
	 * A local reference to an event loop callback.
	 */
	var defer = (function () {
	    var ok = typeof requestAnimationFrame === 'function';
	    return ok ? requestAnimationFrame : setImmediate;
	})();
	/**
	 * Connect a slot to a signal.
	 *
	 * @param sender - The object emitting the signal.
	 *
	 * @param token - The unique token for the signal.
	 *
	 * @param slot - The slot to connect to the signal.
	 *
	 * @param thisArg - The `this` context for the slot.
	 *
	 * @returns `true` if the connection succeeds, `false` otherwise.
	 *
	 * #### Notes
	 * Signal connections are unique. If a connection already exists for
	 * the given `slot` and `thisArg`, this function returns `false`.
	 *
	 * A newly connected slot will not be invoked until the next time the
	 * signal is emitted, even if the slot is connected while the signal
	 * is dispatching.
	 */
	function connect(sender, token, slot, thisArg) {
	    // Coerce a `null` thisArg to `undefined`.
	    thisArg = thisArg || void 0;
	    // Ensure the sender's receiver list is created.
	    var receiverList = senderData.get(sender);
	    if (receiverList === void 0) {
	        receiverList = [];
	        senderData.set(sender, receiverList);
	    }
	    // Bail if a matching connection already exists.
	    if (findConnection(receiverList, token, slot, thisArg) !== null) {
	        return false;
	    }
	    // Ensure the receiver's sender list is created.
	    var receiver = thisArg || slot;
	    var senderList = receiverData.get(receiver);
	    if (senderList === void 0) {
	        senderList = [];
	        receiverData.set(receiver, senderList);
	    }
	    // Create a new connection and add it to the end of each list.
	    var connection = { sender: sender, token: token, slot: slot, thisArg: thisArg };
	    receiverList.push(connection);
	    senderList.push(connection);
	    // Indicate a successful connection.
	    return true;
	}
	/**
	 * Disconnect a slot from a signal.
	 *
	 * @param sender - The object emitting the signal.
	 *
	 * @param token - The unique token for the signal.
	 *
	 * @param slot - The slot to disconnect from the signal.
	 *
	 * @param thisArg - The `this` context for the slot.
	 *
	 * @returns `true` if the connection is removed, `false` otherwise.
	 *
	 * #### Notes
	 * If no connection exists for the given `slot` and `thisArg`, this
	 * function returns `false`.
	 *
	 * A disconnected slot will no longer be invoked, even if the slot
	 * is disconnected while the signal is dispatching.
	 */
	function disconnect(sender, token, slot, thisArg) {
	    // Coerce a `null` thisArg to `undefined`.
	    thisArg = thisArg || void 0;
	    // Lookup the list of receivers, and bail if none exist.
	    var receiverList = senderData.get(sender);
	    if (receiverList === void 0) {
	        return false;
	    }
	    // Bail if no matching connection exits.
	    var conn = findConnection(receiverList, token, slot, thisArg);
	    if (conn === null) {
	        return false;
	    }
	    // Lookup the list of senders, which is now known to exist.
	    var senderList = receiverData.get(thisArg || slot);
	    // Clear the connection and schedule list cleanup.
	    conn.token = null;
	    scheduleCleanup(receiverList);
	    scheduleCleanup(senderList);
	    // Indicate a successful disconnection.
	    return true;
	}
	/**
	 * Emit a signal and invoke the connected slots.
	 *
	 * @param sender - The object emitting the signal.
	 *
	 * @param token - The unique token for the signal.
	 *
	 * @param args - The args to pass to the connected slots.
	 *
	 * #### Notes
	 * Connected slots are invoked synchronously, in the order in which
	 * they are connected.
	 *
	 * Exceptions thrown by connected slots will be caught and logged.
	 */
	function emit(sender, token, args) {
	    // If there are no receivers, there is nothing to do.
	    var receiverList = senderData.get(sender);
	    if (receiverList === void 0) {
	        return;
	    }
	    // Invoke the connections which match the given token.
	    for (var i = 0, n = receiverList.length; i < n; ++i) {
	        var conn = receiverList[i];
	        if (conn.token === token) {
	            invokeSlot(conn, args);
	        }
	    }
	}
	/**
	 * Safely invoke a non-empty connection.
	 *
	 * @param conn - The connection of interest
	 *
	 * @param args - The arguments to pass to the slot.
	 *
	 * #### Notes
	 * Any exception thrown by the slot will be caught and logged.
	 */
	function invokeSlot(conn, args) {
	    try {
	        conn.slot.call(conn.thisArg, conn.sender, args);
	    }
	    catch (err) {
	        console.error(err);
	    }
	}
	/**
	 * Find a connection which matches the given parameters.
	 *
	 * @param list - The list of connections to search.
	 *
	 * @param token - The unique token for the signal.
	 *
	 * @param slot - The slot of interest.
	 *
	 * @param thisArg - The `this` context for the slot.
	 *
	 * @returns The first connection which matches the supplied parameters,
	 *   or null if no matching connection is found.
	 */
	function findConnection(list, token, slot, thisArg) {
	    for (var i = 0, n = list.length; i < n; ++i) {
	        var conn = list[i];
	        if (conn.token === token &&
	            conn.slot === slot &&
	            conn.thisArg === thisArg) {
	            return conn;
	        }
	    }
	    return null;
	}
	/**
	 * Schedule a cleanup of a connection list.
	 *
	 * @param list - The list of connections to cleanup.
	 *
	 * #### Notes
	 * This will add the list to the dirty set and schedule a deferred
	 * cleanup of the list contents. On cleanup, any connection with a
	 * null token will be removed from the array.
	 */
	function scheduleCleanup(list) {
	    if (dirtySet.size === 0) {
	        defer(cleanupDirtySet);
	    }
	    dirtySet.add(list);
	}
	/**
	 * Cleanup the connection lists in the dirty set.
	 *
	 * #### Notes
	 * This function should only be invoked asynchronously, when the stack
	 * frame is guaranteed to not be on the path of a signal dispatch.
	 */
	function cleanupDirtySet() {
	    dirtySet.forEach(cleanupList);
	    dirtySet.clear();
	}
	/**
	 * Cleanup the dirty connections in a connection list.
	 *
	 * @param list - The list of connection to cleanup.
	 *
	 * #### Notes
	 * This will remove any connection with a null token from the list,
	 * while retaining the relative order of the other connections.
	 *
	 * This function should only be invoked asynchronously, when the stack
	 * frame is guaranteed to not be on the path of a signal dispatch.
	 */
	function cleanupList(list) {
	    var count = 0;
	    for (var i = 0, n = list.length; i < n; ++i) {
	        var conn = list[i];
	        if (conn.token === null) {
	            count++;
	        }
	        else {
	            list[i - count] = conn;
	        }
	    }
	    list.length -= count;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7).setImmediate))

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*-----------------------------------------------------------------------------
	| Copyright (c) 2014-2016, PhosphorJS Contributors
	|
	| Distributed under the terms of the BSD 3-Clause License.
	|
	| The full license is in the file LICENSE, distributed with this software.
	|----------------------------------------------------------------------------*/
	var signaling_1 = __webpack_require__(17);
	/**
	 * An object which holds data related to a widget's title.
	 *
	 * #### Notes
	 * A title object is intended to hold the data necessary to display a
	 * header for a particular widget. A common example is the `TabPanel`,
	 * which uses the widget title to populate the tab for a child widget.
	 */
	var Title = (function () {
	    /**
	     * Construct a new title.
	     *
	     * @param options - The options for initializing the title.
	     */
	    function Title(options) {
	        if (options === void 0) { options = {}; }
	        this._label = '';
	        this._icon = '';
	        this._caption = '';
	        this._mnemonic = -1;
	        this._className = '';
	        this._closable = false;
	        this._owner = null;
	        if (options.owner !== void 0) {
	            this._owner = options.owner;
	        }
	        if (options.label !== void 0) {
	            this._label = options.label;
	        }
	        if (options.mnemonic !== void 0) {
	            this._mnemonic = options.mnemonic;
	        }
	        if (options.icon !== void 0) {
	            this._icon = options.icon;
	        }
	        if (options.caption !== void 0) {
	            this._caption = options.caption;
	        }
	        if (options.closable !== void 0) {
	            this._closable = options.closable;
	        }
	        if (options.className !== void 0) {
	            this._className = options.className;
	        }
	    }
	    Object.defineProperty(Title.prototype, "owner", {
	        /**
	         * Get the object which owns the title.
	         *
	         * #### Notes
	         * This will be `null` if the title has no owner.
	         *
	         * This is a read-only property.
	         */
	        get: function () {
	            return this._owner;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Title.prototype, "label", {
	        /**
	         * Get the label for the title.
	         *
	         * #### Notes
	         * The default value is an empty string.
	         */
	        get: function () {
	            return this._label;
	        },
	        /**
	         * Set the label for the title.
	         */
	        set: function (value) {
	            if (this._label === value) {
	                return;
	            }
	            this._label = value;
	            this.changed.emit(void 0);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Title.prototype, "mnemonic", {
	        /**
	         * Get the mnemonic index for the title.
	         *
	         * #### Notes
	         * The default value is `-1`.
	         */
	        get: function () {
	            return this._mnemonic;
	        },
	        /**
	         * Set the mnemonic index for the title.
	         */
	        set: function (value) {
	            if (this._mnemonic === value) {
	                return;
	            }
	            this._mnemonic = value;
	            this.changed.emit(void 0);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Title.prototype, "icon", {
	        /**
	         * Get the icon class name for the title.
	         *
	         * #### Notes
	         * The default value is an empty string.
	         */
	        get: function () {
	            return this._icon;
	        },
	        /**
	         * Set the icon class name for the title.
	         *
	         * #### Notes
	         * Multiple class names can be separated with whitespace.
	         */
	        set: function (value) {
	            if (this._icon === value) {
	                return;
	            }
	            this._icon = value;
	            this.changed.emit(void 0);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Title.prototype, "caption", {
	        /**
	         * Get the caption for the title.
	         *
	         * #### Notes
	         * The default value is an empty string.
	         */
	        get: function () {
	            return this._caption;
	        },
	        /**
	         * Set the caption for the title.
	         */
	        set: function (value) {
	            if (this._caption === value) {
	                return;
	            }
	            this._caption = value;
	            this.changed.emit(void 0);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Title.prototype, "className", {
	        /**
	         * Get the extra class name for the title.
	         *
	         * #### Notes
	         * The default value is an empty string.
	         */
	        get: function () {
	            return this._className;
	        },
	        /**
	         * Set the extra class name for the title.
	         *
	         * #### Notes
	         * Multiple class names can be separated with whitespace.
	         */
	        set: function (value) {
	            if (this._className === value) {
	                return;
	            }
	            this._className = value;
	            this.changed.emit(void 0);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Title.prototype, "closable", {
	        /**
	         * Get the closable state for the title.
	         *
	         * #### Notes
	         * The default value is `false`.
	         */
	        get: function () {
	            return this._closable;
	        },
	        /**
	         * Set the closable state for the title.
	         *
	         * #### Notes
	         * This controls the presence of a close icon when applicable.
	         */
	        set: function (value) {
	            if (this._closable === value) {
	                return;
	            }
	            this._closable = value;
	            this.changed.emit(void 0);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return Title;
	}());
	exports.Title = Title;
	// Define the signals for the `Title` class.
	signaling_1.defineSignal(Title.prototype, 'changed');


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(20);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(22)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../node_modules/css-loader/index.js!./base.css", function() {
				var newContent = require("!!./../node_modules/css-loader/index.js!./base.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(21)();
	// imports


	// module
	exports.push([module.id, "/*-----------------------------------------------------------------------------\r\n| Copyright (c) 2014-2016, PhosphorJS Contributors\r\n|\r\n| Distributed under the terms of the BSD 3-Clause License.\r\n|\r\n| The full license is in the file LICENSE, distributed with this software.\r\n|----------------------------------------------------------------------------*/\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| dom/cursor\r\n|----------------------------------------------------------------------------*/\r\nbody.p-mod-override-cursor * {\r\n  cursor: inherit !important;\r\n}\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| ui/widget\r\n|----------------------------------------------------------------------------*/\r\n.p-Widget {\r\n  box-sizing: border-box;\r\n  position: relative;\r\n  overflow: hidden;\r\n  cursor: default;\r\n}\r\n\r\n\r\n.p-Widget.p-mod-hidden {\r\n  display: none;\r\n}\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| ui/commandpalette\r\n|----------------------------------------------------------------------------*/\r\n.p-CommandPalette {\r\n  display: flex;\r\n  flex-direction: column;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  user-select: none;\r\n}\r\n\r\n\r\n.p-CommandPalette-search {\r\n  flex: 0 0 auto;\r\n}\r\n\r\n\r\n.p-CommandPalette-content {\r\n  flex: 1 1 auto;\r\n  margin: 0;\r\n  padding: 0;\r\n  min-height: 0;\r\n  overflow: auto;\r\n  list-style-type: none;\r\n}\r\n\r\n\r\n.p-CommandPalette-header {\r\n  overflow: hidden;\r\n  white-space: nowrap;\r\n  text-overflow: ellipsis;\r\n  text-transform: capitalize;\r\n}\r\n\r\n\r\n.p-CommandPalette-itemShortcut {\r\n  float: right;\r\n}\r\n\r\n\r\n.p-CommandPalette-itemLabel {\r\n  overflow: hidden;\r\n  white-space: nowrap;\r\n  text-overflow: ellipsis;\r\n}\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| ui/menu\r\n|----------------------------------------------------------------------------*/\r\n.p-Menu {\r\n  position: absolute;\r\n  white-space: nowrap;\r\n  overflow-x: hidden;\r\n  overflow-y: auto;\r\n  outline: none;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  user-select: none;\r\n}\r\n\r\n\r\n.p-Menu-content {\r\n  margin: 0;\r\n  padding: 0;\r\n  display: table;\r\n  list-style-type: none;\r\n}\r\n\r\n\r\n.p-Menu-item {\r\n  display: table-row;\r\n}\r\n\r\n\r\n.p-Menu-item.p-mod-hidden {\r\n  display: none;\r\n}\r\n\r\n\r\n.p-Menu-itemIcon,\r\n.p-Menu-itemSubmenuIcon {\r\n  display: table-cell;\r\n  text-align: center;\r\n}\r\n\r\n\r\n.p-Menu-itemLabel {\r\n  display: table-cell;\r\n  text-align: left;\r\n}\r\n\r\n\r\n.p-Menu-itemShortcut {\r\n  display: table-cell;\r\n  text-align: right;\r\n}\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| ui/menubar\r\n|----------------------------------------------------------------------------*/\r\n.p-MenuBar {\r\n  outline: none;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  user-select: none;\r\n}\r\n\r\n\r\n.p-MenuBar-content {\r\n  margin: 0;\r\n  padding: 0;\r\n  display: flex;\r\n  flex-direction: row;\r\n  list-style-type: none;\r\n}\r\n\r\n\r\n.p-MenuBar-item {\r\n  box-sizing: border-box;\r\n}\r\n\r\n\r\n.p-MenuBar-itemIcon,\r\n.p-MenuBar-itemLabel {\r\n  display: inline-block;\r\n}\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| ui/splitpanel\r\n|----------------------------------------------------------------------------*/\r\n.p-SplitPanel-child {\r\n  z-index: 0;\r\n}\r\n\r\n\r\n.p-SplitPanel-handle {\r\n  z-index: 1;\r\n}\r\n\r\n\r\n.p-SplitPanel-handle.p-mod-hidden {\r\n  display: none;\r\n}\r\n\r\n\r\n.p-SplitPanel-handle:after {\r\n  position: absolute;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  content: '';\r\n}\r\n\r\n\r\n.p-SplitPanel.p-mod-horizontal > .p-SplitPanel-handle {\r\n  cursor: ew-resize;\r\n}\r\n\r\n\r\n.p-SplitPanel.p-mod-vertical > .p-SplitPanel-handle {\r\n  cursor: ns-resize;\r\n}\r\n\r\n\r\n.p-SplitPanel.p-mod-horizontal > .p-SplitPanel-handle:after {\r\n  left: 50%;\r\n  min-width: 7px;\r\n  transform: translateX(-50%);\r\n}\r\n\r\n\r\n.p-SplitPanel.p-mod-vertical > .p-SplitPanel-handle:after {\r\n  top: 50%;\r\n  min-height: 7px;\r\n  transform: translateY(-50%);\r\n}\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| ui/tabbar\r\n|----------------------------------------------------------------------------*/\r\n.p-TabBar {\r\n  display: flex;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  user-select: none;\r\n}\r\n\r\n\r\n.p-TabBar.p-mod-horizontal {\r\n  flex-direction: row;\r\n}\r\n\r\n\r\n.p-TabBar.p-mod-vertical {\r\n  flex-direction: column;\r\n}\r\n\r\n\r\n.p-TabBar-content {\r\n  margin: 0;\r\n  padding: 0;\r\n  display: flex;\r\n  flex: 1 1 auto;\r\n  list-style-type: none;\r\n}\r\n\r\n\r\n.p-TabBar.p-mod-horizontal > .p-TabBar-content {\r\n  flex-direction: row;\r\n}\r\n\r\n\r\n.p-TabBar.p-mod-vertical > .p-TabBar-content {\r\n  flex-direction: column;\r\n}\r\n\r\n\r\n.p-TabBar-tab {\r\n  display: flex;\r\n  flex-direction: row;\r\n  box-sizing: border-box;\r\n  overflow: hidden;\r\n}\r\n\r\n\r\n.p-TabBar-tabIcon,\r\n.p-TabBar-tabCloseIcon {\r\n  flex: 0 0 auto;\r\n}\r\n\r\n\r\n.p-TabBar-tabLabel {\r\n  flex: 1 1 auto;\r\n  overflow: hidden;\r\n  white-space: nowrap;\r\n}\r\n\r\n\r\n.p-TabBar-tab.p-mod-hidden {\r\n  display: none;\r\n}\r\n\r\n\r\n.p-TabBar.p-mod-dragging .p-TabBar-tab {\r\n  position: relative;\r\n}\r\n\r\n\r\n.p-TabBar.p-mod-horizontal.p-mod-dragging .p-TabBar-tab {\r\n  left: 0;\r\n  transition: left 150ms ease;\r\n}\r\n\r\n\r\n.p-TabBar.p-mod-vertical.p-mod-dragging .p-TabBar-tab {\r\n  top: 0;\r\n  transition: top 150ms ease;\r\n}\r\n\r\n\r\n.p-TabBar.p-mod-dragging .p-TabBar-tab.p-mod-dragging {\r\n  transition: none;\r\n}\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| ui/tabpanel\r\n|----------------------------------------------------------------------------*/\r\n.p-TabPanel-tabBar {\r\n  z-index: 1;\r\n}\r\n\r\n\r\n.p-TabPanel-stackedPanel {\r\n  z-index: 0;\r\n}\r\n\r\n\r\n/*-----------------------------------------------------------------------------\r\n| ui/dockpanel\r\n|----------------------------------------------------------------------------*/\r\n.p-DockPanel {\r\n  z-index: 0;\r\n}\r\n\r\n\r\n.p-DockPanel-splitPanel,\r\n.p-DockPanel-tabPanel {\r\n  z-index: 0;\r\n}\r\n\r\n\r\n.p-DockPanel-overlay {\r\n  z-index: 1;\r\n  box-sizing: border-box;\r\n  pointer-events: none;\r\n}\r\n\r\n\r\n.p-DockPanel-overlay.p-mod-hidden {\r\n  display: none;\r\n}\r\n", ""]);

	// exports


/***/ },
/* 21 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}

	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}

	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}

	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(24);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(22)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./index.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./index.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(21)();
	// imports


	// module
	exports.push([module.id, "/*-----------------------------------------------------------------------------\r\n| Copyright (c) 2014-2016, PhosphorJS Contributors\r\n|\r\n| Distributed under the terms of the BSD 3-Clause License.\r\n|\r\n| The full license is in the file LICENSE, distributed with this software.\r\n|----------------------------------------------------------------------------*/\r\n#main {\r\n  position: absolute;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n}\r\n\r\n.red {\r\n  background: #E74C3C;\r\n}\r\n\r\n\r\n.yellow {\r\n  background: #F1C40F;\r\n}\r\n\r\n\r\n.green {\r\n  background: #27AE60;\r\n}\r\n\r\n\r\n.blue {\r\n  background: #3498DB;\r\n}\r\n", ""]);

	// exports


/***/ }
/******/ ]);
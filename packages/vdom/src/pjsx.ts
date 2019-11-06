/*------------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|-----------------------------------------------------------------------------*/
import {
  VNode
} from './vnode';


/**
 * The namespace for the Phosphor JSX type defintions.
 */
export
namespace PJSX {

  export type Element = VNode;
	export type Child = VNode.Child | number | boolean | null;
	export type Children = Child[] | Child;
	export type Key = VNode.Key;
	export type Ref = VNode.Ref;

	export
	interface ElementChildrenAttribute {
		children: {}
	}

	export
	interface SpecialAttributes {
		children?: Children;
		key?: Key;
		ref?: Ref;
	}

  export type EventHandlerFunction<E extends Event> = (event: E) => void;
  export type EventHandlerObject<E extends Event> = { handleEvent(event: E): void; };
  export type EventHandler<E extends Event> = EventHandlerFunction<E> | EventHandlerObject<E>;

  export
	interface DOMAttributes extends SpecialAttributes {
		// Clipboard Events
		oncopy?: EventHandler<ClipboardEvent>;
		oncut?: EventHandler<ClipboardEvent>;
		onpaste?: EventHandler<ClipboardEvent>;

		// Composition Events
		oncompositionend?: EventHandler<CompositionEvent>;
		oncompositionstart?: EventHandler<CompositionEvent>;
		oncompositionupdate?: EventHandler<CompositionEvent>;

		// Focus Events
		onfocus?: EventHandler<FocusEvent>;
		onblur?: EventHandler<FocusEvent>;

		// Form Events
		onchange?: EventHandler<Event>;
		oninput?: EventHandler<Event>;
		onsearch?: EventHandler<Event>;
		onsubmit?: EventHandler<Event>;
		oninvalid?: EventHandler<Event>;

		// Image Events
		onload?: EventHandler<Event>;
		onerror?: EventHandler<Event>;

		// Keyboard Events
		onkeydown?: EventHandler<KeyboardEvent>;
		onkeypress?: EventHandler<KeyboardEvent>;
		onkeyup?: EventHandler<KeyboardEvent>;

		// Media Events
		onabort?: EventHandler<Event>;
		oncanplay?: EventHandler<Event>;
		oncanplaythrough?: EventHandler<Event>;
		ondurationchange?: EventHandler<Event>;
		onemptied?: EventHandler<Event>;
		onencrypted?: EventHandler<Event>;
		onended?: EventHandler<Event>;
		onloadeddata?: EventHandler<Event>;
		onloadedmetadata?: EventHandler<Event>;
		onloadstart?: EventHandler<Event>;
		onpause?: EventHandler<Event>;
		onplay?: EventHandler<Event>;
		onplaying?: EventHandler<Event>;
		onprogress?: EventHandler<Event>;
		onratechange?: EventHandler<Event>;
		onseeked?: EventHandler<Event>;
		onseeking?: EventHandler<Event>;
		onstalled?: EventHandler<Event>;
		onsuspend?: EventHandler<Event>;
		ontimeupdate?: EventHandler<Event>;
		onvolumechange?: EventHandler<Event>;
		onwaiting?: EventHandler<Event>;

		// MouseEvents
		onclick?: EventHandler<MouseEvent>;
		oncontextmenu?: EventHandler<MouseEvent>;
		ondblclick?: EventHandler<MouseEvent>;
		ondrag?: EventHandler<DragEvent>;
		ondragend?: EventHandler<DragEvent>;
		ondragenter?: EventHandler<DragEvent>;
		ondragexit?: EventHandler<DragEvent>;
		ondragleave?: EventHandler<DragEvent>;
		ondragover?: EventHandler<DragEvent>;
		ondragstart?: EventHandler<DragEvent>;
		ondrop?: EventHandler<DragEvent>;
		onmousedown?: EventHandler<MouseEvent>;
		onmouseenter?: EventHandler<MouseEvent>;
		onmouseleave?: EventHandler<MouseEvent>;
		onmousemove?: EventHandler<MouseEvent>;
		onmouseout?: EventHandler<MouseEvent>;
		onmouseover?: EventHandler<MouseEvent>;
		onmouseup?: EventHandler<MouseEvent>;

		// Selection Events
		onselect?: EventHandler<Event>;

		// Touch Events
		ontouchcancel?: EventHandler<TouchEvent>;
		ontouchend?: EventHandler<TouchEvent>;
		ontouchmove?: EventHandler<TouchEvent>;
		ontouchstart?: EventHandler<TouchEvent>;

		// Pointer Events
		onpointerover?: EventHandler<PointerEvent>;
		onpointerenter?: EventHandler<PointerEvent>;
		onpointerdown?: EventHandler<PointerEvent>;
		onpointermove?: EventHandler<PointerEvent>;
		onpointerup?: EventHandler<PointerEvent>;
		onpointercancel?: EventHandler<PointerEvent>;
		onpointerout?: EventHandler<PointerEvent>;
		onpointerleave?: EventHandler<PointerEvent>;
		ongotpointercapture?: EventHandler<PointerEvent>;
		onlostpointercapture?: EventHandler<PointerEvent>;

		// UI Events
		onscroll?: EventHandler<UIEvent>;

		// Wheel Events
		onwheel?: EventHandler<WheelEvent>;

		// Animation Events
		onanimationstart?: EventHandler<AnimationEvent>;
		onanimationend?: EventHandler<AnimationEvent>;
		onanimationiteration?: EventHandler<AnimationEvent>;

		// Transition Events
		ontransitionend?: EventHandler<TransitionEvent>;
	}

  export
  type StyleAttributes = { [key: string]: string | number };

  export
	interface HTMLAttributes extends DOMAttributes {
		// Standard HTML Attributes
		accept?: string;
		acceptcharset?: string;
		accesskey?: string;
		action?: string;
		allowfullscreen?: boolean;
		allowtransparency?: boolean;
		alt?: string;
		async?: boolean;
		autocomplete?: string;
		autocorrect?: string;
		autofocus?: boolean;
		autoplay?: boolean;
		capture?: boolean;
		cellpadding?: number | string;
		cellspacing?: number | string;
		charset?: string;
		challenge?: string;
		checked?: boolean;
		class?: string;
		cols?: number;
		colspan?: number;
		content?: string;
		contenteditable?: boolean;
		contextmenu?: string;
		controls?: boolean;
		controlslist?: string;
		coords?: string;
		crossorigin?: string;
		data?: string;
		datetime?: string;
		default?: boolean;
		defer?: boolean;
		dir?: string;
		disabled?: boolean;
		disableremoteplayback?: boolean;
		download?: any;
		draggable?: boolean;
		enctype?: string;
		form?: string;
		formaction?: string;
		formenctype?: string;
		formmethod?: string;
		formnovalidate?: boolean;
		formtarget?: string;
		frameborder?: number | string;
		headers?: string;
		height?: number | string;
		hidden?: boolean;
		high?: number;
		href?: string;
		hreflang?: string;
		for?: string;
		httpequiv?: string;
		icon?: string;
		id?: string;
		inputmode?: string;
		integrity?: string;
		is?: string;
		keyparams?: string;
		keytype?: string;
		kind?: string;
		label?: string;
		lang?: string;
		list?: string;
		loop?: boolean;
		low?: number;
		manifest?: string;
		marginheight?: number;
		marginwidth?: number;
		max?: number | string;
		maxlength?: number;
		media?: string;
		mediagroup?: string;
		method?: string;
		min?: number | string;
		minlength?: number;
		multiple?: boolean;
		muted?: boolean;
		name?: string;
		novalidate?: boolean;
		open?: boolean;
		optimum?: number;
		pattern?: string;
		placeholder?: string;
		playsinline?: boolean;
		poster?: string;
		preload?: string;
		radiogroup?: string;
		readonly?: boolean;
		rel?: string;
		required?: boolean;
		role?: string;
		rows?: number;
		rowspan?: number;
		sandbox?: string;
		scope?: string;
		scoped?: boolean;
		scrolling?: string;
		seamless?: boolean;
		selected?: boolean;
		shape?: string;
		size?: number;
		sizes?: string;
		slot?: string;
		span?: number;
		spellcheck?: boolean;
		src?: string;
		srcdoc?: string;
		srclang?: string;
		srcset?: string;
		start?: number;
		step?: number | string;
		style?: StyleAttributes;
		summary?: string;
		tabindex?: number;
		target?: string;
		title?: string;
		type?: string;
		usemap?: string;
		value?: string | string[] | number;
		volume?: string | number;
		width?: number | string;
		wmode?: string;
		wrap?: string;

		// RDFa Attributes
		about?: string;
		datatype?: string;
		inlist?: any;
		prefix?: string;
		property?: string;
		resource?: string;
		typeof?: string;
		vocab?: string;

		// Microdata Attributes
		itemprop?: string;
		itemscope?: boolean;
		itemtype?: string;
		itemid?: string;
		itemref?: string;
  }

  export
	interface SVGAttributes extends HTMLAttributes {
		accentheight?: number | string;
		accumulate?: "none" | "sum";
		additive?: "replace" | "sum";
		alignmentbaseline?: "auto" | "baseline" | "before-edge" | "text-before-edge" | "middle" | "central" | "after-edge" | "text-after-edge" | "ideographic" | "alphabetic" | "hanging" | "mathematical" | "inherit";
		allowreorder?: "no" | "yes";
		alphabetic?: number | string;
		amplitude?: number | string;
		arabicform?: "initial" | "medial" | "terminal" | "isolated";
		ascent?: number | string;
		attributename?: string;
		attributetype?: string;
		autoreverse?: number | string;
		azimuth?: number | string;
		basefrequency?: number | string;
		baselineshift?: number | string;
		baseprofile?: number | string;
		bbox?: number | string;
		begin?: number | string;
		bias?: number | string;
		by?: number | string;
		calcmode?: number | string;
		capheight?: number | string;
		clip?: number | string;
		clippath?: string;
		clippathunits?: number | string;
		cliprule?: number | string;
		colorinterpolation?: number | string;
		colorinterpolationfilters?: "auto" | "sRGB" | "linearRGB" | "inherit";
		colorprofile?: number | string;
		colorrendering?: number | string;
		contentscripttype?: number | string;
		contentstyletype?: number | string;
		cursor?: number | string;
		cx?: number | string;
		cy?: number | string;
		d?: string;
		decelerate?: number | string;
		descent?: number | string;
		diffuseconstant?: number | string;
		direction?: number | string;
		display?: number | string;
		divisor?: number | string;
		dominantbaseline?: number | string;
		dur?: number | string;
		dx?: number | string;
		dy?: number | string;
		edgemode?: number | string;
		elevation?: number | string;
		enablebackground?: number | string;
		end?: number | string;
		exponent?: number | string;
		externalresourcesrequired?: number | string;
		fill?: string;
		fillopacity?: number | string;
		fillrule?: "nonzero" | "evenodd" | "inherit";
		filter?: string;
		filterres?: number | string;
		filterunits?: number | string;
		floodcolor?: number | string;
		floodopacity?: number | string;
		focusable?: number | string;
		fontfamily?: string;
		fontsize?: number | string;
		fontsizeadjust?: number | string;
		fontstretch?: number | string;
		fontstyle?: number | string;
		fontvariant?: number | string;
		fontweight?: number | string;
		format?: number | string;
		from?: number | string;
		fx?: number | string;
		fy?: number | string;
		g1?: number | string;
		g2?: number | string;
		glyphname?: number | string;
		glyphorientationhorizontal?: number | string;
		glyphorientationvertical?: number | string;
		glyphref?: number | string;
		gradienttransform?: string;
		gradientunits?: string;
		hanging?: number | string;
		horizadvx?: number | string;
		horizoriginx?: number | string;
		ideographic?: number | string;
		imagerendering?: number | string;
		in2?: number | string;
		in?: string;
		intercept?: number | string;
		k1?: number | string;
		k2?: number | string;
		k3?: number | string;
		k4?: number | string;
		k?: number | string;
		kernelmatrix?: number | string;
		kernelunitlength?: number | string;
		kerning?: number | string;
		keypoints?: number | string;
		keysplines?: number | string;
		keytimes?: number | string;
		lengthadjust?: number | string;
		letterspacing?: number | string;
		lightingcolor?: number | string;
		limitingconeangle?: number | string;
		local?: number | string;
		markerend?: string;
		markerheight?: number | string;
		markermid?: string;
		markerstart?: string;
		markerunits?: number | string;
		markerwidth?: number | string;
		mask?: string;
		maskcontentunits?: number | string;
		maskunits?: number | string;
		mathematical?: number | string;
		mode?: number | string;
		numoctaves?: number | string;
		offset?: number | string;
		opacity?: number | string;
		operator?: number | string;
		order?: number | string;
		orient?: number | string;
		orientation?: number | string;
		origin?: number | string;
		overflow?: number | string;
		overlineposition?: number | string;
		overlinethickness?: number | string;
		paintorder?: number | string;
		panose1?: number | string;
		pathlength?: number | string;
		patterncontentunits?: string;
		patterntransform?: number | string;
		patternunits?: string;
		pointerevents?: number | string;
		points?: string;
		pointsatx?: number | string;
		pointsaty?: number | string;
		pointsatz?: number | string;
		preservealpha?: number | string;
		preserveaspectratio?: string;
		primitiveunits?: number | string;
		r?: number | string;
		radius?: number | string;
		refx?: number | string;
		refy?: number | string;
		renderingintent?: number | string;
		repeatcount?: number | string;
		repeatdur?: number | string;
		requiredextensions?: number | string;
		requiredfeatures?: number | string;
		restart?: number | string;
		result?: string;
		rotate?: number | string;
		rx?: number | string;
		ry?: number | string;
		scale?: number | string;
		seed?: number | string;
		shaperendering?: number | string;
		slope?: number | string;
		spacing?: number | string;
		specularconstant?: number | string;
		specularexponent?: number | string;
		speed?: number | string;
		spreadmethod?: string;
		startoffset?: number | string;
		stddeviation?: number | string;
		stemh?: number | string;
		stemv?: number | string;
		stitchtiles?: number | string;
		stopcolor?: string;
		stopopacity?: number | string;
		strikethroughposition?: number | string;
		strikethroughthickness?: number | string;
		string?: number | string;
		stroke?: string;
		strokedasharray?: string | number;
		strokedashoffset?: string | number;
		strokelinecap?: "butt" | "round" | "square" | "inherit";
		strokelinejoin?: "miter" | "round" | "bevel" | "inherit";
		strokemiterlimit?: string;
		strokeopacity?: number | string;
		strokewidth?: number | string;
		surfacescale?: number | string;
		systemlanguage?: number | string;
		tablevalues?: number | string;
		targetx?: number | string;
		targety?: number | string;
		textanchor?: string;
		textdecoration?: number | string;
		textlength?: number | string;
		textrendering?: number | string;
		to?: number | string;
		transform?: string;
		u1?: number | string;
		u2?: number | string;
		underlineposition?: number | string;
		underlinethickness?: number | string;
		unicode?: number | string;
		unicodebidi?: number | string;
		unicoderange?: number | string;
		unitsperem?: number | string;
		valphabetic?: number | string;
		values?: string;
		vectoreffect?: number | string;
		version?: string;
		vertadvy?: number | string;
		vertoriginx?: number | string;
		vertoriginy?: number | string;
		vhanging?: number | string;
		videographic?: number | string;
		viewbox?: string;
		viewtarget?: number | string;
		visibility?: number | string;
		vmathematical?: number | string;
		widths?: number | string;
		wordspacing?: number | string;
		writingmode?: number | string;
		x1?: number | string;
		x2?: number | string;
		x?: number | string;
		xchannelselector?: string;
		xheight?: number | string;
		xlinkactuate?: string;
		xlinkarcrole?: string;
		xlinkhref?: string;
		xlinkrole?: string;
		xlinkshow?: string;
		xlinktitle?: string;
		xlinktype?: string;
		xmlbase?: string;
		xmllang?: string;
		xmlns?: string;
		xmlnsxlink?: string;
		xmlspace?: string;
		y1?: number | string;
		y2?: number | string;
		y?: number | string;
		ychannelselector?: string;
		z?: number | string;
		zoomandpan?: string;
  }

  export
	interface IntrinsicElements {
		// HTML
		a: HTMLAttributes;
		abbr: HTMLAttributes;
		address: HTMLAttributes;
		area: HTMLAttributes;
		article: HTMLAttributes;
		aside: HTMLAttributes;
		audio: HTMLAttributes;
		b: HTMLAttributes;
		base: HTMLAttributes;
		bdi: HTMLAttributes;
		bdo: HTMLAttributes;
		big: HTMLAttributes;
		blockquote: HTMLAttributes;
		body: HTMLAttributes;
		br: HTMLAttributes;
		button: HTMLAttributes;
		canvas: HTMLAttributes;
		caption: HTMLAttributes;
		cite: HTMLAttributes;
		code: HTMLAttributes;
		col: HTMLAttributes;
		colgroup: HTMLAttributes;
		data: HTMLAttributes;
		datalist: HTMLAttributes;
		dd: HTMLAttributes;
		del: HTMLAttributes;
		details: HTMLAttributes;
		dfn: HTMLAttributes;
		dialog: HTMLAttributes;
		div: HTMLAttributes;
		dl: HTMLAttributes;
		dt: HTMLAttributes;
		em: HTMLAttributes;
		embed: HTMLAttributes;
		fieldset: HTMLAttributes;
		figcaption: HTMLAttributes;
		figure: HTMLAttributes;
		footer: HTMLAttributes;
		form: HTMLAttributes;
		h1: HTMLAttributes;
		h2: HTMLAttributes;
		h3: HTMLAttributes;
		h4: HTMLAttributes;
		h5: HTMLAttributes;
		h6: HTMLAttributes;
		head: HTMLAttributes;
		header: HTMLAttributes;
		hgroup: HTMLAttributes;
		hr: HTMLAttributes;
		html: HTMLAttributes;
		i: HTMLAttributes;
		iframe: HTMLAttributes;
		img: HTMLAttributes;
		input: HTMLAttributes;
		ins: HTMLAttributes;
		kbd: HTMLAttributes;
		keygen: HTMLAttributes;
		label: HTMLAttributes;
		legend: HTMLAttributes;
		li: HTMLAttributes;
		link: HTMLAttributes;
		main: HTMLAttributes;
		map: HTMLAttributes;
		mark: HTMLAttributes;
		menu: HTMLAttributes;
		menuitem: HTMLAttributes;
		meta: HTMLAttributes;
		meter: HTMLAttributes;
		nav: HTMLAttributes;
		noscript: HTMLAttributes;
		object: HTMLAttributes;
		ol: HTMLAttributes;
		optgroup: HTMLAttributes;
		option: HTMLAttributes;
		output: HTMLAttributes;
		p: HTMLAttributes;
		param: HTMLAttributes;
		picture: HTMLAttributes;
		pre: HTMLAttributes;
		progress: HTMLAttributes;
		q: HTMLAttributes;
		rp: HTMLAttributes;
		rt: HTMLAttributes;
		ruby: HTMLAttributes;
		s: HTMLAttributes;
		samp: HTMLAttributes;
		script: HTMLAttributes;
		section: HTMLAttributes;
		select: HTMLAttributes;
		slot: HTMLAttributes;
		small: HTMLAttributes;
		source: HTMLAttributes;
		span: HTMLAttributes;
		strong: HTMLAttributes;
		style: HTMLAttributes;
		sub: HTMLAttributes;
		summary: HTMLAttributes;
		sup: HTMLAttributes;
		table: HTMLAttributes;
		tbody: HTMLAttributes;
		td: HTMLAttributes;
		textarea: HTMLAttributes;
		tfoot: HTMLAttributes;
		th: HTMLAttributes;
		thead: HTMLAttributes;
		time: HTMLAttributes;
		title: HTMLAttributes;
		tr: HTMLAttributes;
		track: HTMLAttributes;
		u: HTMLAttributes;
		ul: HTMLAttributes;
		"var": HTMLAttributes;
		video: HTMLAttributes;
		wbr: HTMLAttributes;

		//SVG
		svg: SVGAttributes;
		animate: SVGAttributes;
		circle: SVGAttributes;
		clipPath: SVGAttributes;
		defs: SVGAttributes;
		desc: SVGAttributes;
		ellipse: SVGAttributes;
		feBlend: SVGAttributes;
		feColorMatrix: SVGAttributes;
		feComponentTransfer: SVGAttributes;
		feComposite: SVGAttributes;
		feConvolveMatrix: SVGAttributes;
		feDiffuseLighting: SVGAttributes;
		feDisplacementMap: SVGAttributes;
		feFlood: SVGAttributes;
		feGaussianBlur: SVGAttributes;
		feImage: SVGAttributes;
		feMerge: SVGAttributes;
		feMergeNode: SVGAttributes;
		feMorphology: SVGAttributes;
		feOffset: SVGAttributes;
		feSpecularLighting: SVGAttributes;
		feTile: SVGAttributes;
		feTurbulence: SVGAttributes;
		filter: SVGAttributes;
		foreignObject: SVGAttributes;
		g: SVGAttributes;
		image: SVGAttributes;
		line: SVGAttributes;
		linearGradient: SVGAttributes;
		marker: SVGAttributes;
		mask: SVGAttributes;
		path: SVGAttributes;
		pattern: SVGAttributes;
		polygon: SVGAttributes;
		polyline: SVGAttributes;
		radialGradient: SVGAttributes;
		rect: SVGAttributes;
		stop: SVGAttributes;
		symbol: SVGAttributes;
		text: SVGAttributes;
		tspan: SVGAttributes;
		use: SVGAttributes;
	}
}

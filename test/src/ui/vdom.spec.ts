/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  VNode, h, realize, render
} from '../../../lib/ui/vdom';


describe('ui/vdom', () => {

  describe('VNode', () => {

    describe('#constructor()', () => {

      it('should create a text VNode', () => {
        let vnode = new VNode('text', 'foo', {}, []);
        expect(vnode).to.be.a(VNode);
      });

      it('should create an element VNode', () => {
        let vnode = new VNode('element', 'img', {}, []);
        expect(vnode).to.be.a(VNode);
      });

    });

    describe('#type', () => {

      it('should be the type of the node', () => {
        let vnode = new VNode('text', 'foo', {}, []);
        expect(vnode.type).to.be('text');
        vnode = new VNode('element', 'img', {}, []);
        expect(vnode.type).to.be('element');
      });

    });

    describe('#tag', () => {

      it('should be the text of a text type node', () => {
        let vnode = new VNode('text', 'foo', {}, []);
        expect(vnode.tag).to.be('foo');
      });

      it('should be the element tag name for an element type node', () => {
        let vnode = new VNode('element', 'img', {}, []);
        expect(vnode.tag).to.be('img');
      });

    });

    describe('#attrs', () => {

      it('should be the attrs given to the constructor', () => {
        let attrs = { foo: 'bar' };
        let vnode = new VNode('element', 'img', attrs, []);
        expect(vnode.attrs).to.be(attrs);
      });

    });

    describe('#children', () => {

      it('should be the child elements given to the constructor', () => {
        let children = [h.a(), h.img()];
        let vnode = new VNode('element', 'div', {}, children);
        expect(vnode.children).to.be(children);
      });

    });

  });

  describe('h()', () => {

    it('should create a new virtual DOM node', () => {
      let vnode = h('a');
      expect(vnode).to.be.a(VNode);
    });

    it('should accept string literals for children and convert them to text nodes', () => {
      let vnode = h('div', {}, ['foo', 'bar']);
      expect(vnode.children[0]).to.be.a(VNode);
      expect(vnode.children[0].type).to.be('text');
      expect(vnode.children[0].tag).to.be('foo');
      expect(vnode.children[1].type).to.be('text');
      expect(vnode.children[1].tag).to.be('bar');
    });

    it('should accept other virtual DOM nodes for children', () => {
      let children = [h('a'), h('img')];
      let vnode = h('div', {}, children);
      expect(vnode.children[0]).to.be(children[0]);
      expect(vnode.children[0].type).to.be('element');
      expect(vnode.children[0].tag).to.be('a');
      expect(vnode.children[1].type).to.be('element');
      expect(vnode.children[1].tag).to.be('img');
    });

    it('should accept a mix of string literals and virtual DOM nodes', () => {
      let children = ['foo', h('img')];
      let vnode = h('div', {}, children);
      expect(vnode.children[1]).to.be(children[1]);
      expect(vnode.children[0].type).to.be('text');
      expect(vnode.children[0].tag).to.be('foo');
      expect(vnode.children[1].type).to.be('element');
      expect(vnode.children[1].tag).to.be('img');
    });

    it('should ignore `null` child values', () => {
      let children = ['foo', null, h('img')];
      let vnode = h('div', {}, children);
      expect(vnode.children[1]).to.be(children[2]);
      expect(vnode.children[0].type).to.be('text');
      expect(vnode.children[0].tag).to.be('foo');
      expect(vnode.children[1].type).to.be('element');
      expect(vnode.children[1].tag).to.be('img');
    });

    it('should accept a string as the second argument', () => {
      let vnode = h('div', 'foo');
      expect(vnode.children[0].type).to.be('text');
      expect(vnode.children[0].tag).to.be('foo');
    });

    it('should accept a virtual node as the second argument', () => {
      let vnode = h('div', h('a'));
      expect(vnode.children[0].type).to.be('element');
      expect(vnode.children[0].tag).to.be('a');
    });

    it('should accept an array as the second argument', () => {
      let children = [h('a'), h('img')];
      let vnode = h('div', children);
      expect(vnode.children[0]).to.be(children[0]);
      expect(vnode.children[0].type).to.be('element');
      expect(vnode.children[0].tag).to.be('a');
      expect(vnode.children[1].type).to.be('element');
      expect(vnode.children[1].tag).to.be('img');
    });

    it('should accept other nodes as variadic args', () => {
      let vnode = h('div', h('a'), h('img'));
      expect(vnode.children[0].type).to.be('element');
      expect(vnode.children[0].tag).to.be('a');
      expect(vnode.children[1].type).to.be('element');
      expect(vnode.children[1].tag).to.be('img');
    });

    it('should set the attrs directly', () => {
      let attrs = { alt: 'foo', style: { color: 'black' },
                    dataset: { foo: 1 } };
      let vnode = h('img', attrs);
      expect(vnode.attrs).to.eql(attrs);
    });

  });

  describe('h', () => {

    it('should create the appropriate element tag', () => {
      let vnode = h.a();
      expect(vnode.tag).to.be('a');
      expect(h.abbr().tag).to.be('abbr');
      expect(h.address().tag).to.be('address');
      expect(h.area().tag).to.be('area');
      expect(h.article().tag).to.be('article');
      expect(h.aside().tag).to.be('aside');
      expect(h.audio().tag).to.be('audio');
      expect(h.b().tag).to.be('b');
      expect(h.bdi().tag).to.be('bdi');
      expect(h.bdo().tag).to.be('bdo');
      expect(h.blockquote().tag).to.be('blockquote');
      expect(h.br().tag).to.be('br');
      expect(h.button().tag).to.be('button');
      expect(h.canvas().tag).to.be('canvas');
      expect(h.caption().tag).to.be('caption');
      expect(h.cite().tag).to.be('cite');
      expect(h.code().tag).to.be('code');
      expect(h.col().tag).to.be('col');
      expect(h.colgroup().tag).to.be('colgroup');
      expect(h.data().tag).to.be('data');
      expect(h.datalist().tag).to.be('datalist');
      expect(h.dd().tag).to.be('dd');
      expect(h.del().tag).to.be('del');
      expect(h.dfn().tag).to.be('dfn');
      expect(h.div().tag).to.be('div');
      expect(h.dl().tag).to.be('dl');
      expect(h.dt().tag).to.be('dt');
      expect(h.em().tag).to.be('em');
      expect(h.embed().tag).to.be('embed');
      expect(h.fieldset().tag).to.be('fieldset');
      expect(h.figcaption().tag).to.be('figcaption');
      expect(h.figure().tag).to.be('figure');
      expect(h.footer().tag).to.be('footer');
      expect(h.form().tag).to.be('form');
      expect(h.h1().tag).to.be('h1');
      expect(h.h2().tag).to.be('h2');
      expect(h.h3().tag).to.be('h3');
      expect(h.h4().tag).to.be('h4');
      expect(h.h5().tag).to.be('h5');
      expect(h.h6().tag).to.be('h6');
      expect(h.header().tag).to.be('header');
      expect(h.hr().tag).to.be('hr');
      expect(h.i().tag).to.be('i');
      expect(h.iframe().tag).to.be('iframe');
      expect(h.img().tag).to.be('img');
      expect(h.input().tag).to.be('input');
      expect(h.ins().tag).to.be('ins');
      expect(h.kbd().tag).to.be('kbd');
      expect(h.label().tag).to.be('label');
      expect(h.legend().tag).to.be('legend');
      expect(h.li().tag).to.be('li');
      expect(h.main().tag).to.be('main');
      expect(h.map().tag).to.be('map');
      expect(h.mark().tag).to.be('mark');
      expect(h.meter().tag).to.be('meter');
      expect(h.nav().tag).to.be('nav');
      expect(h.noscript().tag).to.be('noscript');
      expect(h.object().tag).to.be('object');
      expect(h.ol().tag).to.be('ol');
      expect(h.optgroup().tag).to.be('optgroup');
      expect(h.option().tag).to.be('option');
      expect(h.output().tag).to.be('output');
      expect(h.p().tag).to.be('p');
      expect(h.param().tag).to.be('param');
      expect(h.pre().tag).to.be('pre');
      expect(h.progress().tag).to.be('progress');
      expect(h.q().tag).to.be('q');
      expect(h.rp().tag).to.be('rp');
      expect(h.rt().tag).to.be('rt');
      expect(h.ruby().tag).to.be('ruby');
      expect(h.s().tag).to.be('s');
      expect(h.samp().tag).to.be('samp');
      expect(h.section().tag).to.be('section');
      expect(h.select().tag).to.be('select');
      expect(h.small().tag).to.be('small');
      expect(h.source().tag).to.be('source');
      expect(h.span().tag).to.be('span');
      expect(h.strong().tag).to.be('strong');
      expect(h.sub().tag).to.be('sub');
      expect(h.summary().tag).to.be('summary');
      expect(h.sup().tag).to.be('sup');
      expect(h.table().tag).to.be('table');
      expect(h.tbody().tag).to.be('tbody');
      expect(h.td().tag).to.be('td');
      expect(h.textarea().tag).to.be('textarea');
      expect(h.tfoot().tag).to.be('tfoot');
      expect(h.th().tag).to.be('th');
      expect(h.thead().tag).to.be('thead');
      expect(h.time().tag).to.be('time');
      expect(h.title().tag).to.be('title');
      expect(h.tr().tag).to.be('tr');
      expect(h.track().tag).to.be('track');
      expect(h.u().tag).to.be('u');
      expect(h.ul().tag).to.be('ul');
      expect(h.var_().tag).to.be('var');
      expect(h.video().tag).to.be('video');
      expect(h.wbr().tag).to.be('wbr');
    });

  });

  describe('realize()', () => {

    it('should create a real DOM node from a virtual DOM node', () => {
      let node = realize(h.div([h.a(), h.img()]));
      expect(node.nodeName.toLowerCase()).to.be('div');
      expect(node.firstChild.nodeName.toLowerCase()).to.be('a');
      expect(node.lastChild.nodeName.toLowerCase()).to.be('img');
    });

  });

  describe('render()', () => {

    it('should render virtual DOM content into a host elememnt', () => {
      let host = document.createElement('div');
      render(h.img(), host);
      expect(host.firstChild.nodeName.toLowerCase()).to.be('img');
    });

    it('should render the delta from the previous rendering', () => {
      let host = document.createElement('div');
      let children = [h.a(), h.span(), h.img()];
      render(children, host);

      let first = host.firstChild;
      let last = host.lastChild;
      expect(first.nodeName.toLowerCase()).to.be('a');
      expect(last.nodeName.toLowerCase()).to.be('img');
      children = [children[0], new VNode('text', 'foo', {}, []), children[1]];
      render(children, host);
      expect(host.firstChild).to.be(first);
      expect(host.lastChild).to.not.be(last);
      expect(host.lastChild.nodeName.toLowerCase()).to.be('span');
    });

    it('should clear the rendering if `null` content is provided', () => {
      let host = document.createElement('div');
      render(h('div', ['bar', 'foo']), host);
      let div = host.firstChild as HTMLElement;
      expect(div.childNodes.length).to.be(2);
      render(null, host);
      expect(host.children.length).to.be(0);
    });

    it('should update attributes', () => {
      let host = document.createElement('div');
      let img = h.img({ alt: 'foo', height: 100, style: { color: 'white' },
                        dataset: { foo: 2, bar: 2 },
                        onload: () => { /* no-op */ },
                        srcset: 'foo' });
      let children = [h.a(), img];
      render(h('div', children), host);
      children[1] = h.img({ alt: 'bar', width: 100, style: { border: '1px' },
                            dataset: { bar: 1, baz: 3 }, sizes: 'baz' });
      render(h('div', children), host);
      expect((host.firstChild.lastChild as HTMLImageElement).alt).to.be('bar');
    });

    it('should not recreate a DOM node that moves if it has a key id', () => {
      let host = document.createElement('div');
      let children = [h.span({ key: '1' }), h.span({ key: '2' }),
                      h.span({ key: '3' }), h.span({ key: '4' })];
      render(children, host);
      let child = host.children[1];
      let newChildren = [children[0], children[2], children[1], children[3]];
      render(newChildren, host);
      let newChild = (host as HTMLElement).children[2];
      expect(child).to.be(newChild);
    });

    it('should still recreate the DOM node if the node type changes', () => {
      let host = document.createElement('div');
      let children = [h.span({ key: '1' }), h.span({ key: '2' }),
                      h.span({ key: '3' }), h.span({ key: '4' })];
      render(children, host);
      let child = host.children[1];
      let newChildren = [children[0], children[2], h.div({ key: '2' }),
                         children[3]];
      render(newChildren, host);
      let newChild = host.children[2];
      expect(child).to.not.be(newChild);
    });

    it('should handle a new keyed item', () => {
      let host = document.createElement('div');
      let children = [h.span({ key: '1' }), h.span({ key: '2' }),
                      h.span({ key: '3' }), h.span({ key: '4' })];
      render(children, host);
      let newChildren = children.slice();
      newChildren[3] = h.div({ key: '5' });
      render(newChildren, host);
      let newChild = host.lastChild;
      expect(newChild.nodeName.toLowerCase()).to.be('div');
    });

    it('should update the text of a text node', () => {
      let host = document.createElement('div');
      render(new VNode('text', 'foo', {}, []), host);
      let div = host.childNodes[0] as HTMLElement;
      expect(div.textContent).to.be('foo');
      render(new VNode('text', 'bar', {}, []), host);
      let newDiv = host.childNodes[0] as HTMLElement;
      expect(newDiv).to.be(div);
      expect(div.textContent).to.be('bar');
    });

  });

});

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  expect
} from 'chai';

import {
  VirtualDOM, VirtualElement, VirtualText, h
} from '@phosphor/virtualdom';


describe('@phosphor/virtualdom', () => {

  describe('VirtualText', () => {

    describe('#constructor()', () => {

      it('should create a virtual text node', () => {
        let vnode = new VirtualText('foo');
        expect(vnode).to.be.an.instanceof(VirtualText);
      });

    });

    describe('#type', () => {

      it('should be `text`', () => {
        let vnode = new VirtualText('foo');
        expect(vnode.type).to.equal('text');
      });

    });

    describe('#content', () => {

      it('should be the text content', () => {
        let vnode = new VirtualText('foo');
        expect(vnode.content).to.equal('foo');
      });

    });

  });

  describe('VirtualElement', () => {

    describe('#constructor()', () => {

      it('should create a virtual element node', () => {
        let vnode = new VirtualElement('img', {}, []);
        expect(vnode).to.be.an.instanceof(VirtualElement);
      });

    });

    describe('#type', () => {

      it('should be `element`', () => {
        let vnode = new VirtualElement('img', {}, []);
        expect(vnode.type).to.equal('element');
      });

    });

    describe('#tag', () => {

      it('should be the element tag name', () => {
        let vnode = new VirtualElement('img', {}, []);
        expect(vnode.tag).to.equal('img');
      });

    });

    describe('#attrs', () => {

      it('should be the element attrs', () => {
        let attrs = { className: 'bar' };
        let vnode = new VirtualElement('img', attrs, []);
        expect(vnode.attrs).to.deep.equal(attrs);
      });

    });

    describe('#children', () => {

      it('should be the element children', () => {
        let children = [h.a(), h.img()];
        let vnode = new VirtualElement('div', {}, children);
        expect(vnode.children).to.equal(children);
      });

    });

  });

  describe('h()', () => {

    it('should create a new virtual element node', () => {
      let vnode = h('a');
      expect(vnode).to.be.an.instanceof(VirtualElement);
    });

    it('should accept string literals for children and convert them to text nodes', () => {
      let vnode = h('div', {}, ['foo', 'bar']);
      expect(vnode.children[0]).to.be.an.instanceof(VirtualText);
      expect(vnode.children[1]).to.be.an.instanceof(VirtualText);
      expect(vnode.children[0].type).to.equal('text');
      expect(vnode.children[1].type).to.equal('text');
      expect((vnode.children[0] as VirtualText).content).to.equal('foo');
      expect((vnode.children[1] as VirtualText).content).to.equal('bar');
    });

    it('should accept other virtual DOM nodes for children', () => {
      let children = [h('a'), h('img')];
      let vnode = h('div', {}, children);
      expect(vnode.children[0]).to.equal(children[0]);
      expect(vnode.children[1]).to.equal(children[1]);
      expect(vnode.children[0].type).to.equal('element');
      expect(vnode.children[1].type).to.equal('element');
      expect((vnode.children[0] as VirtualElement).tag).to.equal('a');
      expect((vnode.children[1] as VirtualElement).tag).to.equal('img');
    });

    it('should accept a mix of string literals and virtual DOM nodes', () => {
      let children = ['foo', h('img')];
      let vnode = h('div', {}, children);
      expect(vnode.children[1]).to.equal(children[1]);
      expect(vnode.children[0].type).to.equal('text');
      expect((vnode.children[0] as VirtualText).content).to.equal('foo');
      expect(vnode.children[1].type).to.equal('element');
      expect((vnode.children[1] as VirtualElement).tag).to.equal('img');
    });

    it('should ignore `null` child values', () => {
      let children = ['foo', null, h('img')];
      let vnode = h('div', {}, children);
      expect(vnode.children[1]).to.equal(children[2]);
      expect(vnode.children[0].type).to.equal('text');
      expect((vnode.children[0] as VirtualText).content).to.equal('foo');
      expect(vnode.children[1].type).to.equal('element');
      expect((vnode.children[1] as VirtualElement).tag).to.equal('img');
    });

    it('should accept a string as the second argument', () => {
      let vnode = h('div', 'foo');
      expect(vnode.children[0].type).to.equal('text');
      expect((vnode.children[0] as VirtualText).content).to.equal('foo');
    });

    it('should accept a virtual node as the second argument', () => {
      let vnode = h('div', h('a'));
      expect(vnode.children[0].type).to.equal('element');
      expect((vnode.children[0] as VirtualElement).tag).to.equal('a');
    });

    it('should accept an array as the second argument', () => {
      let children = [h('a'), h('img')];
      let vnode = h('div', children);
      expect(vnode.children[0]).to.equal(children[0]);
      expect(vnode.children[0].type).to.equal('element');
      expect((vnode.children[0] as VirtualElement).tag).to.equal('a');
      expect(vnode.children[1].type).to.equal('element');
      expect((vnode.children[1] as VirtualElement).tag).to.equal('img');
    });

    it('should accept other nodes as variadic args', () => {
      let vnode = h('div', h('a'), h('img'));
      expect(vnode.children[0].type).to.equal('element');
      expect((vnode.children[0] as VirtualElement).tag).to.equal('a');
      expect(vnode.children[1].type).to.equal('element');
      expect((vnode.children[1] as VirtualElement).tag).to.equal('img');
    });

    it('should set the attrs directly', () => {
      let attrs = { style: { color: 'red' }, dataset: { a: '1' } };
      let vnode = h('img', attrs);
      expect(vnode.attrs).to.deep.equal(attrs);
    });

  });

  describe('h', () => {

    it('should create the appropriate element tag', () => {
      expect(h.a().tag).to.equal('a');
      expect(h.abbr().tag).to.equal('abbr');
      expect(h.address().tag).to.equal('address');
      expect(h.area().tag).to.equal('area');
      expect(h.article().tag).to.equal('article');
      expect(h.aside().tag).to.equal('aside');
      expect(h.audio().tag).to.equal('audio');
      expect(h.b().tag).to.equal('b');
      expect(h.bdi().tag).to.equal('bdi');
      expect(h.bdo().tag).to.equal('bdo');
      expect(h.blockquote().tag).to.equal('blockquote');
      expect(h.br().tag).to.equal('br');
      expect(h.button().tag).to.equal('button');
      expect(h.canvas().tag).to.equal('canvas');
      expect(h.caption().tag).to.equal('caption');
      expect(h.cite().tag).to.equal('cite');
      expect(h.code().tag).to.equal('code');
      expect(h.col().tag).to.equal('col');
      expect(h.colgroup().tag).to.equal('colgroup');
      expect(h.data().tag).to.equal('data');
      expect(h.datalist().tag).to.equal('datalist');
      expect(h.dd().tag).to.equal('dd');
      expect(h.del().tag).to.equal('del');
      expect(h.dfn().tag).to.equal('dfn');
      expect(h.div().tag).to.equal('div');
      expect(h.dl().tag).to.equal('dl');
      expect(h.dt().tag).to.equal('dt');
      expect(h.em().tag).to.equal('em');
      expect(h.embed().tag).to.equal('embed');
      expect(h.fieldset().tag).to.equal('fieldset');
      expect(h.figcaption().tag).to.equal('figcaption');
      expect(h.figure().tag).to.equal('figure');
      expect(h.footer().tag).to.equal('footer');
      expect(h.form().tag).to.equal('form');
      expect(h.h1().tag).to.equal('h1');
      expect(h.h2().tag).to.equal('h2');
      expect(h.h3().tag).to.equal('h3');
      expect(h.h4().tag).to.equal('h4');
      expect(h.h5().tag).to.equal('h5');
      expect(h.h6().tag).to.equal('h6');
      expect(h.header().tag).to.equal('header');
      expect(h.hr().tag).to.equal('hr');
      expect(h.i().tag).to.equal('i');
      expect(h.iframe().tag).to.equal('iframe');
      expect(h.img().tag).to.equal('img');
      expect(h.input().tag).to.equal('input');
      expect(h.ins().tag).to.equal('ins');
      expect(h.kbd().tag).to.equal('kbd');
      expect(h.label().tag).to.equal('label');
      expect(h.legend().tag).to.equal('legend');
      expect(h.li().tag).to.equal('li');
      expect(h.main().tag).to.equal('main');
      expect(h.map().tag).to.equal('map');
      expect(h.mark().tag).to.equal('mark');
      expect(h.meter().tag).to.equal('meter');
      expect(h.nav().tag).to.equal('nav');
      expect(h.noscript().tag).to.equal('noscript');
      expect(h.object().tag).to.equal('object');
      expect(h.ol().tag).to.equal('ol');
      expect(h.optgroup().tag).to.equal('optgroup');
      expect(h.option().tag).to.equal('option');
      expect(h.output().tag).to.equal('output');
      expect(h.p().tag).to.equal('p');
      expect(h.param().tag).to.equal('param');
      expect(h.pre().tag).to.equal('pre');
      expect(h.progress().tag).to.equal('progress');
      expect(h.q().tag).to.equal('q');
      expect(h.rp().tag).to.equal('rp');
      expect(h.rt().tag).to.equal('rt');
      expect(h.ruby().tag).to.equal('ruby');
      expect(h.s().tag).to.equal('s');
      expect(h.samp().tag).to.equal('samp');
      expect(h.section().tag).to.equal('section');
      expect(h.select().tag).to.equal('select');
      expect(h.small().tag).to.equal('small');
      expect(h.source().tag).to.equal('source');
      expect(h.span().tag).to.equal('span');
      expect(h.strong().tag).to.equal('strong');
      expect(h.sub().tag).to.equal('sub');
      expect(h.summary().tag).to.equal('summary');
      expect(h.sup().tag).to.equal('sup');
      expect(h.table().tag).to.equal('table');
      expect(h.tbody().tag).to.equal('tbody');
      expect(h.td().tag).to.equal('td');
      expect(h.textarea().tag).to.equal('textarea');
      expect(h.tfoot().tag).to.equal('tfoot');
      expect(h.th().tag).to.equal('th');
      expect(h.thead().tag).to.equal('thead');
      expect(h.time().tag).to.equal('time');
      expect(h.title().tag).to.equal('title');
      expect(h.tr().tag).to.equal('tr');
      expect(h.track().tag).to.equal('track');
      expect(h.u().tag).to.equal('u');
      expect(h.ul().tag).to.equal('ul');
      expect(h.var_().tag).to.equal('var');
      expect(h.video().tag).to.equal('video');
      expect(h.wbr().tag).to.equal('wbr');
    });

  });

  describe('VirtualDOM', () => {

    describe('realize()', () => {

      it('should create a real DOM node from a virtual DOM node', () => {
        let node = VirtualDOM.realize(h.div([h.a(), h.img()]));
        expect(node.nodeName.toLowerCase()).to.equal('div');
        expect(node.children[0].nodeName.toLowerCase()).to.equal('a');
        expect(node.children[1].nodeName.toLowerCase()).to.equal('img');
      });

    });

    describe('render()', () => {

      it('should render virtual DOM content into a host elememnt', () => {
        let host = document.createElement('div');
        VirtualDOM.render(h.img(), host);
        expect(host.children[0].nodeName.toLowerCase()).to.equal('img');
      });

      it('should render the delta from the previous rendering', () => {
        let host = document.createElement('div');
        let children = [h.a(), h.span(), h.img()];
        VirtualDOM.render(children, host);
        let first = host.children[0];
        let last = host.children[2];
        expect(first.nodeName.toLowerCase()).to.equal('a');
        expect(last.nodeName.toLowerCase()).to.equal('img');
        children = [children[0], h.div(), children[1]];
        VirtualDOM.render(children, host);
        expect(host.children[0]).to.equal(first);
        expect(host.children[2]).to.not.equal(last);
        expect(host.children[2].nodeName.toLowerCase()).to.equal('span');
      });

      it('should clear the rendering if `null` content is provided', () => {
        let host = document.createElement('div');
        VirtualDOM.render(h('div', ['bar', 'foo']), host);
        expect(host.children[0].childNodes.length).to.equal(2);
        VirtualDOM.render(null, host);
        expect(host.children.length).to.equal(0);
      });

      it('should update attributes', () => {
        let host = document.createElement('div');
        let attrs1 = {
          alt: 'foo', height: '100', style: { color: 'white' },
          dataset: { foo: '2', bar: '2' }, onload: () => { }, srcset: 'foo'
        };
        let attrs2 = {
          alt: 'bar', width: '100', style: { border: '1px' },
          dataset: { bar: '1', baz: '3' }, sizes: 'baz'
        };
        VirtualDOM.render([h.a(), h.img(attrs1)], host);
        VirtualDOM.render([h.a(), h.img(attrs2)], host);
        expect((host.children[1] as HTMLImageElement).alt).to.equal('bar');
      });

      it('should not recreate a DOM node that moves if it has a key id', () => {
        let host = document.createElement('div');
        let children1 = [
          h.span({ key: '1' }),
          h.span({ key: '2' }),
          h.span({ key: '3' }),
          h.span({ key: '4' })
        ];
        let children2 = [
          h.span({ key: '1' }),
          h.span({ key: '3' }),
          h.span({ key: '2' }),
          h.span({ key: '4' })
        ];
        VirtualDOM.render(children1, host);
        let child1 = host.children[1];
        let child2 = host.children[2];
        VirtualDOM.render(children2, host);
        expect(host.children[1]).to.equal(child2);
        expect(host.children[2]).to.equal(child1);
      });

      it('should still recreate the DOM node if the node type changes', () => {
        let host = document.createElement('div');
        let children1 = [
          h.span({ key: '1' }),
          h.span({ key: '2' }),
          h.span({ key: '3' }),
          h.span({ key: '4' })
        ];
        let children2 = [
          h.span({ key: '1' }),
          h.div({ key: '3' }),
          h.span({ key: '2' }),
          h.span({ key: '4' })
        ];
        VirtualDOM.render(children1, host);
        VirtualDOM.render(children2, host);
        expect(host.children[1].nodeName.toLowerCase()).to.equal('div');
      });

      it('should handle a new keyed item', () => {
        let host = document.createElement('div');
        let children1 = [
          h.span({ key: '1' }),
          h.span({ key: '2' }),
          h.span({ key: '3' }),
          h.span({ key: '4' })
        ];
        let children2 = [
          h.span({ key: '1' }),
          h.span({ key: '2' }),
          h.span({ key: '3' }),
          h.div({ key: '5' })
        ];
        VirtualDOM.render(children1, host);
        VirtualDOM.render(children2, host);
        expect(host.children[3].nodeName.toLowerCase()).to.equal('div');
      });

      it('should update the text of a text node', () => {
        let host = document.createElement('div');
        VirtualDOM.render(h.div('foo'), host);
        let div = host.children[0];
        expect(div.textContent).to.equal('foo');
        VirtualDOM.render(h.div('bar'), host);
        expect(host.children[0]).to.equal(div);
        expect(div.textContent).to.equal('bar');
      });

    });

  });

});

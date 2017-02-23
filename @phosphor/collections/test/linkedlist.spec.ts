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
  find, map, toArray
} from '@phosphor/algorithm';

import {
  LinkedList
} from '@phosphor/collections';


describe('@phosphor/collections', () => {

  describe('LinkedList', () => {

    describe('#constructor()', () => {
      let list = new LinkedList<number>();
      expect(list).to.be.an.instanceof(LinkedList);
    });

    describe('#isEmpty', () => {

      it('should be `true` for an empty list', () => {
        let list = new LinkedList<number>();
        expect(list.isEmpty).to.equal(true);
      });

      it('should be `false` for a non-empty list', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let list = LinkedList.from(data);
        expect(list.isEmpty).to.equal(false);
      });

    });

    describe('#length', () => {

      it('should be `0` for an empty list', () => {
        let list = new LinkedList<number>();
        expect(list.length).to.equal(0);
      });

      it('should equal the number of items in a list', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let list = LinkedList.from(data);
        expect(list.length).to.equal(data.length);
      });

    });

    describe('#first', () => {

      it('should be the first value in the list', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let list = LinkedList.from(data);
        expect(list.first).to.equal(data[0]);
      });

      it('should be `undefined` if the list is empty', () => {
        let list = new LinkedList<number>();
        expect(list.first).to.equal(undefined);
      });

    });

    describe('#last', () => {

      it('should be the last value in the list', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let list = LinkedList.from(data);
        expect(list.last).to.equal(data[data.length - 1]);
      });

      it('should be `undefined` if the list is empty', () => {
        let list = new LinkedList<number>();
        expect(list.last).to.equal(undefined);
      });

    });

    describe('#firstNode', () => {

      it('should be the first node in the list', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let list = LinkedList.from(data);
        expect(list.firstNode!.value).to.equal(data[0]);
      });

      it('should be `null` if the list is empty', () => {
        let list = new LinkedList<number>();
        expect(list.firstNode).to.equal(null);
      });

    });

    describe('#lastNode', () => {

      it('should be the last node in the list', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let list = LinkedList.from(data);
        expect(list.lastNode!.value).to.equal(data[data.length - 1]);
      });

      it('should be `null` if the list is empty', () => {
        let list = new LinkedList<number>();
        expect(list.lastNode).to.equal(null);
      });

    });

    describe('#iter()', () => {

      it('should return an iterator over the list values', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let list = LinkedList.from(data);
        let it1 = list.iter();
        let it2 = it1.clone();
        expect(it1.iter()).to.equal(it1);
        expect(it2.iter()).to.equal(it2);
        expect(toArray(it1)).to.deep.equal(data);
        expect(toArray(it2)).to.deep.equal(data);
      });

    });

    describe('#retro()', () => {

      it('should return a reverse iterator over the list values', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let reversed = data.slice().reverse();
        let list = LinkedList.from(data);
        let it1 = list.retro();
        let it2 = it1.clone();
        expect(it1.iter()).to.equal(it1);
        expect(it2.iter()).to.equal(it2);
        expect(toArray(it1)).to.deep.equal(reversed);
        expect(toArray(it2)).to.deep.equal(reversed);
      });

    });

    describe('#nodes()', () => {

      it('should return an iterator over the list nodes', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let list = LinkedList.from(data);
        let it1 = list.nodes();
        let it2 = it1.clone();
        let v1 = map(it1, n => n.value);
        let v2 = map(it2, n => n.value);
        expect(it1.iter()).to.equal(it1);
        expect(it2.iter()).to.equal(it2);
        expect(toArray(v1)).to.deep.equal(data);
        expect(toArray(v2)).to.deep.equal(data);
      });

    });

    describe('#retroNodes()', () => {

      it('should return a reverse iterator over the list nodes', () => {
        let data = [0, 1, 2, 3, 4, 5];
        let reversed = data.slice().reverse();
        let list = LinkedList.from(data);
        let it1 = list.retroNodes();
        let it2 = it1.clone();
        let v1 = map(it1, n => n.value);
        let v2 = map(it2, n => n.value);
        expect(it1.iter()).to.equal(it1);
        expect(it2.iter()).to.equal(it2);
        expect(toArray(v1)).to.deep.equal(reversed);
        expect(toArray(v2)).to.deep.equal(reversed);
      });

    });

    describe('#addFirst()', () => {

      it('should add a value to the beginning of the list', () => {
        let list = new LinkedList<number>();

        expect(list.isEmpty).to.equal(true);
        expect(list.length).to.equal(0);
        expect(list.first).to.equal(undefined);
        expect(list.last).to.equal(undefined);

        let n1 = list.addFirst(99);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(1);
        expect(list.first).to.equal(99);
        expect(list.last).to.equal(99);

        let n2 = list.addFirst(42);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(2);
        expect(list.first).to.equal(42);
        expect(list.last).to.equal(99);

        let n3 = list.addFirst(7);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(3);
        expect(list.first).to.equal(7);
        expect(list.last).to.equal(99);

        expect(toArray(list)).to.deep.equal([7, 42, 99]);

        expect(n1.list).to.equal(list);
        expect(n1.next).to.equal(null);
        expect(n1.prev).to.equal(n2);
        expect(n1.value).to.equal(99);

        expect(n2.list).to.equal(list);
        expect(n2.next).to.equal(n1);
        expect(n2.prev).to.equal(n3);
        expect(n2.value).to.equal(42);

        expect(n3.list).to.equal(list);
        expect(n3.next).to.equal(n2);
        expect(n3.prev).to.equal(null);
        expect(n3.value).to.equal(7);
      });

    });

    describe('#addLast()', () => {

      it('should add a value to the end of the list', () => {
        let list = new LinkedList<number>();

        expect(list.isEmpty).to.equal(true);
        expect(list.length).to.equal(0);
        expect(list.first).to.equal(undefined);
        expect(list.last).to.equal(undefined);

        let n1 = list.addLast(99);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(1);
        expect(list.first).to.equal(99);
        expect(list.last).to.equal(99);

        let n2 = list.addLast(42);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(2);
        expect(list.first).to.equal(99);
        expect(list.last).to.equal(42);

        let n3 = list.addLast(7);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(3);
        expect(list.first).to.equal(99);
        expect(list.last).to.equal(7);

        expect(toArray(list)).to.deep.equal([99, 42, 7]);

        expect(n1.list).to.equal(list);
        expect(n1.next).to.equal(n2);
        expect(n1.prev).to.equal(null);
        expect(n1.value).to.equal(99);

        expect(n2.list).to.equal(list);
        expect(n2.next).to.equal(n3);
        expect(n2.prev).to.equal(n1);
        expect(n2.value).to.equal(42);

        expect(n3.list).to.equal(list);
        expect(n3.next).to.equal(null);
        expect(n3.prev).to.equal(n2);
        expect(n3.value).to.equal(7);
      });

    });

    describe('#insertBefore()', () => {

      it('should insert a value before the given reference node', () => {
        let list = LinkedList.from([0, 1, 2, 3]);
        let n1 = find(list.nodes(), n => n.value === 2)!;

        let n2 = list.insertBefore(7, n1);
        let n3 = list.insertBefore(8, n2);
        let n4 = list.insertBefore(9, null);

        let n5 = find(list.nodes(), n => n.value === 1);
        let n6 = find(list.nodes(), n => n.value === 0);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(7);
        expect(list.first).to.equal(9);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([9, 0, 1, 8, 7, 2, 3]);

        expect(n1.list).to.equal(list);
        expect(n1.next).to.equal(list.lastNode);
        expect(n1.prev).to.equal(n2);
        expect(n1.value).to.equal(2);

        expect(n2.list).to.equal(list);
        expect(n2.next).to.equal(n1);
        expect(n2.prev).to.equal(n3);
        expect(n2.value).to.equal(7);

        expect(n3.list).to.equal(list);
        expect(n3.next).to.equal(n2);
        expect(n3.prev).to.equal(n5);
        expect(n3.value).to.equal(8);

        expect(n4.list).to.equal(list);
        expect(n4.next).to.equal(n6);
        expect(n4.prev).to.equal(null);
        expect(n4.value).to.equal(9);
      });

      it('should throw an error if the reference node is invalid', () => {
        let list1 = LinkedList.from([0, 1, 2, 3]);
        let list2 = LinkedList.from([0, 1, 2, 3]);
        let insert = () => { list2.insertBefore(4, list1.firstNode ); };
        expect(insert).to.throw(Error);
      });

    });

    describe('#insertAfter()', () => {

      it('should insert a value after the given reference node', () => {
        let list = LinkedList.from([0, 1, 2, 3]);
        let n1 = find(list.nodes(), n => n.value === 2)!;

        let n2 = list.insertAfter(7, n1);
        let n3 = list.insertAfter(8, n2);
        let n4 = list.insertAfter(9, null);

        let n5 = find(list.nodes(), n => n.value === 1);
        let n6 = find(list.nodes(), n => n.value === 3);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(7);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(9);
        expect(toArray(list)).to.deep.equal([0, 1, 2, 7, 8, 3, 9]);

        expect(n1.list).to.equal(list);
        expect(n1.next).to.equal(n2);
        expect(n1.prev).to.equal(n5);
        expect(n1.value).to.equal(2);

        expect(n2.list).to.equal(list);
        expect(n2.next).to.equal(n3);
        expect(n2.prev).to.equal(n1);
        expect(n2.value).to.equal(7);

        expect(n3.list).to.equal(list);
        expect(n3.next).to.equal(n6);
        expect(n3.prev).to.equal(n2);
        expect(n3.value).to.equal(8);

        expect(n4.list).to.equal(list);
        expect(n4.next).to.equal(null);
        expect(n4.prev).to.equal(n6);
        expect(n4.value).to.equal(9);
      });

      it('should throw an error if the reference node is invalid', () => {
        let list1 = LinkedList.from([0, 1, 2, 3]);
        let list2 = LinkedList.from([0, 1, 2, 3]);
        let insert = () => { list2.insertAfter(4, list1.firstNode ); };
        expect(insert).to.throw(Error);
      });

    });

    describe('#removeFirst()', () => {

      it('should remove the first value from the list', () => {
        let list = LinkedList.from([0, 1, 2, 3]);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(4);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([0, 1, 2, 3]);

        let v1 = list.removeFirst();

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(3);
        expect(list.first).to.equal(1);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([1, 2, 3]);

        let v2 = list.removeFirst();

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(2);
        expect(list.first).to.equal(2);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([2, 3]);

        let v3 = list.removeFirst();

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(1);
        expect(list.first).to.equal(3);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([3]);

        let v4 = list.removeFirst();

        expect(list.isEmpty).to.equal(true);
        expect(list.length).to.equal(0);
        expect(list.first).to.equal(undefined);
        expect(list.last).to.equal(undefined);
        expect(toArray(list)).to.deep.equal([]);

        let v5 = list.removeFirst();

        expect(list.isEmpty).to.equal(true);
        expect(list.length).to.equal(0);
        expect(list.first).to.equal(undefined);
        expect(list.last).to.equal(undefined);
        expect(toArray(list)).to.deep.equal([]);

        expect(v1).to.equal(0);
        expect(v2).to.equal(1);
        expect(v3).to.equal(2);
        expect(v4).to.equal(3);
        expect(v5).to.equal(undefined);
      });

    });

    describe('#removeLast()', () => {

      it('should remove the last value from the list', () => {
        let list = LinkedList.from([0, 1, 2, 3]);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(4);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([0, 1, 2, 3]);

        let v1 = list.removeLast();

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(3);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(2);
        expect(toArray(list)).to.deep.equal([0, 1, 2]);

        let v2 = list.removeLast();

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(2);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(1);
        expect(toArray(list)).to.deep.equal([0, 1]);

        let v3 = list.removeLast();

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(1);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(0);
        expect(toArray(list)).to.deep.equal([0]);

        let v4 = list.removeLast();

        expect(list.isEmpty).to.equal(true);
        expect(list.length).to.equal(0);
        expect(list.first).to.equal(undefined);
        expect(list.last).to.equal(undefined);
        expect(toArray(list)).to.deep.equal([]);

        let v5 = list.removeLast();

        expect(list.isEmpty).to.equal(true);
        expect(list.length).to.equal(0);
        expect(list.first).to.equal(undefined);
        expect(list.last).to.equal(undefined);
        expect(toArray(list)).to.deep.equal([]);

        expect(v1).to.equal(3);
        expect(v2).to.equal(2);
        expect(v3).to.equal(1);
        expect(v4).to.equal(0);
        expect(v5).to.equal(undefined);
      });

    });

    describe('#removeNode()', () => {

      it('should remove the specified node from the list', () => {
        let list = LinkedList.from([0, 1, 2, 3]);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(4);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([0, 1, 2, 3]);

        let n1 = find(list.nodes(), n => n.value === 2)!;
        list.removeNode(n1);
        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(3);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([0, 1, 3]);
        expect(n1.list).to.equal(null);
        expect(n1.next).to.equal(null);
        expect(n1.prev).to.equal(null);
        expect(n1.value).to.equal(2);

        let n2 = find(list.nodes(), n => n.value === 3)!;
        list.removeNode(n2);
        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(2);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(1);
        expect(toArray(list)).to.deep.equal([0, 1]);
        expect(n2.list).to.equal(null);
        expect(n2.next).to.equal(null);
        expect(n2.prev).to.equal(null);
        expect(n2.value).to.equal(3);

        let n3 = find(list.nodes(), n => n.value === 0)!;
        list.removeNode(n3);
        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(1);
        expect(list.first).to.equal(1);
        expect(list.last).to.equal(1);
        expect(toArray(list)).to.deep.equal([1]);
        expect(n3.list).to.equal(null);
        expect(n3.next).to.equal(null);
        expect(n3.prev).to.equal(null);
        expect(n3.value).to.equal(0);

        let n4 = find(list.nodes(), n => n.value === 1)!;
        list.removeNode(n4);
        expect(list.isEmpty).to.equal(true);
        expect(list.length).to.equal(0);
        expect(list.first).to.equal(undefined);
        expect(list.last).to.equal(undefined);
        expect(toArray(list)).to.deep.equal([]);
        expect(n4.list).to.equal(null);
        expect(n4.next).to.equal(null);
        expect(n4.prev).to.equal(null);
        expect(n4.value).to.equal(1);
      });

    });

    describe('#clear()', () => {

      it('should remove all values from the list', () => {
        let list = LinkedList.from([0, 1, 2, 3]);

        expect(list.isEmpty).to.equal(false);
        expect(list.length).to.equal(4);
        expect(list.first).to.equal(0);
        expect(list.last).to.equal(3);
        expect(toArray(list)).to.deep.equal([0, 1, 2, 3]);

        list.clear();

        expect(list.isEmpty).to.equal(true);
        expect(list.length).to.equal(0);
        expect(list.first).to.equal(undefined);
        expect(list.last).to.equal(undefined);
        expect(toArray(list)).to.deep.equal([]);
      });

    });

    describe('.from()', () => {

      it('should initialize a list from an iterable', () => {
        let list1 = LinkedList.from([0, 1, 2, 3]);
        let list2 = LinkedList.from(list1);
        expect(list2.isEmpty).to.equal(false);
        expect(list2.length).to.equal(4);
        expect(list2.first).to.equal(0);
        expect(list2.last).to.equal(3);
        expect(toArray(list2)).to.deep.equal([0, 1, 2, 3]);
      });

    });

    describe('.ForwardValueIterator', () => {

      it('should create a forward iterator over the values', () => {
        let list = LinkedList.from([0, 1, 2, 3, 4]);
        let n = find(list.nodes(), n => n.value === 2)!;
        let it1 = new LinkedList.ForwardValueIterator(n);
        let it2 = it1.clone();
        expect(it1.iter()).to.equal(it1);
        expect(it2.iter()).to.equal(it2);
        expect(toArray(it1)).to.deep.equal([2, 3, 4]);
        expect(toArray(it2)).to.deep.equal([2, 3, 4]);
      });

    });

    describe('.RetroValueIterator', () => {

      it('should create a reverse iterator over the values', () => {
        let list = LinkedList.from([0, 1, 2, 3, 4]);
        let n = find(list.nodes(), n => n.value === 2)!;
        let it1 = new LinkedList.RetroValueIterator(n);
        let it2 = it1.clone();
        expect(it1.iter()).to.equal(it1);
        expect(it2.iter()).to.equal(it2);
        expect(toArray(it1)).to.deep.equal([2, 1, 0]);
        expect(toArray(it2)).to.deep.equal([2, 1, 0]);
      });

    });

    describe('.ForwardNodeIterator', () => {

      it('should create a forward iterator over the nodes', () => {
        let list = LinkedList.from([0, 1, 2, 3, 4]);
        let n = find(list.nodes(), n => n.value === 2)!;
        let it1 = new LinkedList.ForwardNodeIterator(n);
        let it2 = it1.clone();
        let v1 = map(it1, n => n.value);
        let v2 = map(it2, n => n.value);
        expect(it1.iter()).to.equal(it1);
        expect(it2.iter()).to.equal(it2);
        expect(toArray(v1)).to.deep.equal([2, 3, 4]);
        expect(toArray(v2)).to.deep.equal([2, 3, 4]);
      });

    });

    describe('.RetroNodeIterator', () => {

      it('should create a reverse iterator over the nodes', () => {
        let list = LinkedList.from([0, 1, 2, 3, 4]);
        let n = find(list.nodes(), n => n.value === 2)!;
        let it1 = new LinkedList.RetroNodeIterator(n);
        let it2 = it1.clone();
        let v1 = map(it1, n => n.value);
        let v2 = map(it2, n => n.value);
        expect(it1.iter()).to.equal(it1);
        expect(it2.iter()).to.equal(it2);
        expect(toArray(v1)).to.deep.equal([2, 1, 0]);
        expect(toArray(v2)).to.deep.equal([2, 1, 0]);
      });

    });

  });

});

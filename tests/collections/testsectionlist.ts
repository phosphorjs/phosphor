/*-----------------------------------------------------------------------------
| Copyright (c) 2015, Phosphor Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module tests {

import SectionList = phosphor.collections.SectionList;


describe('phosphor.collections - sectionlist', () => {

  describe('insert()', () => {

    it('should insert new sections into the list', () => {
      var obj = new SectionList();
      expect(obj.size).to.be(0);
      expect(obj.count).to.be(0);
      obj.insert(0, 100, 10);
      expect(obj.size).to.be(1000);
      expect(obj.count).to.be(100);
      expect(obj.sizeOf(50)).to.be(10);
      expect(obj.offsetOf(50)).to.be(500);
      expect(obj.indexOf(50)).to.be(5);
      obj.insert(0, 100, 0);  // add empty sections
      expect(obj.size).to.be(1000);
      expect(obj.count).to.be(200);
    });

    it('should offset from the end of the list for negative index', () => {
      var obj = new SectionList();
      obj.insert(0, 50, 20);
      obj.insert(-10, 75, 10);
      expect(obj.size).to.be(1750);
      expect(obj.count).to.be(125);
      expect(obj.sizeOf(0)).to.be(20);
      expect(obj.sizeOf(39)).to.be(20);
      expect(obj.sizeOf(40)).to.be(10);
    });

    it('should be clamped to the range `[0, list.count]`', () => {
      var obj = new SectionList();
      obj.insert(0, 50, 20);
      obj.insert(100, 75, 10);
      expect(obj.size).to.be(1750);
      expect(obj.count).to.be(125);
      expect(obj.sizeOf(0)).to.be(20);
      expect(obj.sizeOf(49)).to.be(20);
      expect(obj.sizeOf(100)).to.be(10);
      expect(obj.sizeOf(150)).to.be(-1);
      expect(obj.offsetOf(150)).to.be(-1);
    });

    it('should be a no-nop for count <= 0', () => {
      var obj = new SectionList();
      obj.insert(0, 0, 1000);
      expect(obj.size).to.be(0);
      expect(obj.count).to.be(0);
    });

    it('should clamp the size to the range `[0, Infinity]`', () => {
      var obj = new SectionList();
      obj.insert(0, 10, -10);
      expect(obj.size).to.be(0);
      expect(obj.count).to.be(10);
      obj.insert(0, 10, Infinity);
      expect(obj.count).to.be(20);
      expect(obj.size).to.be(Infinity);
    });

    it('should create list with variable sized sections', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.insert(10, 100, 20);
      expect(obj.size).to.be(3000);
      expect(obj.count).to.be(200);
      expect(obj.sizeOf(0)).to.be(10);
      expect(obj.sizeOf(10)).to.be(20);
      expect(obj.sizeOf(199)).to.be(10);
      expect(obj.offsetOf(20)).to.be(300);
    });

    it('should create another list with variable sized sections', () => {
      var obj = new SectionList();
      obj.insert(0, 75, 10);
      obj.insert(10, 75, 20);
      obj.insert(100, 100, 30);
      obj.insert(150, 150, 40);
      obj.insert(0, 100, 5);
      obj.insert(500, 50, 25);
      expect(obj.size).to.be(13000);
      expect(obj.count).to.be(550);
      expect(obj.sizeOf(0)).to.be(5);
      expect(obj.sizeOf(549)).to.be(25);
      expect(obj.sizeOf(125)).to.be(20);
      expect(obj.sizeOf(225)).to.be(30);
      expect(obj.sizeOf(300)).to.be(40);
      expect(obj.sizeOf(475)).to.be(10);
    });

  });


  describe('remove()', () => {

    it('should remove existing sections from the list', () => {
      var obj = new SectionList();
      expect(obj.size).to.be(0);
      expect(obj.count).to.be(0);
      obj.insert(0, 100, 10);
      obj.remove(0, 100);
      expect(obj.size).to.be(0);
      expect(obj.count).to.be(0);
      expect(obj.sizeOf(0)).to.be(-1);
      expect(obj.offsetOf(0)).to.be(-1);
      expect(obj.indexOf(0)).to.be(-1); 
    });

    it('should offset from the end of the list for negative index', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.insert(100, 30, 20);
      obj.remove(-20, 10);
      expect(obj.count).to.be(120);
      expect(obj.sizeOf(119)).to.be(20);
      obj.remove(-30, 10);
      expect(obj.count).to.be(110);
      expect(obj.sizeOf(109)).to.be(20);
    });

    it('should clamp sections to valid range', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.remove(-120, 30);
      expect(obj.count).to.be(90);
      obj.remove(80, 100);
      expect(obj.count).to.be(80);
      obj.remove(80, 100);
      expect(obj.count).to.be(80);
    });

    it('should be a no-op if count `<= 0`', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.remove(0, 0);
      expect(obj.count).to.be(100);
      obj.remove(0, -100);
      expect(obj.count).to.be(100);
    });

    it('should create list with variable sized sections', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.insert(10, 100, 20);
      obj.remove(20, 10);
      expect(obj.size).to.be(2800);
      expect(obj.count).to.be(190);
      obj.remove(150, 20);
      expect(obj.sizeOf(100)).to.be(10);
      expect(obj.sizeOf(50)).to.be(20);
    });

    it('should also end up empty', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.insert(10, 100, 20);
      obj.remove(125, 50);
      obj.remove(75, 50);
      obj.remove(25, 50);
      obj.remove(0, 50);
      expect(obj.count).to.be(0);
    });

  });


  describe('resize()', () => {

    it('should resize existing sections in the list', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.resize(50, 10, 20);
      obj.resize(110, 10, 30);  // no-op
      expect(obj.size).to.be(1100);
      expect(obj.sizeOf(50)).to.be(20);
      expect(obj.sizeOf(40)).to.be(10);
      expect(obj.sizeOf(60)).to.be(10);
    });

    it('should offset from the end of the list for negative index', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.resize(-50, 10, 20);
      expect(obj.size).to.be(1100);
      expect(obj.sizeOf(50)).to.be(20);
      expect(obj.sizeOf(40)).to.be(10);
      expect(obj.sizeOf(60)).to.be(10);
    });

    it('should clamp sections to valid range', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.resize(90, 20, 20);  // extends past the end of the list
      expect(obj.size).to.be(1100);
      expect(obj.count).to.be(100);
      expect(obj.sizeOf(89)).to.be(10);
      expect(obj.sizeOf(99)).to.be(20);
    });

    it('should be a no-op if count `<= 0`', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.resize(0, 0, 20);
      expect(obj.sizeOf(0)).to.be(10);
      obj.resize(0, -10, 20);
      expect(obj.sizeOf(99)).to.be(10);
      expect(obj.sizeOf(0)).to.be(10);
    });

  });


  describe('count', () => {

    it('should get the total number of sections in the list', () => {
      var obj = new SectionList();
      expect(obj.count).to.be(0);
      obj.insert(0, 100, 10);
      expect(obj.count).to.be(100);
      obj.remove(10, 10);
      expect(obj.count).to.be(90);
      obj.insert(100, 100, 20);
      expect(obj.count).to.be(190);
      obj.remove(0, 1000);
      expect(obj.count).to.be(0);
    });

  });


  describe('size', () => {

    it('should get the total size of all sections in the list.', () => {
      var obj = new SectionList();
      expect(obj.size).to.be(0);
      obj.insert(0, 100, 10);
      expect(obj.size).to.be(1000);
      obj.remove(10, 10);
      expect(obj.size).to.be(900);
      obj.insert(100, 100, 20);
      expect(obj.size).to.be(2900);
      obj.remove(0, 1000);
      expect(obj.size).to.be(0);
    });

  });


  describe('indexOf()', () => {

    it('should find the index of section which covers a given offset', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      expect(obj.indexOf(999)).to.be(99);
      obj.remove(10, 10);
      expect(obj.indexOf(11)).to.be(1);
      obj.insert(100, 100, 20);
      expect(obj.indexOf(189)).to.be(18);
      expect(obj.indexOf(500)).to.be(50);
    });

    it('should should return -1 if out of range', () => {
      var obj = new SectionList();
      expect(obj.indexOf(0)).to.be(-1);
      obj.insert(0, 100, 10);
      expect(obj.indexOf(1000)).to.be(-1);
      obj.remove(10, 10);
      expect(obj.indexOf(11)).to.be(1);
      obj.insert(100, 100, 20);
      expect(obj.indexOf(-10)).to.be(-1);
      obj.remove(0, 1000);
      expect(obj.indexOf(0)).to.be(-1);
    });

  });


  describe('offsetOf()', () => {

    it('should find the offset position of the section at the given index', () => {
      var obj = new SectionList();
      expect(obj.offsetOf(0)).to.be(-1);
      obj.insert(0, 100, 10);
      expect(obj.offsetOf(11)).to.be(110);
      obj.remove(10, 10);
      expect(obj.offsetOf(11)).to.be(110);
      obj.insert(100, 100, 20);
      expect(obj.offsetOf(189)).to.be(2880);
      expect(obj.offsetOf(-10)).to.be(2700);
      obj.remove(0, 1000);
      expect(obj.offsetOf(0)).to.be(-1);
    });

    it('should be taken as an offset from the end of the list', () => {
      var obj = new SectionList();
      expect(obj.offsetOf(0)).to.be(-1);
      obj.insert(0, 100, 10);
      expect(obj.offsetOf(-10)).to.be(900);
    });

    it('should return -1 if the index is out of range', () => {
      var obj = new SectionList();
      expect(obj.offsetOf(0)).to.be(-1);
      obj.insert(0, 100, 10);
      expect(obj.offsetOf(100)).to.be(-1);
      obj.remove(0, 1000);
      expect(obj.offsetOf(0)).to.be(-1);
    });

  });


  describe('sizeOf()', () => {

    it('should find the size of the section at the given index', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      expect(obj.sizeOf(11)).to.be(10);
      obj.remove(10, 10);
      expect(obj.sizeOf(89)).to.be(10);
      obj.insert(100, 100, 20);
      expect(obj.sizeOf(189)).to.be(20);
    });

    it('should be taken as an offset from the end of the list', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.insert(100, 100, 20);
      expect(obj.sizeOf(-10)).to.be(20);
    });

    it('should return -1 if the index is out of range', () => {
      var obj = new SectionList();
      expect(obj.sizeOf(0)).to.be(-1);
      obj.insert(0, 100, 10);
      expect(obj.sizeOf(100)).to.be(-1);
      obj.remove(0, 1000);
      expect(obj.sizeOf(0)).to.be(-1);
    });

  });

});

} // module tests

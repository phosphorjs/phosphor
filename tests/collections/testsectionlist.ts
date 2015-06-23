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

    it('should create a simple list', () => {
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
      obj.insert(0, 0, 1000);  // no-oop
      expect(obj.size).to.be(1000);
      expect(obj.count).to.be(200);
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

    it('should insert at end of list', () => {
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

    it('should insert near the end of the list', () => {
      var obj = new SectionList();
      obj.insert(0, 50, 20);
      obj.insert(-10, 75, 10);
      expect(obj.size).to.be(1750);
      expect(obj.count).to.be(125);
      expect(obj.sizeOf(0)).to.be(20);
      expect(obj.sizeOf(39)).to.be(20);
      expect(obj.sizeOf(40)).to.be(10);
    });

  });


  describe('remove()', () => {

    it('should end up empty', () => {
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
      obj.remove(25, 50);  // no-op
      obj.remove(0, 0);  // no-op
      obj.remove(0, 50);
      expect(obj.count).to.be(0);
    });

    it('should index from end of list', () => {
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

  });


  describe('resize()', () => {

    it('should resize the middle of the list', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.resize(50, 10, 20);
      obj.resize(110, 10, 30);  // no-op
      expect(obj.size).to.be(1100);
      expect(obj.sizeOf(50)).to.be(20);
      expect(obj.sizeOf(40)).to.be(10);
      expect(obj.sizeOf(60)).to.be(10);
    });

    it('should also resize the middle of the list', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.resize(-50, 10, 20);
      obj.resize(-50, 0, 30);  // no-op
      expect(obj.size).to.be(1100);
      expect(obj.sizeOf(50)).to.be(20);
      expect(obj.sizeOf(40)).to.be(10);
      expect(obj.sizeOf(60)).to.be(10);
    });

    it('should resize the end of the list', () => {
      var obj = new SectionList();
      obj.insert(0, 100, 10);
      obj.resize(90, 20, 20);  // extends past the end of the list
      expect(obj.size).to.be(1100);
      expect(obj.sizeOf(89)).to.be(10);
      expect(obj.sizeOf(99)).to.be(20);
    });
  });

});

} // module tests

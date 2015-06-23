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

    it('should insert at 0', () => {
      var obj = new SectionList();
      obj.insert(100, 75, 10);
      expect(obj.size).to.be(750);
      expect(obj.count).to.be(75);
      expect(obj.sizeOf(0)).to.be(10);
      expect(obj.sizeOf(74)).to.be(10);
      expect(obj.sizeOf(100)).to.be(-1);
      expect(obj.offsetOf(100)).to.be(-1);
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

});

} // module tests

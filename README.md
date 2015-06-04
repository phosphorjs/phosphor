Phosphor
========

Package Install
---------------

**Prerequisites**
- [bower](http://bower.io/) `npm install -g bower`

```bash
bower install phosphor
```


Source Build
------------

**Prerequisites**
- [git](http://git-scm.com/)
- [node](http://nodejs.org/)
- [gulp](http://gulpjs.com/) `npm install -g gulp`
- [tsd](https://github.com/DefinitelyTyped/tsd) `npm install -g tsd@next`

```bash
git clone https://github.com/phosphorjs/phosphor.git
cd phosphor
npm install
tsd reinstall -so
gulp
```

Output will be placed in the `/dist` directory.


Build Examples
--------------

Follow the source build instructions first.

```bash
gulp examples
```

Navigate to `index.html` of the example of interest.


Run Tests
---------

Follow the source build instructions first.

```bash
gulp tests
```

Navigate to `tests/index.html` to run the tests.


Supported Browsers
------------------
The browser versions which are currently *known to work* are listed below.
Earlier versions may also work, but come with no guarantees.

- IE 11
- Firefox 32+
- Chrome 38+

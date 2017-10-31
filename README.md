[![npm version](https://badge.fury.io/js/selenium-helpers.svg)](http://badge.fury.io/js/selenium-helpers)
[![Build Status](https://travis-ci.org/alykoshin/selenium-helpers.svg)](https://travis-ci.org/alykoshin/selenium-helpers)
[![Coverage Status](https://coveralls.io/repos/alykoshin/selenium-helpers/badge.svg?branch=master&service=github)](https://coveralls.io/github/alykoshin/selenium-helpers?branch=master)
[![Code Climate](https://codeclimate.com/github/alykoshin/selenium-helpers/badges/gpa.svg)](https://codeclimate.com/github/alykoshin/selenium-helpers)
[![Inch CI](https://inch-ci.org/github/alykoshin/selenium-helpers.svg?branch=master)](https://inch-ci.org/github/alykoshin/selenium-helpers)

[![Dependency Status](https://david-dm.org/alykoshin/selenium-helpers/status.svg)](https://david-dm.org/alykoshin/selenium-helpers#info=dependencies)
[![devDependency Status](https://david-dm.org/alykoshin/selenium-helpers/dev-status.svg)](https://david-dm.org/alykoshin/selenium-helpers#info=devDependencies)


# selenium-helpers

Set of helper functions for Selenium webdriver


If you have different needs regarding the functionality, please add a [feature request](https://github.com/alykoshin/selenium-helpers/issues).


## Installation

```sh
npm install --save selenium-helpers
```

## Usage

```js
const oneSecond = 1000;
const oneMinute = 60 * oneSecond;
const TIMEOUT = 2 * oneMinute;

const seleniumHelpers = require('selenium-helpers')({ timeout: TIMEOUT });

const url = 'http://some-login-page/';

/* return */ seleniumHelpers.buildChrome()
  .then((webDriver) => seleniumHelpers.openPage(url))
  .then(()   => seleniumHelpers.debug('* Login page is loading...'))
  .then((el) => seleniumHelpers.scrollAndType('#login', username) )
  .then((el) => seleniumHelpers.scrollAndType('#password', password) )
  .then((el) => seleniumHelpers.scrollAndClick('#') )
  .then(()   => seleniumHelpers.debug('* Username/password entered, waiting for home page...'))
  .then(()   => seleniumHelpers.waitForOneOfElements([
    By.css('#page-layout-1'),
    By.css('#page-layout-2'),
    By.css('#page-layout-3')
  ], TIMEOUT))
  .then(() => seleniumHelpers.debug('* Home page loaded.'))
  .catch((reason) => {
    console.log(reason);
    return Promise.reject(reason);
  })
;
```

## Methods

### buildChrome({ proxyConfig, chromeOptions })

Build the driver for Chrome using new clean Chrome profile. 

- `proxyConfig`   - optional: `{ host, port, username, password [, tempDir ] }`
- `chromeOptions` - optional; if set, chromeOptions will be used when build the Chrome's driver. 

returns `{Promise}`


### buildFirefox({ profilePath })

Build the driver for Firefox using new clean Firefox profile. 

- `profilePath` - `string` - optional, path to Firefox profile

returns `{Promise}`


### buildFirefoxWithProfile(firefoxProfilePath)

Build the driver for Firefox using existing Firefox profile defined by path `firefoxProfilePath`. 
 
returns `{Promise}`


### sleep(timeout)

Delay for `timeout` milliseconds


### scrollToBottom()

Scroll to the bottom of the page.


### scrollIntoView(webElementOrCssString)

Scroll to element defined as `webElement` or `string` css selector and click on it.


### scrollAndClick(webElementOrCssString)

Scroll to element defined as `webElement` or `string` css selector and then click on it.


### scrollAndType(webElementOrCssString)

Scroll to element defined as `webElement` or `string` css selector and then set its `value` property (as if `value` was typed in it).


### waitForOneOfElements(bySelectors, timeout, string)

Wait until one of several elements will appear on the page. 
Possible elements are defined by array `bySelectors` of `webdriver.By` selectors.

- `bySelectors` - array of `webdriver.By` selectors 
- `timeout`     - wait timeout  
- `string`      - optional string to output if fails 

Example:
```js
waitForOneOfElements([
    By.css('.element-class-1'),         
    By.css('#element-id-1'),                
    By.id('element-id-2'),                
    By.css('[name=some-name]')   
  ], TIMEOUT);
``` 

Full set of `By` selectors cn be found here: http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_By.html
      


### waitAndAct(actions)

Simple scripting-like function which allows to define:
- Wait rules to wait for several conditions simultaneously:
  - wait,    - CSS selector to wait;
  - waitText - Text to wait (anywhere on the whole page); 
  - waitJs   - Javascript expression to wait until evaluates to true.
- Actions to execute when some element defined by one of wait rules is found. Several actions may be combined. Actions in order of execution:
  - sleep   - pause (value in milliseconds); 
  - scroll  - scroll to element;
  - click   - click on the element; 
  - reload  - reload the page; 
  - cancel  - stop to wait and continue with the program execution.

Example:

```js
const ACTIONS = [
  { wait:  '.class1', click: '.button--to-click' }, // if this element found, click the button
  { wait:  '.class2', click: '.another-button'   }, // if other element found, click another button
  { wait:  '.class2', cancel: true },               // finish to wait
];
```

Action `click` is done in two phases: (1) scroll to element (2) click  

  
### clickAllDetails(cssToClick, xpathToParent, subCssToWait)

For each of elements defined by `cssToClick`:
- remember path to element's parent defined by `xpathToParent` (example: `'./../..'`);
- click the element
- wait util some element with `subCssToWait` will appear under the element's parent 

  
### openPage(url, actions)

Open page (using `driver.navigate().to(url)`), then execute `actions` (see `waitAndAct` for more info on actions)


### savePageSource(pathname)

Save value of `driver.getPageSource()` into file `pathname`


### saveOuterHTML(pathname)

Save value of `document.documentElement.outerHTML` into file `pathname`



## Debugging

This module uses standard [debug](https://www.npmjs.com/package/debug) with namespace `selenium-helpers`.
In order to get output to console you must set environment variable `DEBUG` to the value of namespace.  

Example for Linux:

    DEBUG=selenium-helpers <command-to-start>

Example for Windows:

    SET DEBUG=selenium-helpers
    <command-to-start>

Where `<command-to-start>` is the command starting the app i.e.: `node app.js` or `npm start` etc.

## Credits

[Alexander](https://github.com/alykoshin/)


# Links to package pages:

[github.com](https://github.com/alykoshin/selenium-helpers) &nbsp; [npmjs.com](https://www.npmjs.com/package/selenium-helpers) &nbsp; [travis-ci.org](https://travis-ci.org/alykoshin/selenium-helpers) &nbsp; [coveralls.io](https://coveralls.io/github/alykoshin/selenium-helpers) &nbsp; [inch-ci.org](https://inch-ci.org/github/alykoshin/selenium-helpers)


## License

MIT

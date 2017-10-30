'use strict';

//
// To turn debug on run the app with following command line:
//
// DEBUG=selenium-helpers <command-to-start>
//
const debug = require('debug')('selenium-helpers');

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const webdriver = require('selenium-webdriver');
const chrome    = require('selenium-webdriver/chrome');
const firefox   = require('selenium-webdriver/firefox');
//const Key = webdriver.Key;//,
const By = webdriver.By;//,
//const until = webdriver.until;//,

const promiseOne = require('promise-one');

const ProxyPlugin = require('selenium-chrome-proxy-plugin');

const oneSecond = 1000;
const oneMinute = 60 * oneSecond;
const DEFAULT_TIMEOUT = 2 * oneMinute;



class SeleniumUtils {

  constructor(options) {
    this.options = options || {};
    this.options.timeout = typeof this.options.timeout === 'undefined' ? DEFAULT_TIMEOUT : this.options.timeout;
    this.driver = null;
    this.proxyPlugin = null;
  }


  debug(...args) {
    debug(...args);
    return Promise.resolve();
  }


  buildChrome(config) {
    config = config || {};
    const options = config.options || new chrome.Options();

    if (config.proxyConfig) {
      return new ProxyPlugin({ proxyConfig: config.proxyConfig, options: options })
        .then((plugin) => {
          this.proxyPlugin = plugin;
          this.driver = new webdriver.Builder()
            .forBrowser('chrome')
            .setChromeOptions(plugin.options)
            .build()
          ;
          return this.driver;
        })
    } else {
      this.driver = new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build()
      return this.driver;
    }

  }

  buildFirefox(config) {
    config = config || {};
    const options = config.options || new firefox.Options();
    if (config.profilePath) {
      const profile = new firefox.Profile(config.profilePath);
      const options = options.setProfile(profile);
    }
    this.driver = new webdriver.Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build();
    return this.driver;
  }

  buildFirefoxWithProfile(profilePath) {
    return this.buildFirefox({ profilePath: profilePath });

    //const firefox   = require('selenium-webdriver/firefox');
    //const ffProfile = new firefox.Profile(profilePath);
    //const ffOptions = new firefox.Options()
    //  .setProfile(ffProfile);
    //this.driver = new webdriver.Builder()
    //  .forBrowser('firefox')
    //  .setFirefoxOptions(ffOptions)
    //  .build();
    //return this.driver;
    //return this.buildFirefox({ firefoxOptions: ffOptions });
  }

//

  sleep(timeout) {
    return new Promise((resolve, reject) => {
      debug(`sleep(${timeout}) - started`);
      setTimeout(() => {
        debug(`sleep(${timeout}) - done`);
        resolve(this);
      }, timeout);
    });
  }

  //

  /**
   * Scroll document to the bottom
   *
   * @returns {promise.Thenable.<T>|*}
   */
  scrollToBottom() {
    debug(`scrollIntoView(): before`);
    const script = 'return window.scrollTo(0, document.body.scrollHeight);';
    return this.driver.executeScript(script);
  }

  _findIfString(webElementOrCssString, fn, param) {
    debug(`_findIfString(): before`);
    if (typeof webElementOrCssString === 'string')
      return this.driver
        .findElement(By.css(webElementOrCssString))
        .then((el) => fn.call(this, el, param));
    else
      return fn.call(this, webElementOrCssString, param);
  }

  _scrollIntoView(webElement) {
    debug(`_scrollIntoView(): before`);
    const script = 'return arguments[0].scrollIntoView();';
    return this.driver.executeScript(script, webElement);
  }

  scrollIntoView(webElementOrCssString) {
    debug(`scrollIntoView(): before`);
    return this._findIfString(webElementOrCssString, this._scrollIntoView);
  }

  _elementClick(webElement) {
    debug(`_elementClick(): before`);
    const script = 'return arguments[0].click();';
    return this.driver.executeScript(script, webElement);
  }

  elementClick(webElementOrCssString) {
    debug(`scrollIntoView(): before`);
    return this._findIfString(webElementOrCssString, this._elementClick);
  }

  _elementType(webElement, value) {
    debug(`_elementType(): before`);
    const script = `return arguments[0].setAttribute("value", "${value}");`;
    return this.driver.executeScript(script, webElement);
  }

  elementType(webElementOrCssString, value) {
    debug(`elementType(): before`);
    return this._findIfString(webElementOrCssString, this._elementType, value);
  }

  scrollAndClick(webElementOrCssString) {
    debug(`scrollAndClick(): before`);
    return this.scrollIntoView(webElementOrCssString).then(() => {
      return this.elementClick(webElementOrCssString);
    });
  }

  scrollAndType(webElement, value) {
    debug(`scrollAndType(): before`);
    return this.scrollIntoView(webElement).then(() => {
      return this.elementType(webElement, value);
    });
  }

  //

  //todo what is this string for?
  // waitForOneOfElements takes multiple possible css selectors, and returns the element
  // corresponding to the first selector it finds in the page
  waitForOneOfElements(bySelectors, timeout, string) {
    debug('waitForOneOfElements(): bySelectors:', bySelectors);
    //todo does this.driver.wait takes string as 3rd parameter? what for?
    return this.driver.wait(
      // Wait function
      () => {
        //creating an array of promises corresponding to bySelectors array;
        let finders = bySelectors.map((def, index, array) => {
          // main wait function
          return this.driver.findElement(def).then((element) => {
            return { index, element };
          });
        });
        // passing finders array of promises to promiseOne
        // promiseOne is a promise that gets resolved when any of the array of promises resolves
        // or it rejects when all of the promises in array gets rejected;
        let oneOfPromise = promiseOne(finders);
        return oneOfPromise
          .then((elementWithIndex) => {
            return elementWithIndex;
          })
          .catch((reason) => {
            return null;
          });
      }
      // End of wait function
      , timeout, string);
  }

// `waitNew()` returns a wait element
// wait element takes multiple possible css selectors defined as `action` property
// wait element returns
// - `action`  - action definition (which has one of the css selectors as its property)
// - `element` - `element` found on the page
// - `index`   - index of `action` in `actions` array
  waitNew(actions, timeout, string) {
    debug('waitNew(): actions:', actions);
    return this.driver.wait(
      // Wait function
      () => {
        let finders      = actions.map((action, index, array) => {
          // main wait function
          if (action.wait) {
            return this.driver.findElement({ css: action.wait })
              .then((element) => {
                debug('waitNew(): found:', action, ', index:', index);
                return { action, element, index };
              });

          } else if (action.waitText) {
            return this.driver
              .getPageSource()
              .then((html) => {
                if (html.includes(action.waitText)) {
                  debug('waitNew(): html.includes(action.waitText): true');
                  return /*Promise.resolve(*/{
                    action,
                    element: action.waitText,
                    index
                  }/*)*/;
                } else {
                  debug('waitNew(): html.includes(action.waitText): false');
                  return Promise.reject();
                }
              });

          } else if (action.waitJs) {
            //const searchTextScript = `return { test: 'test-value' };`;
            return this.driver
            //.executeScript(searchTextScript)
              .executeScript(action.waitJs)
              .then((scriptResult) => {
                //debug('waitNew(): !!!!!!!!!!!!!!!!!!!!!!!!!! JS result:', scriptResult);
                return (scriptResult) ? /*Promise.resolve(*/{
                  action,
                  //element: null,
                  element: action.waitJs,
                  index
                }/*)*/ : Promise.reject();
              });
          } else
            return Promise.reject(`waitNew(): nor wait, nor waitText waitJs are defined for action: ${action}`);
        });
        // wait for first of Promises
        let oneOfPromise = promiseOne(finders);
        return oneOfPromise
          .then((actionElementIndex) => {
            return actionElementIndex;
          })
          .catch((reason) => {
            return null;
          });
      }
      // End of wait function
      , timeout, string);
  }


  _ifActionSleep(action) {
    debug('_ifActionSleep()');
    return action.sleep ? this.sleep(action.sleep) : Promise.resolve();
  }


//passes parameters to wait element returned from waitNew
  waitAndActOne(actions) {
    debug('waitAndActOne()');
    return this.waitNew(actions, this.options.timeout)//()
      .then(({ action, element, index }) => {

        if (element) {                 // if element was found
          debug('waitAndActOne(): element found, pausing if needed...');

          return this._ifActionSleep(action).then(() => {
            debug('waitAndActOne(): paused if required, checking further actions...');

            if (action.scroll) {          // ... and we need to scroll to it
              return this.driver.findElement({ css: action.scroll })
                .then((element) => {
                  debug('waitAndActOne(): wait element found, will scroll: index:', index);
                  return this.scrollIntoView(element);
                  //return element.click();
                })
                //.then((element) => element.click())
                .then(() => {
                  debug('waitAndActOne(): clicked: index:', index, ', action:', action);
                  return true;
                });
            } // if (action.scroll)

            if (action.click) {          // ... and we need to click on it
              return this.driver.findElement({ css: action.click })
                .then((element) => {
                  debug('waitAndActOne(): wait element found, will click: index:', index);
                  return this.scrollAndClick(element)
                  //return element.click();
                })
                //.then((element) => element.click())
                .then(() => {
                  debug('waitAndActOne(): clicked: index:', index, ', action:', action);
                  return true;
                });
            } // if (action.click)

            if (typeof action.reload !== 'undefined' && action.reload !== null && action.reload !== false) {
              if (typeof action.reload === 'number') {
                if (action.reload <= 0) return Promise.reject('waitAndActOne(): Maximum reload attempt exceeded');
                action.reload--;
              }
              debug('waitAndActOne(): element found, will reload: index:', index, ', action:', action);
              return this.driver.navigate().refresh() // reload current page
                .then(() => Promise.resolve(true)) // need to continue with same action
            } // action.reload

            if (action.cancel) {
              debug('waitAndActOne(): element found, will cancel: index:', index, ', action:', action);
              return Promise.resolve(false); // no need to click if this element
            } // action.cancel

            //todo what is this scenario?
            debug('waitAndActOne(): element found, but no actions defined: index:', index, ', action:', action);
            return Promise.resolve(true); // no actions defined for the element found - do nothing
          }); // ifActionSleep(action).then

        } // if (element)
        debug('waitAndActOne(): none of elements found', actions);
        return Promise.resolve(false); // need to wait more (if not timed out)
      });
  }


  waitAndAct(actions) {
    debug('waitAndAct(): enter');
    return this.waitAndActOne(actions)
      .then(result => {
        debug('waitAndAct(): result from waitAndActOne', result);
        return result ? this.waitAndAct(actions) : null; // go to recursion or return if `null` returned
      });
  }


  /**
   * Wait for one of elements defined by `bySelectors` and if the first in list
   * element was found, click on it
   *
   * @param bySelectors
   * @returns {*|Promise.<TResult>}
   */
  scrollOne(bySelectors) {
    debug('scrollOne()');
    return this.waitForOneOfElements(bySelectors, this.options.timeout)//()
      .then(function ({ element, index }) {
        if (element) {                 // if element was found
          if (index === 0) {           // ... and it is first in the list
            debug('scrollOne(): element found, will click: index:', index);//, '; element:', element);
            this.scrollAndClick(element);
            //element.click();           // click on it
            return true;
          }
          debug('scrollOne(): element found, no need to click: index:', index);
          return false; // no need to click if this element
        }
        debug('scrollOne(): none of elements found', bySelectors);
        return false;
      });
  }


  scrollEnd(bySelectors) {
    debug('scrollEnd()');
    return this.scrollOne(bySelectors)
      .then(result => result ? this.scrollEnd(bySelectors) : null);
  }


  clickAllDetails(cssToClick, xpathToParent, subCssToWait) {
    debug('clickAllDetails()');
    // Get a list of elements required to be clicked
    return this.driver.findElements({ css: cssToClick })
      .then((webElements) => {
        debug(`clickAllDetails(): found ${webElements.length} elements to click`);
        // iterate all elements to be clicked
        webElements.forEach((webElement, index) => {
          // store parent for current .get-details element
          let parent = webElement.findElement(By.xpath(xpathToParent)) // "./.."));

            .then(() => {
              //move to element
              //click on element
              debug(`clickAllDetails(): [${index}] before click`);
              //return this.driver.executeScript("arguments[0].scrollIntoView(); arguments[0].click()", webElement)
              this.scrollAndClick(webElement);
            })
            .then(() => {
              debug(`clickAllDetails(): [${index}] after click`);

              // now we'll wait until wait function return element (i.e.the element we are waiting will appear below the `parent` element)
              return this.driver.wait(
                // Wait function
                () => {
                  return parent.findElement({ css: subCssToWait }) // search for the details in parent of .get-details (which is already not accessible)
                    .then((element) => {
                      debug(`clickAllDetails(): [${index}] after wait (${subCssToWait})`);
                      return element;
                    })
                    .catch((reason) => {
                      return null; // This element (defined by `subCssToWait`) was not found, continue to search
                    })
                    ;
                }
                // End of wait function
                , this.options.timeout);

            });
        });
      });
  }


  openPage(url, actions) {
    debug('openPage(): url:', url);
    //return this.driver.get(url)
    return this.driver.navigate().to(url) // this is a bit faster than `.get(url)` as `.navigate().to(url)` does not waits until the page will be fully loaded
      .then(() => {
        if (actions && Array.isArray(actions) && actions.length > 0) return this.waitAndAct(actions);
        else return Promise.resolve();
      })
      ;
  };


  _saveHtml(pathname, html) {
    debug('_saveHtml(): pathname:', pathname);
    return new Promise((resolve, reject) => {
      mkdirp(path.dirname(pathname));
      fs.writeFile(pathname, html, function (err) {
        if (err) return reject(err);
        debug(`pageSource saved to ${pathname}`);
        return resolve(html);
      });
    });
  }

  savePageSource(pathname) {
    debug('savePageSource(): pathname:', pathname);
    //mkdirp.sync(path.dirname(pathname));
    return this.driver.getPageSource()
      .then((pageSource) => this._saveHtml(pathname, pageSource));
  }

  saveOuterHTML(pathname) {
    debug('saveOuterHTML(): pathname:', pathname);
    //mkdirp.sync(path.dirname(pathname));
    return this.driver.executeScript('return document.documentElement.outerHTML')
      .then((outerHTML) => this._saveHtml(pathname, outerHTML));
  }


}


module.exports = function(options) { return new SeleniumUtils(options); };

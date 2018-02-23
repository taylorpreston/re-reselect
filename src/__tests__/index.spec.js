/* eslint comma-dangle: 0 */
import {createSelector} from 'reselect';
import createCachedSelector, {FlatCacheObject} from '../index';

let resultFunc;

beforeEach(() => {
  resultFunc = jest.fn();
});

function selectorWithMockedResultFunc() {
  return createCachedSelector(resultFunc)(
    (arg1, arg2) => arg2 // Resolver
  );
}

describe('createCachedSelector', () => {
  it('Should use the same cached selector when resolver function returns the same string', () => {
    const cachedSelector = selectorWithMockedResultFunc();
    const firstCall = cachedSelector('foo', 'bar');
    const secondCallWithSameResolver = cachedSelector('foo', 'bar');

    expect(resultFunc).toHaveBeenCalledTimes(1);
  });

  it('Should create 2 different selectors when resolver function returns different strings', () => {
    const cachedSelector = selectorWithMockedResultFunc();
    const firstCallResult = cachedSelector('foo', 'bar');
    const secondCallWithDifferentResolver = cachedSelector('foo', 'moo');

    expect(resultFunc).toHaveBeenCalledTimes(2);
  });

  it('Should return "undefined" if provided resolver does not return a string or number', () => {
    const cachedSelector = selectorWithMockedResultFunc();
    const results = [
      cachedSelector('foo', {}),
      cachedSelector('foo', []),
      cachedSelector('foo', null),
      cachedSelector('foo', undefined),
    ];

    expect(resultFunc).toHaveBeenCalledTimes(0);

    results.forEach(result => expect(result).toBe(undefined));
  });

  it('Should allow resolver function to return keys of type number', () => {
    const cachedSelector = selectorWithMockedResultFunc();
    const firstCall = cachedSelector('foo', 1);
    const secondCall = cachedSelector('foo', 1);

    expect(resultFunc).toHaveBeenCalledTimes(1);
  });

  it('Should expose underlying reselect selector for a cache key with "getMatchingSelector"', () => {
    const cachedSelector = createCachedSelector(() => {})((arg1, arg2) => arg2);

    // Retrieve result from re-reselect cached selector
    const actualResult = cachedSelector('foo', 1);

    // Retrieve result directly calling underlying reselect selector
    const reselectSelector = cachedSelector.getMatchingSelector('foo', 1);
    const expectedResultFromSelector = reselectSelector('foo', 1);

    expect(actualResult).toBe(expectedResultFromSelector);
  });

  it('Should return "undefined" when "getMatchingSelector" doesn\'t hit any cache entry', () => {
    const cachedSelector = selectorWithMockedResultFunc();

    const actual = cachedSelector.getMatchingSelector('foo', 1);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  it('Should reset the cache when calling "clearCache"', () => {
    const cachedSelector = selectorWithMockedResultFunc();

    cachedSelector('foo', 1); // add to cache
    cachedSelector.clearCache(); // clear cache
    const actual = cachedSelector.getMatchingSelector('foo', 1);

    expect(actual).toBe(undefined);
  });

  it('Should set the selected key to "undefined" when calling "removeMatchingSelector"', () => {
    const cachedSelector = selectorWithMockedResultFunc();

    cachedSelector('foo', 1); // add to cache
    cachedSelector('foo', 2); // add to cache
    cachedSelector.removeMatchingSelector('foo', 1); // remove key from chache

    const firstSelectorActual = cachedSelector.getMatchingSelector('foo', 1);
    const secondSelectorActual = cachedSelector.getMatchingSelector('foo', 2);

    expect(firstSelectorActual).toBe(undefined);
    expect(secondSelectorActual).not.toBe(undefined);
  });

  it('resultFunc attribute should point to provided result function', () => {
    const cachedSelector = createCachedSelector(() => {}, resultFunc)(
      (arg1, arg2) => arg2
    );
    expect(cachedSelector.resultFunc).toBe(resultFunc);
  });

  it('Should accept a "selectorCreator" function as 2° argument', () => {
    const consoleWarnSpy = jest
      .spyOn(global.console, 'warn')
      .mockImplementation(() => {});
    const cachedSelector = createCachedSelector(resultFunc)(
      (arg1, arg2) => arg2,
      createSelector
    );

    expect(resultFunc).toHaveBeenCalledTimes(0);
    cachedSelector('foo', 'bar');
    cachedSelector('foo', 'bar');
    expect(resultFunc).toHaveBeenCalledTimes(1);

    consoleWarnSpy.mockReset();
    consoleWarnSpy.mockRestore();
  });

  it('Should cast a deprecation warning when "selectorCreator" is provided as 2° argument', () => {
    const consoleWarnSpy = jest
      .spyOn(global.console, 'warn')
      .mockImplementation(() => {});
    const cachedSelector = createCachedSelector(
      resultFunc
    )(() => {}, createSelector);

    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockReset();
    consoleWarnSpy.mockRestore();
  });

  it('Should accept an options object', () => {
    const cachedSelector = createCachedSelector(resultFunc)(
      (arg1, arg2) => arg2,
      {
        cacheObject: new FlatCacheObject(),
        selectorCreator: createSelector,
      }
    );

    expect(resultFunc).toHaveBeenCalledTimes(0);
    cachedSelector('foo', 'bar');
    cachedSelector('foo', 'bar');
    expect(resultFunc).toHaveBeenCalledTimes(1);
  });
});

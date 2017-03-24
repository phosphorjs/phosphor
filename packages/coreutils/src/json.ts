/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * A type alias for a JSON primitive.
 */
export
type JSONPrimitive = boolean | number | string | null;


/**
 * A type alias for a JSON value.
 */
export
type JSONValue = JSONPrimitive | JSONObject | JSONArray;


/**
 * A type definition for a JSON object.
 */
export
interface JSONObject { [key: string]: JSONValue | undefined; }


/**
 * A type definition for a JSON array.
 */
export
interface JSONArray extends Array<JSONValue> { }


/**
 * The namespace for JSON-specific functions.
 */
export
namespace JSONExt {
  /**
   * A shared frozen empty JSONObject
   */
  export
  const emptyObject = Object.freeze({}) as JSONObject;

  /**
   * A shared frozen empty JSONArray
   */
  export
  const emptyArray = Object.freeze([]) as any as JSONArray;

  /**
   * Test whether a JSON value is a primitive.
   *
   * @param value - The JSON value of interest.
   *
   * @returns `true` if the value is a primitive,`false` otherwise.
   */
  export
  function isPrimitive(value: JSONValue): value is JSONPrimitive {
    return (
      value === null ||
      typeof value === 'boolean' ||
      typeof value === 'number' ||
      typeof value === 'string'
    );
  }

  /**
   * Test whether a JSON value is an array.
   *
   * @param value - The JSON value of interest.
   *
   * @returns `true` if the value is a an array, `false` otherwise.
   */
  export
  function isArray(value: JSONValue): value is JSONArray {
    return Array.isArray(value);
  }

  /**
   * Test whether a JSON value is an object.
   *
   * @param value - The JSON value of interest.
   *
   * @returns `true` if the value is a an object, `false` otherwise.
   */
  export
  function isObject(value: JSONValue): value is JSONObject {
    return !isPrimitive(value) && !isArray(value);
  }

  /**
   * Compare two JSON values for deep equality.
   *
   * @param first - The first JSON value of interest.
   *
   * @param second - The second JSON value of interest.
   *
   * @returns `true` if the values are equivalent, `false` otherwise.
   */
  export
  function deepEqual(first: JSONValue, second: JSONValue): boolean {
    // Check referential and primitive equality first.
    if (first === second) {
      return true;
    }

    // If one is a primitive, the `===` check ruled out the other.
    if (isPrimitive(first) || isPrimitive(second)) {
      return false;
    }

    // Test whether they are arrays.
    let a1 = isArray(first);
    let a2 = isArray(second);

    // Bail if the types are different.
    if (a1 !== a2) {
      return false;
    }

    // If they are both arrays, compare them.
    if (a1 && a2) {
      return deepArrayEqual(first as JSONArray, second as JSONArray);
    }

    // At this point, they must both be objects.
    return deepObjectEqual(first as JSONObject, second as JSONObject);
  }

  /**
   * Create a deep copy of a JSON value.
   *
   * @param value - The JSON value to copy.
   *
   * @returns A deep copy of the given JSON value.
   */
  export
  function deepCopy(value: JSONPrimitive): JSONPrimitive;
  export
  function deepCopy(value: JSONArray): JSONArray;
  export
  function deepCopy(value: JSONObject): JSONObject;
  export
  function deepCopy(value: JSONValue): JSONValue;
  export
  function deepCopy(value: JSONValue): JSONValue {
    // Do nothing for primitive values.
    if (isPrimitive(value)) {
      return value;
    }

    // Deep copy an array.
    if (isArray(value)) {
      return deepArrayCopy(value);
    }

    // Deep copy an object.
    return deepObjectCopy(value);
  }

  /**
   * Compare two JSON arrays for deep equality.
   */
  function deepArrayEqual(first: JSONArray, second: JSONArray): boolean {
    // Check referential equality first.
    if (first === second) {
      return true;
    }

    // Test the arrays for equal length.
    if (first.length !== second.length) {
      return false;
    }

    // Compare the values for equality.
    for (let i = 0, n = first.length; i < n; ++i) {
      if (!deepEqual(first[i], second[i])) {
        return false;
      }
    }

    // At this point, the arrays are equal.
    return true;
  }

  /**
   * Compare two JSON objects for deep equality.
   */
  function deepObjectEqual(first: JSONObject, second: JSONObject): boolean {
    // Check referential equality first.
    if (first === second) {
      return true;
    }

    // Check for the first object's keys in the second object.
    for (let key in first) {
      if (!(key in second)) {
        return false;
      }
    }

    // Check for the second object's keys in the first object.
    for (let key in second) {
      if (!(key in first)) {
        return false;
      }
    }

    // Compare the values for equality.
    for (let key in first) {
      if (!deepEqual(first[key], second[key])) {
        return false;
      }
    }

    // At this point, the objects are equal.
    return true;
  }

  /**
   * Create a deep copy of a JSON array.
   */
  function deepArrayCopy(value: JSONArray): JSONArray {
    let result = new Array<JSONValue>(value.length);
    for (let i = 0, n = value.length; i < n; ++i) {
      result[i] = deepCopy(value[i]);
    }
    return result;
  }

  /**
   * Create a deep copy of a JSON object.
   */
  function deepObjectCopy(value: JSONObject): JSONObject {
    let result: JSONObject = {};
    for (let key in value) {
      result[key] = deepCopy(value[key]);
    }
    return result;
  }
}

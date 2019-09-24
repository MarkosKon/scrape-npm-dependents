// src/flatten.test.js

const flatten = require("./index");

describe("Flatten tests:", () => {
  it("Flattens an array.", () => {
    const nestedArray = [[1, 2, 3], [4]];
    const flatArray = [1, 2, 3, 4];
    expect(flatten(nestedArray)).toEqual(flatArray);
  });

  it("Returns empty array when the input is an empty array.", () => {
    const array = [];
    const result = flatten(array);
    const expectedResult = [];
    expect(result).toEqual(expectedResult);
  });
});

describe("Infinite nesting tests:", () => {
  it("Goes 4 levels deep.", () => {
    const nestedArray = [[1, 2, [3, [[4], 5]]], [6]];
    const flatArray = [1, 2, 3, 4, 5, 6];
    const result = flatten(nestedArray);
    expect(result).toEqual(flatArray);
  });
});

describe("Exact level tests:", () => {
  it("Goes exactly two levels deep.", () => {
    const nestedArray = [[1, [2, [3]], 4], [5]];
    const flatArray = [1, 2, [3], 4, 5];
    const result = flatten(nestedArray, 2);
    expect(result).toEqual(flatArray);
  });
});

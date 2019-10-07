const flatten = (array, level = 9999) => {
  if (!Array.isArray(array)) return array;
  const shouldGoDeeper = lvl => lvl + 1 <= level;
  const toFlat = lvl => (result, item) => {
    if (shouldGoDeeper(lvl) && Array.isArray(item))
      return item.reduce(toFlat(lvl + 1), result);
    return result.concat(item);
  };
  return array.reduce(toFlat(1), []);
};

module.exports = flatten;

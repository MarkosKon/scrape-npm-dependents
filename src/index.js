const fetch = require("node-fetch");
const cheerio = require("cheerio");
const difference = require("lodash.difference");
const orderBy = require("lodash.orderby");

// const packageName = "react";
const packageName = "react-swipeable-views";

const dependentURL = `https://www.npmjs.com/browse/depended/${packageName}`;

const maxResults = 300;

(async () => {
  /**
   * 1. Scrape the dependents for a package
   * from the NPM site.
   */
  async function getDependents(url, result = []) {
    const dependentsResult = await fetch(url);
    const dependentHtml = await dependentsResult.text();
    const $ = cheerio.load(dependentHtml);

    const dependents = $("h3")
      .map(function() {
        return $(this).text();
      })
      .get()
      .reverse()
      .slice(3);
    // eslint-disable-next-line no-param-reassign
    result = result.concat(dependents);

    const nextPage = $('a[href*="/browse/depended"]')
      .filter(function() {
        return $(this).text() === "Next Page";
      })
      .attr("href");

    // Debug console.log statement.
    console.log(nextPage || "Reached the end", result.length);
    if (nextPage && result.length <= maxResults)
      return getDependents(`https://www.npmjs.com${nextPage}`, result);

    return result;
  }
  const dependents = await getDependents(dependentURL);

  /**
   * 2. Separate the scoped packages from the others, because
   * the npm download count api doesn't support bulk downloads
   * for scoped packages.
   */
  const scopedDependents = dependents.filter(d => d.match(/@/));
  const unScopedDependents = difference(dependents, scopedDependents);

  const unScopedPromises = fetch(
    `https://api.npmjs.org/downloads/point/last-week/${unScopedDependents.join(
      ","
    )}`
  )
    .then(res => res.json())
    .then(json => Object.values(json));

  const scopedPromises = scopedDependents.map(scoped =>
    fetch(`https://api.npmjs.org/downloads/point/last-week/${scoped}`).then(
      res => res.json()
    )
  );

  const result = await Promise.all([unScopedPromises, ...scopedPromises]);
  const downloadCounts = result.reduce((acc, next) => acc.concat(next), []);
  const sortedDownloadCounts = orderBy(
    downloadCounts,
    ["downloads"],
    ["desc"]
  ).reduce((acc, next) => {
    acc[next.package] = next.downloads;
    return acc;
  }, {});
  // if you prefer it as an array, use the following instead of `reduce`.
  // .map(({ package, downloads }) => ({ package, downloads }));
  //   console.log(sortedDownloadCounts, sortedDownloadCounts.length);

  console.log(sortedDownloadCounts, Object.keys(sortedDownloadCounts).length);
})();

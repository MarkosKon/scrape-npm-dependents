const fetch = require("node-fetch");
const cheerio = require("cheerio");
const difference = require("lodash.difference");
const orderBy = require("lodash.orderby");
const chunk = require("lodash.chunk");
const { argv } = require("yargs")
  .usage("Usage: $0 [options]")
  .example(
    "$0 -p theme-ui",
    "Prints the download count of the packages that depend on theme-ui sorted by weekly download count."
  )
  // -p or --package-name.
  .alias("p", "package-name")
  .nargs("p", 1)
  .describe("p", "Package name.")
  .demandOption("p", "Provide a package name with -p package-name.")
  .string("p")
  // -h or --help.
  .alias("h", "help")
  // --version. Add a comma, lol.
  .describe("version", "Show version number.");

const flatten = require("./flatten");

const { packageName } = argv;
const dependentURL = `https://www.npmjs.com/browse/depended/${packageName}`;
const maxDependents = 300;

const checkStatus = res => {
  if (res.ok) return res;
  throw Error(res.statusText);
};

(async () => {
  /**
   * 1. Scrape the dependents for a package
   * from the NPM site.
   */
  async function getDependents(url, result = []) {
    const dependentsResult = await fetch(url)
      .then(checkStatus)
      .catch(err =>
        console.log(`Failed to get the dependents for URL ${url}:`, err)
      );
    const dependentHtml = await dependentsResult
      .text()
      .catch(err => console.log(`Failed to get the HTML for URL ${url}:`, err));

    const $ = cheerio.load(dependentHtml);

    const dependents = $("h3")
      .map(function toText() {
        return $(this).text();
      })
      .get()
      .reverse()
      .slice(3);
    // eslint-disable-next-line no-param-reassign
    result = result.concat(dependents);

    const nextPage = $('a[href*="/browse/depended"]')
      .filter(function hasNextPageButton() {
        return $(this).text() === "Next Page";
      })
      .attr("href");

    // Debug console.log statement.
    console.log(
      (dependents.length > 0 && nextPage) || "Reached the end",
      result.length
    );
    if (nextPage && dependents.length > 0 && result.length <= maxDependents)
      return getDependents(`https://www.npmjs.com${nextPage}`, result);

    return result;
  }
  const dependents = await getDependents(dependentURL).catch(err =>
    console.log(`Failed to get the dependents for ${packageName}`, err)
  );

  if (dependents.length === 0) {
    console.log(
      `The package ${packageName} has no dependents or doesn't exist.`
    );
    return;
  }

  /**
   * 2. Separate the scoped packages from the others because
   * the npm download count api doesn't support bulk downloads
   * for scoped packages.
   */
  const scopedDependents = dependents.filter(d => d.match(/@/));
  const unScopedDependents = difference(dependents, scopedDependents);

  // Bulk downloads count limit is 128.
  const unScopedPromises = chunk(unScopedDependents, 128).map(c =>
    fetch(`https://api.npmjs.org/downloads/point/last-week/${c.join(",")}`)
      .then(checkStatus)
      .then(res => res.json())
      .then(json => Object.values(json))
      .catch(err => {
        console.log(
          `Failed to get the download counts for the un-scoped packages.`
        );
        throw err;
      })
  );
  // They fail silently so I have to do this
  // if I want to know which failed.
  let failedUnscopedPackages;
  const unScopedPromisesFlattened = Promise.all(unScopedPromises)
    .then(res => flatten(res))
    .then(res => {
      const successes = res.filter(i => i).map(i => i.package);
      failedUnscopedPackages = difference(unScopedDependents, successes);
      return res;
    });

  const scopedPromises = scopedDependents.map(scoped =>
    fetch(`https://api.npmjs.org/downloads/point/last-week/${scoped}`)
      .then(checkStatus)
      .then(res => res.json())
      .catch(() => {
        console.log(
          `Failed to get the download counts for the scoped package: ${scoped}`
        );
        return { package: scoped, downloads: "Unknown" };
      })
  );

  const result = await Promise.all([
    unScopedPromisesFlattened,
    ...scopedPromises
  ]).catch(err => console.log(`Failed to get the download counts.`, err));
  const downloadCounts = result.reduce((acc, next) => acc.concat(next), []);
  const sortedDownloadCounts = orderBy(
    downloadCounts,
    ["downloads"],
    ["desc"]
  ).reduce((acc, next) => {
    if (next) acc[next.package] = next.downloads;
    return acc;
  }, {});

  if (failedUnscopedPackages.length > 0) {
    console.log(
      `The following un-scoped packages failed and are not included in the results ${failedUnscopedPackages.join(
        ", "
      )}`
    );
  }

  console.log(
    `The dependents of ${packageName} are:\n`,
    sortedDownloadCounts,
    Object.keys(sortedDownloadCounts).length
  );
})();

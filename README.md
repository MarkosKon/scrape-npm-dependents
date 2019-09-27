# NPM Dependents by downloads

A script that sorts by weekly downloads the dependents of a package. It's useful when you want to find popular packages that use a dependency to get usage ideas or good practices.

## Usage

- clone the repository
- `node src/index.js -p theme-ui`
- or `yarn start -p theme-ui`
- or `npm link` and `snd -p theme-ui`

Stops if the dependents are more than 300.

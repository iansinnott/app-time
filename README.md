# App Time

_Working title..._

> Build complete, wonderful, beautiful apps with one dependency. Compile to static HTML files with a single command.

## Usage

```
yarn add --dev app-time
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "start": "app-time start",
    "build": "app-time build"
  }
}
```

## Custom Configuration

**NOTE:** This project comes with defaults that may work for your project. Configuration should only be necessary once you need to customize something or add features not included by default.

If you need more control over how App Time is configured you can provide one or both of `apptime.config.dev.js` or `apptime.config.prod.js` files at the root of your project. If either of these files is detected App Time will read it and use it to generate the final webpack configuration.

Each of these files is _a lot_ like a standard `webpack.config.js` file except that it is defined as a function which must **return** the final wepback configuration. This allows you to customize only parts of the webpack configuration while maintaining other benefits of this project.

#### Example

If you wanted to specify an entry point for an `app` bundle which included `normalize.css` and `font-awesome` you could create a `apptime.config.dev.js` file at the root of your project like so:

```js
// apptime.config.dev.js
module.exports = (config, defaults) => ({
  ...config,
  entry: {
    app: [
      'normalize.css',
      'font-awesome/css/font-awesome.css',
      defaults.hmrEntry,
      './client/index.js',
    ],
  },
});
```

`defaults.hmrEntry` is the entry point that allows hot reloading to function, so be sure to include it.

#### Common Reasons to use a custom `apptime.config.js`:

* Add/modify app entrypoints
* Add new loaders or plugins

## Scripts

### `start`

Start a dev server at [localhost:3000](http://localhost:3000)

### `build`

Compile all project assets and generate static HTML files for each route in your react-router config.

## ⚠ Under Development ⚠

This project is under active development and this is just the initial version. There are still many things missing which would likely make it more appealing to a wider audience. For example:

* Not yet configurable / extensible
* Requires very specific file structure to work ([See react-static-boilerplate][rsb])

[rsb]: https://github.com/iansinnott/react-static-boilerplate

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
    "build": "app-time build",
    "setup": "app-time setup",
    "eject": "app-time eject"
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

You can also start the dev server using [webpack-dashboard](https://github.com/FormidableLabs/webpack-dashboard/) using the `--dashboard` flag. Example:

```
app-time start --dashboard
```

**NOTE:** There is no preferred way to run the dev server. If you like the dashboard then use it. If it's too much for you then stick to the minimal default version 😁.

### `build`

Compile all project assets and generate static HTML files for each route in your react-router config.

You can also generate a build report as well as a JSON stats file from the production webpack build using the `--analyze` flag. Example:

```
app-time build --analyze
```

This will generate an HTML report to `webpack-bundle-analyzer-report.html` as well as a stats file to `webpack-bundle-analyzer-stats.json`.

### `setup`

app-time uses the Webpack DLL plugin for super fast hot reloading. In order to do this Webpack needs to pre-compile the DLL file with your vendor dependencies. This is what `app-time setup` does. It's often convenient to place this script in the `postinstall` NPM hook so that Webpack will recompile your DLL file whenever you add new dependencies.

You can configure what libraries are included in the DLL using the `apptime.vendorLibs` field in your `package.json`. Example:

```json
"apptime": {
  "vendorLibs": [
    "react",
    "react-dom",
    "react-router"
  ]
}
```

app-time has some sane defaults for the `vendorLib` array but as you add more dependencies it would be a good idea to update this list.

### `eject`

Bring all configuration files in to your own app and remove the app-time dependency. This action cannot be undone, but you will find it useful if you need to do some really custom configuration. In that case app-time functions like a Webpack boilerplate—getting everything set up initially and then letting you take it from there.

Create React App is a similar project and does a good job of explaining "eject": https://github.com/facebookincubator/create-react-app#converting-to-a-custom-setup

If you just want to see what `eject` would do without the commitment you can pass the `--dry-run` flag and no files will actually be moved or written:

```
app-time eject --dry-run
```

## ⚠ Under Development ⚠

This project is under active development and this is just the initial version. There are still many things missing which would likely make it more appealing to a wider audience.

* This project requires a very specific file structure to work ([See react-static-boilerplate][rsb])

[rsb]: https://github.com/iansinnott/react-static-boilerplate

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

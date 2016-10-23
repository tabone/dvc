# Dependency Version Checker

## Installation

```bash
npm install --save dvc
```

```bash
npm install -g dvc
```

## Usage

### Command line

```bash
dvc [--registry <url>] [<pkg-name>[ <pkg-name>]]
```

 Flags   | Default                     | Description
-------- | --------------------------- | -----------
registry | https://registry.npmjs.org/ | Registry url

> When called without `pkg-name`, it will look for `package.json` in the current working directory.

### API

```javascript
const DVC = require('dvc')
const dvc = new DVC({
  registry: 'http://localhost/registry'
})

dvc.check('i18n-light', 'ipc-emitter')
  .then((info) => {
    console.info(info)
  })
```

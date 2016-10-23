#!/usr/bin/env node
'use strict'

const fs = require('fs')
const DVC = require('./index')
const argv = require('minimist')(process.argv.slice(2))

getModuleNames()
  .then(getOutdatedDeps)
  .catch((err) => {
    if (err.code === 'ENOENT') {
      console.log('usage:')
      console.log('  dvc [--registry <url>] [<pkg-name>[ <pkg-name>]]')
      console.log('  or call it within a node module')
    }
  })

function getModuleNames () {
  return new Promise((resolve, reject) => {
    if (argv._.length > 0) return resolve(argv._)

    fs.readFile(`${process.cwd()}/package.json`, (err, data) => {
      if (err) return reject(err)

      const packageJSON = JSON.parse(data)

      return resolve([packageJSON.name])
    })
  })
}

function getOutdatedDeps (moduleNames) {
  const config = {
    registry: argv.registry
  }

  const dvc = new DVC(config)

  console.info(`Checking the dependencies of: ${moduleNames.join(', ')}`)

  dvc.check.apply(dvc, moduleNames)
    .then((info) => {
      const modulesName = Object.keys(info)

      modulesName.forEach((moduleName) => {
        console.info(`+ ${moduleName}:`)

        info[moduleName].forEach((depEntry) => {
          const depName = Object.keys(depEntry)
          const dep = depEntry[depName]
          console.info(`| + ${depName}`)
          console.info(`| | + using: ${dep.using}`)
          console.info(`| | + latest: ${dep.latest}`)
        })
      })
    })
}

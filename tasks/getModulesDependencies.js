'use strict'

const request = require('request')

/**
 * Retrieves the dependencies of the node modules specified.
 * @param  {Array{String}} moduleNames Name of the node modules to check.
 * @this   {DVC}                       DVC instance.
 * @return {Promise}       Promise object resolved when the dependencies of the
 *                         specified modules have been retrieved.
 */
module.exports = function getModulesDependencies (moduleNames) {
  const promises = moduleNames.map((moduleName) => {
    return new Promise((resolve, reject) => {
      request(`${this.registry}/${moduleName}`, (err, res, body) => {
        if (err) return reject(err)

        const statusCode = res.statusCode
        if (statusCode !== 200) return reject(`Status Code: ${statusCode}`)

        const moduleInfo = JSON.parse(body)
        const latestVersion = moduleInfo['dist-tags'].latest
        const latestInfo = moduleInfo.versions[latestVersion]

        return resolve({
          name: moduleName,
          version: latestVersion,
          deps: latestInfo.dependencies,
          devDeps: latestInfo.devDependencies
        })
      })
    })
  })

  return Promise.all(promises)
}

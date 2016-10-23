'use strict'

const request = require('request')
const semver = require('semver')

/**
 * Returns info about the modules which have outdated dependencies.
 * @param  {Array{Object}} modules            Info about the node modules
 *                                            specified.
 * @param  {String} modules[].name            The name of the node module
 *                                            specified to be checked.
 * @param  {version} modules[].version        The version of the node module
 *                                            specified to be checked.
 * @param  {Array{Object}} modules[].deps     List of depnendencies of the node
 *                                            module to be checked.
 * @param  {Array{Object}} modules[].devDeps  List of dev depnendencies of the
 *                                            node module to be checked.
 * @this   {DVC}                              DVC instance.
 * @return {Promise}       Promise object resolved once all the dependencies of
 *                         all the node modules specified have been checked.
 */
module.exports = function getOutdatedDependencies (modules) {
  return Promise.resolve(cacheModulesVersion.call(this, modules))
    .then(cacheDepsName.bind(this))
    .then(cacheDepsLatestVersion.bind(this))
    .then(getOutdatedDeps.bind(this))
}

/**
 * Creates an object to store the latest version of all the dependencies and the
 * node modules specified to be checked.
 * @param  {Object} info.modules        Info about the node modules to be
 *                                      checked.
 * @this   {DVC}                              DVC instance.
 * @return {Object}        Contains info about the node modules to be checked
 *                         and an object which will store the latest version of
 *                         the dependencies.
 */
function cacheModulesVersion (modules) {
  const latestVersions = {}

  modules.forEach((module) => {
    latestVersions[module.name] = module.version
  })

  return {
    modules: modules,
    latestVersions: latestVersions
  }
}

/**
 * Creates an entry for each dependency inside the version object.
 * @param  {Object} info.modules        Info about the node modules to be
 *                                      checked.
 * @param  {Object} info.latestVersion  Info about the latest version of all the
 *                                      node modules.
 * @return {Object}        Contains info about the node modules to be checked
 *                         and an object which will store the latest version of
 *                         the dependencies.
 */
function cacheDepsName (info) {
  info.modules.forEach((module) => {
    joinDeps(module).forEach((dep) => {
      info.latestVersions[dep] = null
    })
  })

  return info
}

/**
 * Go through all the fields inside the object containing info about the latest
 * version of all the dependencies and request the registry to get the latest
 * version.
 * @param  {Object} info.modules        Info about the node modules to be
 *                                      checked.
 * @param  {Object} info.latestVersion  Info about the latest version of all the
 *                                      node modules.
 * @return {Object}        Contains info about the node modules to be checked
 *                         and an object which will store the latest version of
 *                         the dependencies.
 */
function cacheDepsLatestVersion (info) {
  let promises = null

  const depNames = Object.keys(info.latestVersions)

  promises = depNames.map((depName) => {
    // Skip the node modules specified to be checked.
    if (info.latestVersions[depName] !== null) return Promise.resolve()

    return new Promise((resolve, reject) => {
      request(`${this.registry}/${depName}`, (err, res, body) => {
        if (err) return reject(err)

        const statusCode = res.statusCode
        if (statusCode !== 200) return reject(`Status Code: ${statusCode}`)

        info.latestVersions[depName] = JSON.parse(body)['dist-tags'].latest
        return resolve()
      })
    })
  })

  return Promise.all(promises)
    .then(() => { return info })
}

/**
 * Checks whether the version being used by the node modules specified is
 * outdated or not.
 * @param  {Object} info.modules        Info about the node modules to be
 *                                      checked.
 * @param  {Object} info.latestVersion  Info about the latest version of all the
 *                                      node modules.
 * @return {Object}                     Contains info about the node modules
 *                                      which have outdated dependencies.
 */
function getOutdatedDeps (info) {
  const outdatedModules = {}

  info.modules.forEach((module) => {
    let outdatedDeps = checkDepVersion(module.deps, info.latestVersions)
    let outdatedDevDeps = checkDepVersion(module.devDeps, info.latestVersions)
    outdatedDeps = outdatedDeps.concat(outdatedDevDeps)

    if (outdatedDeps.length === 0) return

    outdatedModules[module.name] = outdatedDeps
  })

  return outdatedModules
}

/**
 * Checks whether the version being used by the node module specified is
 * outdated or not.
 * @param  {Array{Object}} moduleDeps     List of dependencies used by a node
 *                                        module specified to be checked.
 * @param  {Object} latestVersions        Info about the latest version of all
 *                                        the node modules.
 * @return {Array}                        List of outdated dependencies.
 */
function checkDepVersion (moduleDeps, latestVersions) {
  if (moduleDeps === undefined) return []

  var outdatedDeps = []
  const depNames = Object.keys(moduleDeps)

  depNames.forEach((depName) => {
    const depVersion = moduleDeps[depName]

    if (semver.satisfies(latestVersions[depName], depVersion)) return

    outdatedDeps.push({
      [depName]: {
        using: depVersion,
        latest: latestVersions[depName]
      }
    })
  })

  return outdatedDeps
}

/**
 * Method used to concatinate the names of the dependencies and devDependencies
 * in a single array.
 * @param  {Object} info.modules        Info about the node modules to be
 *                                      checked.
 * @return {Array{String}}              Array containing the name of all the
 *                                      dependencies and dev dependencies of the
 *                                      provided module
 */
function joinDeps(module) {
  let deps = []

  if (module.deps !== undefined) {
    deps = deps.concat(Object.keys(module.deps))
  }

  if (module.devDeps !== undefined) {
    deps = deps.concat(Object.keys(module.devDeps))
  }

  return deps
}

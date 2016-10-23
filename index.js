'use strict'

const getModulesDependencies = require('./tasks/getModulesDependencies')
const getOutdatedDependencies = require('./tasks/getOutdatedDependencies')

/**
 * Dependency Version Checker is a utility for identifying outdated dependencies
 * of existing node modules.
 * @param {String} config.registry Registry url.
 */
function DVC (config) {
  config = config || {}
  this.registry = config.registry || 'https://registry.npmjs.org'
}

/**
 * Goes through the dependencies of the node modules specified and returns the
 * outdated ones.
 * @param  {...[String]} moduleNames Name of the node modules to check.
 * @return {Object}                  Info about the node modules which have
 *                                   outdated deps.
 */
DVC.prototype.check = function check (...moduleNames) {
  return getModulesDependencies.call(this, moduleNames)
    .then(getOutdatedDependencies.bind(this))
}

module.exports = DVC

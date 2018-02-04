/*
* Tests the spheronetMutator - used as a diagnostic to get it working. 
*/

var parentSpheronet = require('./data/spheronet.json')
var SpheronetMutator = require('../spheronetMutator.js')

var childNetwork = new SpheronetMutator(parentSpheronet)

console.log("Child Network is: " + JSON.stringify(childNetwork))
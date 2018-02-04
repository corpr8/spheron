/*
* Tests the spheronetDarwin - used as a diagnostic to get it working. 
*/

var seedSpheronet = require('./data/spheronetDarwin.json')
var SpheronetDarwin = require('../spheronetDarwin.js')

var spheronetDarwin = new SpheronetDarwin(seedSpheronet)

spheronetDarwin.on('finished' , function(msg){
	console.log('spheronetDarwin completed learning and emitted the following spheronet: ' + JSON.stringify(msg))
})
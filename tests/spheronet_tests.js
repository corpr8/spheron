/*
* Tests a spheronet - used as a diagnostic to get it working. 
*/

var SpheronetTestData = require('./data/spheronet.json')
var Spheronet = require('../spheronet.js')
var spheronet = new Spheronet(SpheronetTestData)

/*
* Events emitted from the spheronet
*/
spheronet.on('finished' , function(msg){
	console.log('test harness received a message: ' + JSON.stringify(msg))
})

//spheronet.activate({"AND": {"input1": {"type": "input", "val": 0}, "input2": {"type": "input", "val": 0},}})

spheronet.activate({"AND": {"input1": {"val": 1}, "input2": {"val": 1},}})
spheronet.startTicking()

/*
* Tests a spheronetExaminer - used as a diagnostic to get it working. 
*/

var SpheronetExaminerTestData = require('./data/spheronetExaminer.json')
var SpheronetExaminer = require('../spheronetExaminer.js')

/*
* Events emitted from the spheronetExaminer
*/
spheronetExaminer = new SpheronetExaminer(SpheronetExaminerTestData)

spheronetExaminer.on('finished' , function(msg){
	console.log('spheronetExaminer test harness received a message: ' + JSON.stringify(msg))
})

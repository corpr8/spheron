"use strict";

/*
* net runner is the worker process which implements spheronets in a distributed model
* it uses mongoUtils to get pending spherons, activate them and propogate the resultant signals across output ports / connections to other spherons
*
* ?Should net runner also deal with task completion (i.e. tickNow - tick@impulse > mutateTimeout => outputSignal)?
* ?Should net runner also deal with mutation?
* ?Should net runner also deal with scoring?
*
* ?How do we define a global tick? - direct from the db
*/

var mongoUtils = require('./mongoUtils.js');
var spheron = require('./spheron.js');
//var thisTick = -1

var netRunner = {
	init: function(callback){
		mongoUtils.init(function(){
			//mongoUtils.getTick(function(newThisTick){
			//	thisTick = newThisTick
				callback()
				//console.log('this tick is: ' + thisTick)
			//})
		})
	},
	loadNextPendingSpheron: function(callback){
		//not sure we even need to work out thistick... the mongo layer can probably do that???
		//whta if thistick increments?
		console.log('loading next spheron')

		mongoUtils.getNextPendingSpheron(function(nextPendingSpheron){
			if(nextPendingSpheron.lastErrorObject){
				console.log('we had an error getting our next spheron - maybe we should do something else...')
			} else {
				console.log('next Spheron is: ' + JSON.stringify(nextPendingSpheron))	
			}
			
		})

		//callback(thisTick)

	//TODO: load pending spheron
	//activate spheron
	//propogate output across ports + connection to other spherons
	//iterate

	}
}

netRunner.init(function(){
	netRunner.loadNextPendingSpheron(function(nextPendingSpheron){
		console.log(nextPendingSpheron)
	})
})
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
			mongoUtils.dropDb()
			mongoUtils.initTick(function(){
				console.log('got back from init - loading network:')
				mongoUtils.loadSpheronet('spheronet' ,function(){
					console.log('we have loaded the spheronet')
					//console.log('generating some offspring - finding a valid spheronetId first.')
					mongoUtils.generateOffspring([0],0,10,function(){
						callback()	
					})
					
				})	
			})

		})
	},
	loadNextPendingSpheron: function(callback){
		console.log('loading next pending spheron')
		mongoUtils.getNextPendingSpheron(function(nextPendingSpheron){
			if(!nextPendingSpheron){
				console.log('we had an error getting our next spheron - maybe we should do something else:')
				//TODO: Implement housekeeping / generational / evolution mechanism perhaps storing state in db.
				callback()
			} else {
				console.log('next Spheron to process is: ' + JSON.stringify(nextPendingSpheron))

				/*
				*TODO: should we / We should do the actual activation in here... once we sort out the shitty error handling.
				*/
				callback(nextPendingSpheron.value)
			}
			
		})
	},
	activateAndPersist: function(thisSpheron, callback){
		//run the spheron
		//persist the data
		//return
	},
	propagate: function(thisSpheron, callback){
		//propagate the new values across ports - connection object - port
		//set pendAct on downstream sphedron.
	}
}

netRunner.init(function(){
	netRunner.loadNextPendingSpheron(function(nextPendingSpheron){
		console.log('we got back from loading the next spheron with: ' + JSON.stringify(nextPendingSpheron))

		//TODO: Activate the neuron and write the relative output to each output port.
		//TODO: Iterate the output ports, find connection objects, propagate the signal to the next downstream spheron
		//TODO: Set each downstream spheron as pendAct.

		//TODO: Iterate.

	})
})
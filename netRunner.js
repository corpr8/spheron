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
					//mongoUtils.generateOffspring([0],0,10,function(){
						callback()	
					//})					
				})	
			})
		})
	},
	loadNextPendingSpheron: function(callback){
		console.log('loading next pending spheron')
		mongoUtils.getNextPendingSpheron(function(nextPendingSpheron){
			if(!nextPendingSpheron.value){
				console.log('we had an error getting our next spheron - maybe we should do something else:')

				//TODO: Implement housekeeping / generational / evolution mechanism storing system state in db to prevent chatter.

				//Increment tick 
				console.log('Incrementing system tick')
				mongoUtils.incrementTick(function(){
					setTimeout(function(){
						netRunner.run()
					},1)
				})
			} else {
				console.log('next Spheron to process is: ' + JSON.stringify(nextPendingSpheron))
				callback(nextPendingSpheron.value)
			}
		})
	},
	activateAndPersist: function(thisSpheronData, callback){
		console.log('activating and persisting: ' + JSON.stringify(thisSpheronData))
		var thisSpheron = new spheron(thisSpheronData.io)
		var v = {}
		v.io = thisSpheron.activate()
		console.log('we finished activating: ' + JSON.stringify(v))

		/*
		* The Spheron currently returns data back as port:value - however, we need to store the data as port.val:val
		*/
		for(var thisKey in v.io){
			console.log('this key: ' + thisKey)
			var finalVal = v.io[thisKey]
			v.io[thisKey] = {}
			v.io[thisKey].val = finalVal
		}

		mongoUtils.updateSpheron(thisSpheronData.spheronId, thisSpheronData.spheronetId, v, function(){
			console.log('persisted new value')
			callback()	
		})
	},
	propagate: function(thisSpheronData, callback){
		console.log('propagating')
		var thisPorts = []
		for(var thisPort in thisSpheronData.io){
			if(thisSpheronData.io[thisPort].type == "output"){
				//TODO: find any connections
				thisPorts.push(thisPort)
			}
		}
		this.propagateIterator(thisSpheronData, thisPorts, 0, function(){
			callback()	
		})
	},
	propagateIterator: function(thisSpheronData, thisPorts, idx, callback){
		var that = this
		if(thisPorts[idx]){
			//TODO: Find a connection by fromId fromPort
			mongoUtils.findConnectionByInputId(thisSpheronData.spheronId, thisPorts[idx], thisSpheronData.spheronetId, function(thisConnection){
				if(thisConnection){
					console.log("found a connection: " + JSON.stringify(thisConnection) + 'propogating the value: ' + thisSpheronData.io[thisPorts[idx]].val + ' to connected spherons.')
					//process.exit()
					var v = {
						io: {}	
					}
					v.io[thisConnection.inputId] = {}
					v.io[thisConnection.inputId].val = thisSpheronData.io[thisPorts[idx]].val
					v.state = 'pending'
					console.log('update message: ' + JSON.stringify(v))
					mongoUtils.getTick(function(thisTickMsg){
						console.log('this tick: ' + JSON.stringify(thisTickMsg))
						v.stateTickStamp = thisTickMsg +1
						mongoUtils.updateSpheron(thisConnection.toId, thisSpheronData.spheronetId, v, function(){
							console.log('spheron updated')
							//TODO: set the downstream spherons input to the outputValue and their state to pending and their pendtickstate????
							//However, out connection object should reference spherons by their spheronId - which means we should set this during
							//data ingestion...
							idx +=1
							that.propagateIterator(thisSpheronData, thisPorts, idx, callback)
						})	
					})
					
				} else {
					idx +=1
					that.propagateIterator(thisSpheronData, thisPorts, idx, callback)
				}
			})
		} else {
			callback()
		}
	},
	setState: function(thisSpheronData, newState, callback){
		console.log('updating spheron state')
		mongoUtils.updateSpheron(thisSpheronData.spheronId, thisSpheronData.spheronetId, {state: newState}, function(){
			callback()	
		})
	},
	runSpheron: function(thisSpheronData, callback){
		var that = this
		this.activateAndPersist(thisSpheronData, function(){
			that.propagate(thisSpheronData, function(){
				that.setState(thisSpheronData, "idle", function(){
					console.log('finished running spheron')
					callback()
				})
			})
		})
	},
	run: function(){
		netRunner.loadNextPendingSpheron(function(nextPendingSpheron){
			console.log('we got back from loading the next spheron with: ' + JSON.stringify(nextPendingSpheron))
			netRunner.runSpheron(nextPendingSpheron, function(){
				console.log('done processing this spheron - lets ask for some more work...')
				setTimeout(function(){
					netRunner.run()
				},1)			
			})
		})
	}
}

netRunner.init(function(){
	netRunner.run()
})
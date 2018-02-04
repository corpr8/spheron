"use strict";

/*
* A spheronet is a network of Spherons - and the connections between them. It is a tick based network.
* Each network has a timeout - after which the network emits an answer.
*/

var Spheron = require('./spheron.js')
var EventEmitter = require('events').EventEmitter
var util = require('util')

var Spheronet = function(thisNetwork) {
	//constructor
   	EventEmitter.call(this)
   	this.spherons = {}
	this.systemTick = 0
	this.systemTickTimer = null
	this.inTick = false
	this.networkConfig = (thisNetwork) ? thisNetwork : {}
	this.options = {"tickMode": "timeout", "timeout": 5}
	this.testResults = []
	this.testResultsABSAveError = -1

	for(var key in this.networkConfig.spherons){
		this.spherons[key] = new Spheron(this.networkConfig.spherons[key].io)
	}
}

Spheronet.prototype.startTicking = function(){
	var t = this
	this.systemTick = 0
	this.systemTickTimer = setInterval(function(){t.tick()},1)
	return
}

Spheronet.prototype.stopTicking = function(){
	clearInterval(this.systemTickTimer)
	return
}

Spheronet.prototype.tick = function(){
	if(this.inTick == false){
		this.inTick = true
		for(var key in this.spherons){
			var thisSpheron = this.spherons[key]
			if(thisSpheron.state == 'pending' && thisSpheron.stateTickStamp < this.systemTick){
				//spheron has been pending since a previous tick
				this.processSpheron(key)
			}
		}
		this.systemTick += 1
		if(this.options.tickMode == "timeout" && this.systemTick > this.options.timeout){
			this.stopTicking()
			var emitMessage = {"spherons" : this.spherons}
			this.emit('finished',emitMessage);
		}
		this.inTick = false
	}
}

Spheronet.prototype.propagate = function(thisSpheron){
	for(var key in this.networkConfig.connections){
		var thisConnection = this.networkConfig.connections[key]
		if(thisConnection.from == thisSpheron){
			this.spherons[thisConnection.to].connections[thisConnection.inputId].val = this.spherons[thisSpheron].connections[thisConnection.outputId].val
			this.spherons[thisConnection.to].stateTickStamp = this.systemTick
			this.spherons[thisConnection.to].state = 'pending'
		}
	}
	return
}

Spheronet.prototype.processSpheron = function(key){
	this.spherons[key].activate()
	this.propagate(key)
	return
}

Spheronet.prototype.activate = function(inputData){
	/*
	* function which sets inputs on the networks input spherons and sets their state to pending with a tickStamp of this.tick
	*/
	inputData = (inputData) ? inputData : {}
	//reset the system tick as we have new data...
	this.systemTick = 0
	for(var key in inputData){
		var thisSpheronInputs = inputData[key]
		for(var thisInput in thisSpheronInputs){
			this.spherons[key].connections[thisInput].val = thisSpheronInputs[thisInput].val
		}
		this.spherons[key].state = 'pending'
		this.spherons[key].stateTickStamp = this.systemTick
	}
	return
}

util.inherits(Spheronet, EventEmitter)
module.exports = Spheronet;
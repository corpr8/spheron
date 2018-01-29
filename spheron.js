"use strict";

/*
* A spheron is a configurable computing unit. It an instance of the active component of a speheron cloud.
*/

var add = require('vectors/add')(2)
var mag = require('vectors/mag')(2)
var heading = require('vectors/heading')(2)
const radToDeg = 180 / Math.PI
const degToRad = Math.PI / 180

var Spheron = function (connections) {
	var nullConfig = {
		'input1': {type: 'input', angle: 0, val: 0},
		'bias': {type: 'bias', angle: 90, val: 1},
		'outputNot': {type: 'output', angle: 180, val: -1}
	}

	this.connections = (connections) ? connections : nullConfig
	this.signalVector = {}
	this.stateTickStamp = 0
	this.state = 'idle'
};

Spheron.prototype.calculateSignalVector = function(){
	/*
	* Calculates the result vector from adding all inputs or biases together.
	*/
	let rv = [0,0]
	for(var key in this.connections) {
        var thisConn = this.connections[key]
        if(thisConn.type == 'input' || thisConn.type == 'bias'){
        	var thisConnCart = this._p2c(thisConn.val,(thisConn.angle * degToRad))
        	add(rv, thisConnCart)
        }
    }

    this.signalVector = rv
    return rv
}

Spheron.prototype.activate = function(thisConnections){
	/*
	* Accepts an array as per the constructor. The array only contains inputs.
	* Sets the values into the relevant inputs
	* Calculates the signal vector
	*
	* returns the signalVector (activation) as seen from each output in an array
	*/

	/*
	* update input values
	*/
	//console.log("activating Spheron")
	if(thisConnections){
		for(var key in thisConnections) {
			var thisConn = thisConnections[key]
			if(thisConn.type == 'input' || thisConn.type == 'bias'){
				this.connections[key].val = thisConn.val
			}
		}
	}

	this.calculateSignalVector()
	var thisResults = {}

	/*
	* now cycle the outputs and add them to thisResults as well as updating their value.
	*/
	for(var key in this.connections) {
		var thisConn = this.connections[key]
		if(thisConn.type == 'output'){
			//find signalVector as a polar angle
			var signalVectorHeading = heading(this.signalVector,[0,0])
			var outputHeading = thisConn.angle * degToRad
			var outputAmp = Math.cos(Math.abs(signalVectorHeading - outputHeading))
			var outputFinal = Math.floor((mag(this.signalVector) * outputAmp) * 100000)/100000

			thisConn.val = outputFinal
			thisResults[key] = outputFinal
		}
	}

	this.state = 'idle'
	return thisResults
}

Spheron.prototype._p2c = function(r, theta){
	return [
        (Math.floor((r * Math.cos(theta)) * 100000))/100000,
        (Math.floor((r * Math.sin(theta)) * 100000))/100000,
    ]
}

module.exports = Spheron
"use strict";

/*
* A spheron is a configurable computing unit. It an instance of the active component of a Speheronet.
*/

var add = require('vectors/add')(2)
var mag = require('vectors/mag')(2)
var heading = require('vectors/heading')(2)
const radToDeg = 180 / Math.PI
const degToRad = Math.PI / 180

var Spheron = function (connections) {
	this.connections = (connections) ? connections : {}
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
	* update input values
	*/
	if(thisConnections){
		for(var key in thisConnections) {
			var thisConn = thisConnections[key]
				this.connections[key].val = thisConn.val
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

			/*
			* now apply any output flattening function
			*/
			thisConn = this._outputFn(thisConn)
			thisResults[key] = thisConn.val
		}
	}
	this.state = 'idle'
	return thisResults
}

Spheron.prototype._outputFn = function(thisConn){
	if(thisConn.outputFn){
		if(thisConn.outputFn.mode == "eq"){
			//tests if equal
			thisConn.val = (thisConn.val == thisConn.outputFn.val) ? 1 : 0
		} else if(thisConn.outputFn.mode == "neq"){
			//tests if not equal
			thisConn.val = (thisConn.val != thisConn.outputFn.val) ? 1 : 0
		} else if(thisConn.outputFn.mode == "neq_nz"){
			//tests if not equal && not zero
			thisConn.val = (thisConn.val != thisConn.outputFn.val && thisConn.val != 0) ? 1 : 0
		} else if(thisConn.outputFn.mode == "sigmoid"){
			//applies the sigmoid flattening function ala traditional neurons.
			//*** To be verified ***
			thisConn.val = 1 / (1 + Math.exp(-thisConn.val))
			//*** end To be verified ***
		} else {
			console.log('non handled case')
		}
	}
	return thisConn
}

Spheron.prototype._p2c = function(r, theta){
	return [
        (Math.floor((r * Math.cos(theta)) * 100000))/100000,
        (Math.floor((r * Math.sin(theta)) * 100000))/100000,
    ]
}

module.exports = Spheron;
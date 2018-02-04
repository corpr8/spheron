"use strict";

/*
* The SpheronetMutator accepts a spheronet and returns a randomly mutated offspring
*/

var SpheronetMutator = function (thisSpheronet) {
	this.spheronet = thisSpheronet
	var option = Math.floor(Math.random() * 4)
	switch (option){
		case 0:
			this.insertConnection()
			break
		case 1:
			this.insertSpheron()
			break
		case 2:
			this.removeConnection()
			break
		case 3:
			this.mutateTimeout()
			break
		default:
			this.tweakSpheronPort()
			break
	}
	return thisSpheronet
}

SpheronetMutator.prototype.mutateTimeout = function(){
	//console.log('mutating Timeout (depth) of network')
	var currentTimeout = this.spheronet.options.timeout
	var timeoutDelta = Math.floor(Math.random() * 6) -3
	this.spheronet.options.timeout += timeoutDelta
	return
}

SpheronetMutator.prototype.removeConnection = function(){
	//console.log('removing a connection')
	var thisConnectionIdx = this._getRandomConnection()
	delete this.spheronet.spherons[this.spheronet.connections[thisConnectionIdx].from].io[this.spheronet.connections[thisConnectionIdx].outputId]
	delete this.spheronet.spherons[this.spheronet.connections[thisConnectionIdx].to].io[this.spheronet.connections[thisConnectionIdx].inputId]
	this.spheronet.connections.splice(thisConnectionIdx,1)
	return
}

SpheronetMutator.prototype.removeSpheron = function(){
	// to be implemented at a later date.
	// pick a random spheron
	// make sure it is not an input, or output spheron
	// splice out any connections to, or from this spheron
	// delete the spheron.
}

SpheronetMutator.prototype.insertConnection = function(){
	//console.log('inserting connection')
	var thisSpheron = this._getRandomSpheron()
	var thisSpheronNewPortId = this._generateUUID()
	var thisOtherSpheron = this._getRandomSpheron()
	var thisOtherSpheronNewPortId = this._generateUUID()
	this.spheronet.spherons[thisSpheron].io[thisSpheronNewPortId] = {"type" : "output", "angle" : Math.floor(Math.random() * 360), "val" : -1 }
	this.spheronet.spherons[thisOtherSpheron].io[thisOtherSpheronNewPortId] = {"type" : "input", "angle" : Math.floor(Math.random() * 360), "val" : -1 }
	this.spheronet.connections.push({"from" : thisSpheron,  "outputId" : thisSpheronNewPortId, "to" : thisOtherSpheron, "inputId" : thisOtherSpheronNewPortId })
	return
}

SpheronetMutator.prototype.insertSpheron = function(){
	//console.log('inserting spheron')
	var thisConnectionIdx = this._getRandomConnection()
	//console.log('inserting spheron into connectionIdx: ' + thisConnectionIdx)

	var newSpheronId = this._generateUUID()
	var newSpheronInputPortId = this._generateUUID()
	var newSpheronOutputPortId = this._generateUUID()

	this.spheronet.spherons[newSpheronId] = {"io": {[newSpheronInputPortId]: {"type": "input", "angle": Math.floor(Math.random() * 360), "val": 0},"bias": {"type": "bias", "angle": Math.floor(Math.random() * 360), "val": 1},[newSpheronOutputPortId]: {"type": "output", "angle": Math.floor(Math.random() * 360), "val": 0}}, "state": "idle", "stateTickStamp": -10}

	var oldConnectionToSpheron = this.spheronet.connections[thisConnectionIdx].to
	var oldConnectionToPort = this.spheronet.connections[thisConnectionIdx].inputId

	//now update the existent connection.
	this.spheronet.connections[thisConnectionIdx].to = newSpheronId
	this.spheronet.connections[thisConnectionIdx].inputId = newSpheronInputPortId

	//create a new connection from the new spheron to the old endPoint.
	this.spheronet.connections.push({"from" : newSpheronId,  "outputId" : newSpheronOutputPortId, "to" : oldConnectionToSpheron, "inputId" : oldConnectionToPort })
	return
}

SpheronetMutator.prototype.tweakSpheronPort = function(){
	//console.log('tweaking spheron port angle')
	var thisSpheron = this._getRandomSpheron()
	var thisPort = this._getRandomPort(thisSpheron)
	var currentAngle = this.spheronet.spherons[thisSpheron].io[thisPort].angle

	var newAngle = (Math.random() > .5) ? currentAngle  + Math.floor(Math.random() * 10) : currentAngle  - Math.floor(Math.random() * 10)
	newAngle = (newAngle > 360) ? newAngle - 360 : newAngle
	newAngle = (newAngle < 0) ? newAngle + 360 : newAngle
	//console.log("Spheron: " + thisSpheron + ", Port: " + thisPort + ". Current Angle: " + currentAngle + ", New Angle: " + newAngle)

	this.spheronet.spherons[thisSpheron].io[thisPort].angle = newAngle
	return
}

SpheronetMutator.prototype._getRandomPort = function(thisSpheron){
	var keys = Object.keys( this.spheronet.spherons[thisSpheron].io )
	var chosenKey = Math.floor(Math.random() * keys.length)
	return keys[chosenKey]
}

SpheronetMutator.prototype._getRandomConnection = function(){
	var keys = Object.keys( this.spheronet.connections )
	var chosenKey = Math.floor(Math.random() * keys.length)
	return keys[chosenKey]
}

SpheronetMutator.prototype._getRandomSpheron = function(){
	var keys = Object.keys( this.spheronet.spherons )
	var chosenKey = Math.floor(Math.random() * keys.length)
	return keys[chosenKey]
}

SpheronetMutator.prototype._generateUUID = function(){
	//from https://jsfiddle.net/briguy37/2MVFd/
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

module.exports = SpheronetMutator;
"use strict";

/*
* spheronetExaminer takes a spheronet definition and test plan. It emits the results and average error
*/

var EventEmitter = require('events').EventEmitter
var util = require('util')
var Spheronet = require('./spheronet.js');

var SpheronetExaminer = function(thisNetworkAndTestPlan) {
   	EventEmitter.call(this)
   	//load up a spheronet with the testNetwork
   	this.spheronet = new Spheronet(thisNetworkAndTestPlan)
   	this.testPlan = thisNetworkAndTestPlan.tests
   	this.testIdx = 0
   	this.testResults = []
   	this.compoundError = 0
   	var t = this
   	this.spheronet.on('finished' , function(msg){
   		t.spheronet.stopTicking()
   		t.testResults.push(msg)

   		// now we should add mod errors onto the compound error.
   		for(var testSpheron in t.testPlan[t.testIdx].outputs){
   			for(var testPort in t.testPlan[t.testIdx].outputs[testSpheron]){
   				var thisError = Math.abs(t.testPlan[t.testIdx].outputs[testSpheron][testPort].val - msg.spherons[testSpheron].connections[testPort].val)
   				t.compoundError += thisError
   				//console.log(thisError)
   			}
   		}
   		t.compoundError = Math.floor(t.compoundError * 100000) / 100000

   		t.testIdx += 1
   		t.testIterator()
	})
	this.testIterator()
}

//run the test plan against the loaded spheronet
SpheronetExaminer.prototype.testIterator = function(){
	if(this.testPlan[this.testIdx]){
		this.spheronet.activate(this.testPlan[this.testIdx].inputs)
		this.spheronet.startTicking()
	} else {
		this.emit('finished', {"results" : this.testResults, "compoundError" : this.compoundError});
	}
}

util.inherits(SpheronetExaminer, EventEmitter)
module.exports = SpheronetExaminer;

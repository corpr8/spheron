"use strict";

/*
* Spheronet Darwin is the main orchestrator for learning in the spheronet environment.
* It is instantiated with a lesson to learn and a tollerance whice is acceptable.
* Once the tollerance is met, the lesson is learned and the successful network is returned.
*/
var EventEmitter = require('events').EventEmitter
var util = require('util')
var spheronetMutator = require('./spheronetMutator.js')
var SpheronetExaminer = require('./spheronetExaminer.js')

var SpheronetDarwin = function (seedSpheronet) {
	//constructor
   	EventEmitter.call(this)
   	this.firstPass = true //so we mutate from the seed.
   	this.seedSpheronet = seedSpheronet
   	this.populationSize = 0
   	this.populationIdx = 0
   	this.spheronets = []
   	this.epoch = -1
   	this.generateMutants()
}

SpheronetDarwin.prototype.generateMutants = function(){
	//call the mutator lots to generate mutants.
	if(this.firstPass == true){
		if(this.populationSize < this.seedSpheronet.options.maxPopulation){
			var childNetwork = new spheronetMutator(JSON.parse(JSON.stringify(this.seedSpheronet)))
			this.spheronets.push(childNetwork)
			this.populationSize += 1
			this.generateMutants()
		} else {
			this.firstPass = false
			this.examineMutants()
		}
	} else {
		//as we are not in the first pass, we need to sort the array of spheronets by compoundError and replace any past the threshould with new mutants.
		if(this.populationIdx < this.seedSpheronet.options.maxPopulation){
			var parentIdx = Math.floor(Math.random() * this.seedSpheronet.options.elitism)

			//just a bunch of mutation. we could be smarter about this.
			this.spheronets[this.populationIdx] = new spheronetMutator(JSON.parse(JSON.stringify(this.spheronets[parentIdx])))
			
			/*
			this.spheronets[this.populationIdx] = new spheronetMutator(this.spheronets[this.populationIdx])
			this.spheronets[this.populationIdx] = new spheronetMutator(this.spheronets[this.populationIdx])
			this.spheronets[this.populationIdx] = new spheronetMutator(this.spheronets[this.populationIdx])
			this.spheronets[this.populationIdx] = new spheronetMutator(this.spheronets[this.populationIdx])
			*/

			this.spheronets[this.populationIdx].compoundError = 9999
			this.populationIdx += 1
			this.generateMutants()
		} else {
			this.populationIdx = 0
			this.examineMutants()
		}
	}
}

SpheronetDarwin.prototype.checkSucccess = function(){
	//iterate the mutants and see if any scores are below the success threshold.
	if(this.spheronets[0].compoundError < this.seedSpheronet.options.successTolerance){
		console.log('we have a winner!')
		var emitMessage = {"spheronet" : this.spheronets[0]}
		this.emit('finished',emitMessage)
	} else {
		//write an epoch message.
		this.epoch += 1
		var epochMessage = 'Epoch: ' +  this.epoch
		if(this.spheronets[0]){
		 	epochMessage += (this.spheronets[0].compoundError) ? ". Lowest compound error: " + this.spheronets[0].compoundError : ""	
		} 
		
		console.log(epochMessage)
		this.populationIdx = this.seedSpheronet.options.elitism + 1
		this.generateMutants()
	}
}


SpheronetDarwin.prototype.examineMutants = function(){
	//iterate each mutants testplan and write the errors back into the spheronets file.
	if(this.populationIdx < this.populationSize){
		//load the spheronet
		var thisSpheronet = this.spheronets[this.populationIdx]

		//do the check...
		var spheronetExaminer = new SpheronetExaminer(thisSpheronet)

		var t = this
		spheronetExaminer.on('finished' , function(msg){
			thisSpheronet.compoundError = msg.compoundError
			t.populationIdx += 1
			t.examineMutants()
		})
	} else {
		this.populationIdx = 0
		this._sortPop()
		this.checkSucccess()
	}
}

SpheronetDarwin.prototype._sortPop = function(){
	/*
	* Sort spheronets
	*/
	this.spheronets.sort(function(a, b) {
	    return a.compoundError - b.compoundError;
	});
	return	
}

util.inherits(SpheronetDarwin, EventEmitter)
module.exports = SpheronetDarwin;
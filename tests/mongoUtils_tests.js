"use strict";

/*
* Tests mongoUtils.js in various ways - used as a diagnostic. 
*/

var fs = require("fs")
var mongoUtils = require('../mongoUtils.js');
var thisSpheronId, thisConnectionId, testPhase = 0

var testIterator = function(){
	switch (testPhase){
		case 0 :
			mongoUtils.init(function(){
				testPhase += 1
				testIterator()
			})
			break;
		case 1 :
			mongoUtils.dropCollection(function(){
				testPhase += 1
				testIterator()
			})
			break;
		case 2 :
			mongoUtils.createSpheron(null ,function(result){
				thisSpheronId = result
				console.log("Created a spheron with id: " + thisSpheronId + "\r\n");
				testPhase += 1
				testIterator()
			})
			break;
		case 3 :
			mongoUtils.createConnection(null ,function(result){
				thisConnectionId = result
				console.log("Created a Connection with id: " + thisConnectionId + "\r\n");
				testPhase += 1
				testIterator()
			})
			break;
		case 4 :
			mongoUtils.find(function(result){
				console.log('find result: ' + JSON.stringify(result) + "\r\n")
				testPhase += 1
				testIterator()
			})
			break;
		case 5 :
			mongoUtils.readSpheron(thisSpheronId, function(result){
				console.log('read spheron: ' + JSON.stringify(result) + "\r\n")
				testPhase += 1
				testIterator()
			})
			break;
		case 6 :
			mongoUtils.readConnection(thisConnectionId, function(result){
				console.log('read connection: ' + JSON.stringify(result) + "\r\n")
				testPhase += 1
				testIterator()
			})
			break;
		case 7 :
			mongoUtils.updateSpheron(thisSpheronId, {io:{input1:{angle:89}}}, function(result){
				console.log('updated spheron: ' + "\r\n")
				testPhase += 1
				testIterator()
			})
			break;
		case 8 :
			mongoUtils.readSpheron(thisSpheronId, function(result){
				console.log('read spheron: ' + JSON.stringify(result) + "\r\n")
				testPhase += 1
				testIterator()
			})
			break;
		case 9 :
			mongoUtils.getNextPendingSpheron(function(result){
				console.log('got next pending Spheron note: status should read processing or something other than pending or idle... ' + JSON.stringify(result) + '\r\n')
				testPhase += 1
				testIterator()
			})
			break;
		case 10 :
			mongoUtils.deleteConnection(thisConnectionId, function(result){
				console.log('successful connection delete')
				testPhase += 1
				testIterator()
			})
			break;
		case 11 :
			mongoUtils.deleteSpheron(thisSpheronId, function(result){
				console.log('successful spheron delete')
				testPhase += 1
				testIterator()
			})
			break;
		case 12 :
			mongoUtils.incrementTick(function(result){
				console.log('incremented tick to: ' + result)
				testPhase += 1
				testIterator()
			})
			break;
		case 13 :
			mongoUtils.incrementTick(function(result){
				console.log('incremented tick to: ' + result)
				testPhase += 1
				testIterator()
			})
			break;
		case 14 :
			mongoUtils.incrementTick(function(result){
				console.log('incremented tick to: ' + result)
				testPhase += 1
				testIterator()
			})
			break;
		default :
			console.log('all tests finished. We got this far without hard errors...')
			process.exit()
			break;
	}
}

testIterator()
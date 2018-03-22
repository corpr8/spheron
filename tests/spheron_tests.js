"use strict";

/*
* Tests a spheron in various ways - used as a diagnostic. 
*/

var fs = require("fs")
var Spheron = require('../spheron.js');
var testDefs = ["NOT", "AND", "NAND", "NOR", "XOR", "4InputXOR","Fuzzy"]
var testsFailed = 0

var runTest = function(thisTestDefIdx){
	var thisTestDef = testDefs[thisTestDefIdx]
	console.log('\r\nrunning test: ' + thisTestDef)
	var thisTestDocument = fs.readFileSync( __dirname + "/data/" + thisTestDef +'.json');
	thisTestDocument = JSON.parse(thisTestDocument)

	var spheron = new Spheron(thisTestDocument.io)

	for(var thisTest in thisTestDocument.tests) {
		var expected = thisTestDocument.tests[thisTest].expected
		var actual = spheron.activate((thisTestDocument.tests[thisTest]).inputs)

		//iterate the expected outputs
		for(var thisOutput in thisTestDocument.tests[thisTest].outputs){
			if(actual[thisOutput] != null){
				console.log(JSON.stringify((thisTestDocument.tests[thisTest]).inputs) + ' ' + thisOutput + ' expected: ' + thisTestDocument.tests[thisTest].outputs[thisOutput].val + ' actual: ' + actual[thisOutput])
				if(thisTestDocument.tests[thisTest].outputs[thisOutput].val != actual[thisOutput]){
					testsFailed += 1
				}
			}
		}
	}

	if(thisTestDefIdx < testDefs.length -1){ 
		runTest(thisTestDefIdx +1)
	} else {
		if(testsFailed == 0){
			console.log('\r\nCongratulations, all tests passed - we have proved our Spheron against the test cases...\r\n')
		} else {
			console.log('all tests finished. failed: ' + testsFailed + ' test(s)')	
		}
	}
}

runTest(0)

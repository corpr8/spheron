"use strict";

/*
* Tests a spheron in various ways - used as a diagnostic. 
*/

var fs = require("fs")
var Spheron = require('../spheron.js');

var testDefs = ["NOT","AND"]

var runTest = function(thisTestDef){
	var thisTestDocument = fs.readFileSync("./data/" + thisTestDef +'.json');
	thisTestDocument = JSON.parse(thisTestDocument)

	var spheron = new Spheron(thisTestDocument.io)

	for(var thisTest in thisTestDocument.tests) {
		var expected = thisTestDocument.tests[thisTest].expected
		var actual = spheron.activate((thisTestDocument.tests[thisTest]).inputs)
		console.log("test: " + JSON.stringify((thisTestDocument.tests[thisTest]).inputs) + " expected: " + JSON.stringify(expected) + " actual: " + JSON.stringify(actual))
	}
}

for(var key in testDefs) {
	runTest(testDefs[key])
}

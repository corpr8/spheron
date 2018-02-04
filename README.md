# spheron
Spheron - An alternative approach to the Neuron

#Install with:
npm Install

#Architecture:
spheron.js: The basic computing unit.

spheronet.js: This unit encpasulates the spheron, connections between them and provides a mechansim to run them and emit an answer.

spheronetExaminer.js: This unit runs a spheronet and tests it against a test plan (checkout spheronetExaminer.json for the test plan). Currently, it also returns an unfitness score (the higher, the less fit).

spheronetMutator.js: Used to create random mutations of a spheronet.

spheronetDarwin.js: Manages populations of spheronets, runs them against a testplan and assesses their fitness by working out the compound error in each of the testplans tests. The population is then sorted by this compound error. An Elitism metric is then used to preserve the best networks before a new population is created.


#Run the tests with:
cd tests
nodejs spheron_test.js
nodejs speronet_tests.js
nodejs spheronetExaminer_tests.js
nodejs spheronetMutator_tests.js
nodejs spheronetDarwin_tests.js


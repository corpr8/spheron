# spheron

A universal processing component able to perform both boolean and fuzzy functions.



#Install with:

npm Install



#Architecture:


spheron.js: The basic computing unit.


spheronet.js: This unit encpasulates the spheron, connections between them and provides a mechansim to run them and emit an answer.


spheronetExaminer.js: This unit runs a spheronet and tests it against a test plan (checkout spheronetExaminer.json for the test plan). Currently, it also returns an unfitness score (the higher, the less fit).


pheronetMutator.js: Used to create random mutations of a spheronet.


spheronetDarwin.js: Manages populations of spheronets, runs them against a testplan and assesses their fitness by working out the compound error in each of the testplans tests. The population is then sorted by this compound error. An Elitism metric is then used to preserve the best networks before a new population is created.



#Run the tests with:

node tests/spheron_test.js

node tests/speronet_tests.js <-- in progress

node tests/spheronetExaminer_tests.js

node tests/spheronetMutator_tests.js

node tests/spheronetDarwin_tests.js


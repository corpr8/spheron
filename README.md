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


#Distributed Operation:


netRunner.js - a distributed provess to run networks which are persisted out to a mongodb

jobRunner.js - deals with the end of a tick - i.e. checking if a single test has finished (i.e. if current tick - signal tick >= tick age), assessing the score of that test, dealing with all test finished (an epoch), and providing reproduction and mutation facilities

monitor.js - provides ux for monitor and control / upload of jobs JSON to the mongodb.

spheron.js - the underlying component of all spheron based stuff :-)







var isJSON = function(x){
	try {
	    JSON.parse(x)
	    return true
	} catch (e) {
	    return false
	}
}

module.exports = isJSON;
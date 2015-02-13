var searchButton 		= document.getElementById('search-button');
var searchBar			= document.getElementById('search-bar');

// declare utilities

/**
 * returns current info
 */
function getLocation(artifact) {

	var currentLocation = window.location;

	if(artifact) {
		currentLocation = currentLocation[artifact];
		currentLocation = currentLocation.split('/');
	}

	return currentLocation;

}

/**
 * Makes an xmlhttprequest with a POST to a specified uri
 */
function makePOSTRequest(requestData, requestURI, callback) {

	var http = new XMLHttpRequest();
	http.open('POST', requestURI, true);
	http.send();
	http.addEventListener('readystatechange', function() {

		if(this.readyState == 4) {
			callback.call(this, this.responseText);
		}

	});

}

/**
 * Makes an xmlhttprequest with a GET to a specified uri
 */
function makeGETRequest(requestURI, callback) {

	var http = new XMLHttpRequest();
	http.open('GET', requestURI, true);
	http.send(null);
	http.addEventListener('readystatechange', function() {

		if(this.readyState == 4) {
			callback.call(this, this.responseText);
		}

	});

}

/**
 * Resolves query depending on url status
 */
function urlSearchQueryResolver(searchQuery) {

	if(searchQuery && searchQuery != '') {
		getLocation().assign('#/' + searchQuery);
		return false;
	}

	// this means a parameter has been supplied
	if(getLocation().hash) {

		makeGETRequest('/get/item/keyword/' + getLocation('hash')[1], function(data) {
			console.log(data);
		});

	}

}

(function main() {

	// run url resolver
	urlSearchQueryResolver();

})();


// add event listeners

/**
 * adds click event to main search page button
 */
searchButton.addEventListener('click', function(e) {

	e.preventDefault();

	// handle search query entered in search bar
	urlSearchQueryResolver(searchBar.value);

});

searchBar.addEventListener('keydown', function(e) {

	if(e.keyCode == 13) {
		e.preventDefault();

		// handle search query entered in search bar
		urlSearchQueryResolver(searchBar.value);
	}

});

/**
 *
 */
 window.addEventListener('hashchange', function() {
 	urlSearchQueryResolver();
 });
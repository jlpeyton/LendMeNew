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
		getLocation().assign('/view/results/' + searchQuery);
		return false;
	}

	if(getLocation('href').length > 5) {

		makeGETRequest('/get/item/keyword/' + getLocation('href')[5], function(data) {

			if(getLocation('href')[4] == 'results') {

				var resultsWrapper = document.getElementById('results');
				resultsWrapper.innerHTML = '';

				var parsedResults = JSON.parse(data);
				console.log(parsedResults);

				for(var i = 0; i < parsedResults.results.length; i++) {

					var li = document.createElement('li');
					li.className = 'col-sm-6 remove-bullet center-block';
					li.style.marginTop = '20px';
					li.itemData = parsedResults.results[i];

					var listGroup = document.createElement('div');
					listGroup.className = 'clearfix list-group-item hover-color img-rounded';

					var visibleSm = document.createElement('div');
					visibleSm.className = 'visible-sm clearfix';

					var rowItemOne = document.createElement('div');
					rowItemOne.className = 'row';

					var colXs4 = document.createElement('div');
					colXs4.className = 'col-xs-4';
					colXs4.innerHTML = '<img src="' + parsedResults.results[i].itemImage + '" class="img-responsive"/>';

					var colXs8 = document.createElement('div');
					colXs8.className = 'col-xs-8';

					var rowItemTwo = document.createElement('div');
					rowItemTwo.className = 'row';
					rowItemTwo.innerHTML = '<h3 class="item-title">' + parsedResults.results[i].itemName + '</h3>';

					var rowItemThree = document.createElement('div');
					rowItemThree.className = 'row';
					rowItemThree.innerHTML = '<p>' + parsedResults.results[i].itemDescription + '</p>';


					var rowItemFour = document.createElement('div');
					rowItemFour.className = 'row';
					rowItemFour.innerHTML = '<div class="col-xs-6"><p class="duration">' + parsedResults.results[i].lendDuration + ' days max.</p></div><div class="col-xs-6"><p class="duration">' + parsedResults.results[i].minRepRequired + ' rep min.</p></div>';
				
					var rowItemFive = document.createElement('div');
					rowItemFive.className = 'row';
					rowItemFive.innerHTML = '<a href="/view/item/' + parsedResults.results[i].itemId + '"><button id="1" class="btn btn-primary select-item">See More</button></a>';

					// attach to page
					li.appendChild(listGroup);
					listGroup.appendChild(visibleSm);
					listGroup.appendChild(rowItemOne);

					rowItemOne.appendChild(colXs4);
					rowItemOne.appendChild(colXs8);

					colXs8.appendChild(rowItemTwo);
					colXs8.appendChild(rowItemThree);
					colXs8.appendChild(rowItemFour);
					colXs8.appendChild(rowItemFive);

					resultsWrapper.appendChild(li);

				}

			}

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

if(searchButton && searchBar) {
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
}

/**
 *
 */
 window.addEventListener('hashchange', function() {
 	urlSearchQueryResolver();
 });
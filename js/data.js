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

		if(getLocation('href')[4] == 'results') {

			makeGETRequest('/get/item/keyword/' + getLocation('href')[5], function(data) {

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

			});

		} else if(getLocation('href')[4] == 'item') {

			var itemContainer = document.getElementById('item-container');

			makeGETRequest('/get/item/id/' + getLocation('href')[5], function(requestedItemData) {

				var parsedItemData 	= JSON.parse(requestedItemData);
				var itemData 		= parsedItemData.results[0];

				makeGETRequest('/get/user/id/' + itemData.itemLenderId, function(requestedUserData) {

					var parsedUserData 	= JSON.parse(requestedUserData);
					var userData 		= parsedUserData.results[0];

					console.log(userData);
				
					var row = document.createElement('div');
					row.className = 'row';

					var colXs4 = document.createElement('div');
					colXs4.className = 'col-xs-4';
					colXs4.innerHTML = '<img src="' + itemData.itemImage + '" class="img-responsive" style="margin-top:10px" />';

					var colXs6 = document.createElement('div');
					colXs6.className = 'col-xs-6 well';
					colXs6.style.marginTop = '20px';

					var rowItem2 = document.createElement('div');
					rowItem2.className = 'row';
					rowItem2.innerHTML = '<div class="col-xs-6"><h2>' + itemData.itemName + '</h2><h6>from <a href="/view/user/' + userData.username + '">' + userData.username + '</a> - <span class="red">' + userData.reputation + '</span></h6><h5><a href="#">' + itemData.category + '</a></h5></div><div class="col-xs-6"><a href="#" class="btn btn-success btn-lg" style="margin-left:150px">Borrow!</a></div>';

					var rowItem3 = document.createElement('div');
					rowItem3.className = 'row';
					rowItem3.innerHTML = '<div class="col-xs-12"><h6>min rep: ' + itemData.minRepRequired + '&nbsp;&nbsp;|&nbsp;&nbsp;' + itemData.lendDuration + ' days max.</h6></div>';

					var rowItem4 = document.createElement('div');
					rowItem4.className = 'row';
					rowItem4.innerHTML = '<div class="col-xs-12"><p>' + itemData.itemDescription + '</p></div>';

					colXs6.appendChild(rowItem2);
					colXs6.appendChild(rowItem3);
					colXs6.appendChild(rowItem4);

					row.appendChild(colXs4);
					row.appendChild(colXs6);

					itemContainer.appendChild(row);

				});

			});

		}

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
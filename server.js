#!/bin/env node

/**
* Provided under the MIT License (c) 2014
* See LICENSE @file for details.
*
* @file server.js
*
* @author SURGE (A^3)
* @date 2/12/15
*
* Node.js server that powers application backend
*
**/

// declare application constants

var SERVER_HOST             = process.env.OPENSHIFT_NODEJS_IP   || '127.0.0.1';
var SERVER_PORT             = process.env.OPENSHIFT_NODEJS_PORT || 8000;
var SERVER_HEAD_OK          = 200;
var SERVER_HEAD_NOTFOUND    = 404;
var SERVER_HEAD_ERROR       = 500;
var SERVER_RES_OK           = '200. Server status: OK';
var SERVER_RES_NOTFOUND     = '404. The file you are looking for could not be found.';
var SERVER_RES_ERROR        = '500. An invalid request was sent to the server.';
var SERVER_RES_POST_ERROR   = '500. Invalid method used. Action expects a POST request.';

var MYSQL_HOST              = process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost';
var MYSQL_PORT              = process.env.OPENSHIFT_MYSQL_DB_PORT || '3306';
var MYSQL_USERNAME          = 'admin8AnEDyb';
var MYSQL_PASSWORD          = 'Me4VU3l42uZS';
var MYSQL_DATABASE          = 'lendme';

// import node.js packages

var fs              = require('fs');
var http            = require('http');
var https           = require('https');
var url             = require('url');
var mysql           = require('mysql');

// begin application declarations

var application     = null;             // holds our main application server. Initialized in main
var currentRequest  = null;             // define current parsed / routed request being handled

var dictionaryOfMimeTypes = {

    'css'   : 'text/css'                ,
    'html'  : 'text/html'               ,
    'ico'   : 'image/x-icon'            ,
    'jpg'   : 'image/jpeg'              ,
    'jpeg'  : 'image/jpeg'              ,
    'js'    : 'application/javascript'  ,
    'map'   : 'application/x-navimap'   ,
    'pdf'   : 'application/pdf'         ,
    'png'   : 'image/png'               ,
    'ttf'   : 'application/octet-stream',
    'txt'   : 'text/plain'              ,
    'woff'  : 'application/x-font-woff'

};

var dictionaryOfRoutes  = {

    '/'                             : 'index.html',
    '/post'                         : handleRequestAsPostData,
    '/action/login'                 : handleRequestAsActionLogin

};

/**
 * define mysql connection object. Handle all connections to the database
**/
var database = {

    // define mysql object properties
    connection          :   null,               // holds the connection object to the mysql server or null if not connected
    hasData             :   false,              // flag indicating whether mysql database table contains any data
    isBusy              :   false,              // flag indicating whether a mysql query is currently ongoing
    isConnected         :   false,              // flag indicating whether a connection to mysql server has been established

    /**
     * creates and establishes a connection to
     * the mysql server
     *
     * @param host      = {String} specifying mysql server address
     * @param user      = {String} specifying database account username
     * @param password  = {String} specifying database account password
     * @param database  = {String} specifying the name of database to connect to
    **/
    connect : function(host, user, password, database) {
        // check to see if previous connection exists, or @params for new connection are passed
        if(!database.isConnected || (host && user && password)) {
            // create connection blueprint
            database.connection = mysql.createConnection({

                host:           host || MYSQL_HOST,
                user:           user || MYSQL_USERNAME,
                pass:       password || MYSQL_PASSWORD,
                database:   database || MYSQL_DATABASE

            });

            // create connection to server
            database.connection.connect(function(error) {

                // check to see if connection was successful
                if(error) {
                    return console.log('Error establishing a connection to the mysql server -> ' + error);;
                }

                console.log('<MySQL> successfully connected to mysql server');
            });

            // tell connection flag that connection was successful
            database.isConnected = true;

            // if new connection @params are given, or there is no previous connection,
            // create one and return it
            return database.connection;

        } else {
            // return existing connection to the database
            return database.connection;
        }
    },

    /**
     * deletes entries from table where whereLogic applies
     *
     * @param mysqlTableName    = {Object}      entry object from local 'database' object
     * @param whereLogic        = {String}      containing equality to use to target the selection of a specific row
     * @param callback          = {Function}    to call after operation has completed successfully
     *
     * for data protection, if @param whereLogic is 'null', nothing is deleted / returned
    **/
    deleteFrom : function(mysqlTableName, whereLogic, callback) {
        if(whereLogic) {
            // perform query only if whereLogic has been passed
            mysql.connect()
                .query('DELETE FROM ' + mysqlTableName + ' WHERE ' + (whereLogic || '1 = 1'), callback);
        } else {
            // fail and exit function with error
            callback.call(this, 'ERR: (mysqldatabasedeletionerror): no \'WHERE\' condition applies for selected logic.');
        }
    },

    /**
     * safely closes the mysql connection
    **/
    end : function() {
        if(mysql.isConnected) {
            // reset our flag to indicate no connection exists
            mysql.isConnected = false;

            // send close packet to server
            mysql.connection.end();
        }
    },

    /**
     * inserts new entry to mysql database
     *
     * @param mysqlTableName    = {Object}      entry object from local 'database' object
     * @param databaseColumns   = {Array}       containing names of mysql table columns to insert values into
     * @param valuesToAdd       = {Array}       containing entry values to add
     * @param callback          = {Function}    to call after operation has completed successfully
    **/
    insertInto : function(mysqlTableName, databaseColumns, valuesToAdd, callback) {
        // our values to add have to be in quotes. Add them to each value on the list
        valuesToAdd.forEach(function(value, index) {
            valuesToAdd[index] = '"' + value + '"';
        });

        // join arrays of column names and values to add by commas and add them to our query string
        mysql.connect()
            .query('INSERT INTO ' + mysqlTableName + '(' + (databaseColumns.join(',')) + ') VALUES (' + valuesToAdd.join(',') + ')', 
                // call user's callback function
                function(err) {
                    // get err param if any and pass it to callback before calling
                    callback.call(mysql, err);
                });
    },

    /**
     * selects entries from table, using passed logic
     *
     * @param mysqlTableName    = {Object}      entry object from local 'database' object
     * @param databaseColumns   = {Array}       containing names of mysql table columns to select
     * @param whereLogic        = {String}      containing equality to use to target the selection of a specific row
     * @param callback          = {Function}    to call after operation has completed successfully
     *
     * if @param whereLogic is 'null', all rows are selected and returned
    **/
    selectFrom : function(mysqlTableName, databaseColumns, whereLogic, callback) {
        // perform query
        mysql.connect()
            .query('SELECT ' + databaseColumns.join(',') + ' FROM ' + mysqlTableName + ' WHERE ' + (whereLogic || '1 = 1'), callback);
    },

    /**
     * updates entry in database table, using passed logic
     *
     * @param mysqlTableName    = {Object}      entry object from local 'database' object
     * @param databaseColumns   = {Array}       containing names of mysql table columns to update values
     * @param updatedValues     = {Array}       containing updated entry values
     * @param whereLogic        = {String}      containing equality to use to target the update of a specific row
     * @param callback          = {Function}    to call after operation has completed successfully
    **/
    update : function(mysqlTableName, databaseColumns, updatedValues, whereLogic, callback) {
        // variable containing key value pairs to update from arrays passed
        var keyValuePairs = '';

        // generate and store key-value pairs from our two arrays
        databaseColumns.forEach(function(column, index) {
            // add to our string of pairs
            keyValuePairs += ',' + column + ' = ' + '"' + updatedValues[index] + '"';
        });

        // strip comma from key value pairs string
        keyValuePairs = keyValuePairs.substring(1);

        // join arrays of column names and values to add by commas and add them to our query string
        mysql.connect()
            .query('UPDATE ' + mysqlTableName + ' SET ' + keyValuePairs + ' WHERE ' + (whereLogic || '1 = 1'), 
                // call user's callback function
                function(err) {
                    // get err param if any and pass it to callback before calling and exit
                    return callback.call(mysql, err);
                });
    }
};

// declare functions and methodical procedures

/**
 * Checks all incoming requests to see if routing is applicable to them.
 * Parses font file requests that contain queries in urls
 *
 * @return {String} routedRequest
 */
function requestRouter(request, response) {

    var requestURL = request.url;

    // modify font requests that have queries in url
    if(requestURL.match(/\.(woff|ttf)(\?)/gi)) {
        requestURL = requestURL.split('?')[0];
    }

    // return default request by default
    var requestToHandle = requestURL;
    var routedRequest   = requestURL;

    if(dictionaryOfRoutes.hasOwnProperty(requestToHandle)) {
        routedRequest = dictionaryOfRoutes[requestToHandle];
    }

    return routedRequest;

}

/**
 * Checks passed requests for a defined file Mime Type.
 *
 * @return {String} requestMimeType     a file mimetype of current request if defined, or a default .txt mime type 
 *                                      if request's mime type is not defined
 */
function mimeTypeParser(request, response) {

    var requestToHandle         = requestRouter(request, response);
    var requestMimeType         = dictionaryOfMimeTypes['txt'];

    // retrieve file extension from current request by grabbing
    // suffix after last period of request string
    var requestFileExtension    = requestToHandle.split('.');
    requestFileExtension        = requestFileExtension[requestFileExtension.length - 1];
    requestFileExtension        = requestFileExtension.split('&')[0];

    if(dictionaryOfMimeTypes.hasOwnProperty(requestFileExtension)) {
        requestMimeType = dictionaryOfMimeTypes[requestFileExtension];
    }

    return requestMimeType;
}

/**
 * Serves current request as a stream from a file on the server
 */
function handleRequestAsFileStream(request, response) {

    var requestToHandle = requestRouter(request, response);

    fs.readFile(__dirname + '/' + requestToHandle, function(error, data) {

        if(error) {

            console.log('File ' + requestToHandle + ' could not be served -> ' + error);
            
            response.writeHead(SERVER_HEAD_NOTFOUND);
            response.end(SERVER_RES_NOTFOUND);
        }

        response.writeHead(SERVER_HEAD_OK, {
            'Content-Type' : mimeTypeParser(request, response)
        });

        response.end(data);

    });

}

/**
 * Serves current request along with data from a specified api uri
 */
function handleRequestAsAPICall(request, response) {

    var APIURI          = request.url.split('/api/')[1];
    var APIResponseData = '';

    if(APIURI == '') {
        response.writeHead(SERVER_HEAD_ERROR);
        return response.end(SERVER_RES_ERROR);
    }

    https.get(APIURI, function(APIResponse) {

        APIResponse.on('data', function(chunk) {
            APIResponseData += chunk;
        });

        APIResponse.on('end', function() {
            response.writeHead(SERVER_HEAD_OK);
            response.end(APIResponseData);
        });

    }).on('error', function(error) {
        console.log('<HTTP.Get> ' + error.message);
        response.writeHead(SERVER_HEAD_ERROR);
        response.end(APIURI);
    });

}

/**
 * POSTs current api request to endpoint uri and returns response to client
 */
function handleRequestAsAPIPOSTCall(request, response) {

    var APIURI              = request.url.split('/api/post/')[1];
    var URIComponents       = url.parse(APIURI);
    var POSTDataFromClient  = '';
    var APIResponseData     = '';

    if(APIURI == '') {
        response.writeHead(SERVER_HEAD_ERROR);
        return response.end(SERVER_RES_ERROR);
    }

    // receive data to relay from client
    request.on('data', function(chunk) {
        POSTDataFromClient += chunk;
    });

    request.on('end', function() {

        var APIPostRequest = https.request({

            host    : URIComponents.host,
            path    : URIComponents.path,
            href    : URIComponents.href,
            method  : 'POST',
            headers : {
                'Content-Type' : request.headers['content-type']
            }

        }, function(APIResponse) {

            APIResponse.on('data', function(chunk) {
                APIResponseData += chunk;
            });

            APIResponse.on('end', function() {

                response.writeHead(SERVER_HEAD_OK, {
                    'Content-Type' : 'text/html',
                });

                console.log(APIResponseData);
                response.end(APIResponseData);

            });

        }).end(POSTDataFromClient);

    });
}

/**
 * handles requets as receiving data with GET method
 */
function handleRequestAsGETEndpoint(request, response) {

    var requestData = request.url.split('/echo/')[1];

    response.writeHead(SERVER_HEAD_OK, {
        'Access-Control-Allow-Origin' : '*'
    });

    response.end(requestData);
}

function handleRequestAsActionLogin(request, response) {

    if(request.method != 'POST') {
        response.writeHead(SERVER_HEAD_ERROR);
        response.end(SERVER_RES_POST_ERROR);
    }

    var postData = '';

    request.on('data', function(chunk) {
        postData += chunk;
    });

    request.on('end', function() {
        mysql.
    });

}

/**
 * handle all requests formed as /post and relay it back to the client
 */
function handleRequestAsPostData(request, response) {

    if(request.method != 'POST') {
        response.writeHead(SERVER_HEAD_ERROR);
        response.end(SERVER_RES_ERROR);
    }

    var postData = '';

    request.on('data', function(chunk) {
        postData += chunk;
    });

    request.on('end', function() {
        response.writeHead(SERVER_HEAD_OK);
        response.end(postData);
    });
}

/**
 * handle all initial application requests, assign routes, etc.
 */
function mainRequestHandler(request, response) {

        // assign global definition for current request being handled
        currentRequest = requestRouter(request, response);

        if(typeof currentRequest == 'function') {
            currentRequest(request, response);
        } else if(currentRequest.match(/^\/test(\/)?$/gi)) {
            response.writeHead(SERVER_HEAD_OK);
            response.end(SERVER_RES_OK);
        } else if(currentRequest.match(/^\/api\/post\/(.*)/gi)) {
            handleRequestAsAPIPOSTCall(request, response);
        } else if(currentRequest.match(/^\/api\/(.*)/gi)) {
            handleRequestAsAPICall(request, response);
        } else if(currentRequest.match(/^\/echo\/(.*)/gi)) {
            handleRequestAsGETEndpoint(request, response);
        } else {
            handleRequestAsFileStream(request, response);
        }
}

// initialize application
(function main(application) {

    // define global application server and bind to a specified port
    application = http.createServer(mainRequestHandler);
    application.listen(SERVER_PORT, SERVER_HOST);

})(application);
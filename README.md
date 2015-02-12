The OpenShift `nodejs` cartridge documentation can be found at:

http://openshift.github.io/documentation/oo_cartridge_guide.html#nodejs

###Endpoints

All requests originate from the following URL

```
http://lendme-dmnhackathon.rhcloud.com/
```

The server handles data based on the endpoint you request. To put or pull data from the database, use the format below:

```
/action/<login|post|put>
```

Requests that require parameters, using the `POST` method for example, are formatted as such:

```js
{
    parmeter1 : "parameter_value", 
    parmeter2 : "parameter_value"
}
```

Requests to any endpoints using the `/put` format must be done with a `POST` method. Think of them as actions that require data to be "pushed" to the server / database in order to obtain a result

- `login` takes two parameters
    - `username` String containing a user identifier
    - `password` String containing a user password

- `put` takes two parameters
    - `table` database table where row will 
    - `data` String of data to put into database

Requests to any endpoints using the `/get` must be done with a `GET` method. Think of them as actions that simply request specific data. Formats for this action are shown below:

- `<table_name>` String containing the name of the table where the item resides
- `<identifier_type>` How you plan on retrieving the data, by id, username, etc...
- `<identifier>` String containing the identifier of the item you wish to retrieve from the table (user_id, user_username)

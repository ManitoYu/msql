## Msql

This is a tool for building sql without any stress.  

With this tool, you can build a sql only by some paramters.

### Select

There is a demo referring to select some records.  
```
var Msql = require('msql');
var where = {
    id: 1,
    path: 'images/3.jpg',  
    $or: ['id|path']
};
var sql = Msql('img').where(where).select();
console.log(sql); // select * from img where id = 1 OR path = "images/3.jpg"
```

### Create

Then you can see the demo referring to create a new record as follow.  
```
var Mysql = require('msql');
var data = {
    path: 'path1',
    con: 'This is content'
};
var sql = Msql('img').create(data);
console.log(sql); // INSERT INTO img(path, con) VALUES ("path1", "This is a new record")
```



## Msql

This is a tool for building sql without any stress.  

With this tool, you can build a sql only by some paramters.

```
var Msql = require('Msql');
var where = {
    id: 1,
    path: 'images/3.jpg',  
    $or: ['id|path']
};
var sql = Msql('img').where(where).select();
console.log(sql); // select * from img where id = 1 OR path = "images/3.jpg"
```



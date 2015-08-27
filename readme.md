## Msql

This is a tool for building sql without any stress.  

With this tool, you can build a sql only by some paramters.  

If you love this tool, I hope you can star me at my github [ManitoYu](https://github.com/ManitoYu/msql).  

I am a chinese college student, and I want to try my best to contribute my code to the code world. So I hope you can support me.  

### Select

There is a demo referring to select some records.  

```js
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

```js
var Msql = require('msql');
var data = {
    path: 'path1',
    con: 'This is content'
};
var sql = Msql('img').create(data);
console.log(sql); // INSERT INTO img(path, con) VALUES ("path1", "This is a new record")
```

### Find

If you want to find only one record by primary key, you can config as follows.  

```js
var Msql = Msql('img').config({
    pk: 'id' // assign the primary key
});
var sql = Msql.find(1); // Then you can query according to pk
console.log(sql); // SELECT * FROM img where id = 1
```

Certainly, you can query without any config.  

```js
var sql = Msql('img').find({ id: 1 });
console.log(sql); // SELECT * FROM img where id = 1
```

### Field

If you don't want to query all of fields, you can assign the several fields by yourself.  

```js
var sql = Msql.field(['path']).find({ id: 1 }); // a list of fields
console.log(sql); // SELECT path FROM img where id = 1
```



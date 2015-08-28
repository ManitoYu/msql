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

### Update

Once you set assign the primay key of table, you can update a record as follow.  
Assumed that you will update a record which id is equal to 1, you can do it like this.  

```js
var Img = Msql('img').config({
    pk: 'id'
});
var sql = Img.update({ id: 1, path: 'path1' }); // specify the value of id, will update the record which id is 1
console.log(sql); // UPDATE img SET path = "path1" where id = 1
```

### Delete

if you specify the primary key, you can delete a record only by giving the value of pk.  

```js
var Img = Msql('img').config({
    pk: 'id'
});
var sql = Img.delete(1); // id = 1
console.log(sql); // DELETE FROM img where id = 1
```

And you can also delete it without any config.  

```js
var sql = Img.delete({ id: 1 }); 
console.log(sql); // DELETE FROM img where id = 1
```

### Where

* eq
* neq
* neq
* gt
* egt
* lt
* elt

```js
Img.where({ id: { $lt: 2 } }).select(); // SELECT * FROM img where (id < 2)
Img.where({ id: [{ $gt: 1 }, { elt: 4 }] }).select(); // SELECT * FROM img where ((id > 1) OR (id <= 4))
```

* like
* in

```js
Img.where({ path: { $like: 'con1' }, id: 3 }).select(); // SELECT * FROM img where (path like "con1") AND (id = 3)
Img.where({ id: { $in: [1, 2, 3, 4] } }).select(); // SELECT * FROM img where (id in (1, 2, 3, 4))
```

### Field
If you don't want to query all of fields, you can assign the several fields by yourself.  

```js
var sql = Msql.field(['path']).find({ id: 1 }); // a list of fields
console.log(sql); // SELECT path FROM img where id = 1
```



module.exports = (function Msql(table) {

    var _where, _field;

    
    var compileWhere = function (field, obj) {

        var condType = Object.keys(obj)[0];
        var condValue = obj[condType];
        var condReturn;

//        console.log(field, condType, obj[condType]);

        switch (condType) {
            case '$gt':
                condReturn = field + ' > ' + condValue;
                break;

            case '$lt':
                condReturn = field + ' < ' + condValue;
                break;

            case '$in':
                condValue = condValue.map(function (cv) {
                    if (typeof cv == 'string') {
                        return '\"' + cv + '\"';
                    } else {
                        return cv;
                    }
                });
                condReturn =  field + ' in ' + '(' + condValue.join(', ') + ')';
                break;

            case '$like':
                if (typeof condValue != 'object') {
                    return field + ' like \"' + condValue + '\"';
                }
                condReturn = condValue.map(function (itemValue) {
                    return field + ' like \"' + itemValue + '\"';
                }).join(' OR ');
                break;
        }
        return '(' + condReturn + ')';

    };


    var restriction = {
        options: {
            field: '*',
            table: table
        },
        setWhere: function (where) {
            this.options.where = where ? ' where ' + where : '';
        }
    };

    var sqlTemplate = {

        select: 'select {field} from {table}{where}'

    };

    // select more than one recoreds
    Msql.select = function () {
        return Msql.replace(sqlTemplate.select);
    };

    Msql.where = function (where) {
        var andWhere, orWhere, _or;

        orFields = [];
        andWhere = [];
        orWhere = [];
        orPairs = [];
        finalWhere = {};

        if (where.hasOwnProperty('$or')) {
            _or = where['$or'];
            delete where['$or'];

            orPairs = _or.map(function (itemOr) {
                var pair = itemOr.split('|');
                orFields.push(pair[0], pair[1]);
                return pair[0] + ' OR ' + pair[1];
            });
        }

        Object.keys(where).forEach(function (field) {

            var value = where[field];

            // 字符串
            if (typeof value == 'string') {
                finalWhere[field] = field + ' = \"' + escape(value) + '\"';
            }

            // 数字
            if (typeof value == 'number') {
                finalWhere[field] = field + ' = ' + escape(value);
            }

            // 对象
            if (typeof value == 'object') {
                // 数组
                if (Array.isArray(value)) {
                    // 遍历每一个条件
                    finalWhere[field] = '(' + value.map(function (itemValue) {
                        return compileWhere(field, itemValue);
                    }).join(' OR ') + ')';
                }
                // 对象
                else {
                     finalWhere[field] = compileWhere(field, value);
                }
            }

            orPairs = orPairs.map(function (pair) {
                return pair.replace(new RegExp('^(' + field + ')|\\s(' + field + ')', 'g'), ' ' + finalWhere[field]).trim();
            });
        });

        if (orPairs.length > 0) {
            // 遍历或条件
            for (var i = 0; i <= orPairs.length; i += 1) {
                andWhere.push(orPairs.pop());
            }
        }

        // 与条件
        Object.keys(finalWhere).forEach(function (field) {
            if (orFields.indexOf(field) == -1) {
                andWhere.push(finalWhere[field]);
            }
        });

        if (andWhere.length > 1) {
            // 一个与条件以上加上括号分隔
            restriction.setWhere(andWhere.map(function (itemWhere) {
                return '(' + itemWhere + ')';
            }).join(' AND '));
        } else {
            restriction.setWhere(andWhere[0]);
        }

        return Msql;
    };

    Msql.field = function (field) {
        _field = field;
        return Msql;
    };

    // find only one record
    Msql.find = function () {
        
    };

    // create a new record
    Msql.create = function () {
        
    };

    // update one or more record
    Msql.update = function () {
        
    };

    // delete one or more record
    Msql.delete = function () {
        
    };
    
    Msql.replace = function (sqlTemp) {
        var sql = sqlTemp;
        var rep = restriction.options;
        // 遍历传入的约束条件
        Object.keys(rep).forEach(function (key) {
           sql = sql.replace(new RegExp('{' + key + '}', 'g'), rep[key]);
        });
        return sql;
    };
    
    return Msql;

});
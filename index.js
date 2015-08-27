var utils = require('./lib/utils');

var configAllowed = ['pk'];
var configStorage = {};

function Msql(table) {


    var config = configStorage[table] || {};

    var restriction = {
        pairs: {
            field: '*',
            table: table
        },
        setWhere: function (where) {
            this.pairs.where = where ? ' where ' + where : '';
        },
        setField: function (fields) {
            this.pairs.field = fields.join(', ');
        },
        setCreate: function (createObj) {
            this.pairs.createKey = createObj.createKey;
            this.pairs.createValue = createObj.createValue;
        }
    };

    var sqlTemplate = {

        select: 'SELECT {field} FROM {table}{where}',
        create: 'INSERT INTO {table}{createKey} VALUES {createValue}'

    };

    Msql.config = function (conf) {

        if (! conf) {
            return Msql;
        }

        configStorage[table] = {};

        Object.keys(conf).forEach(function (item) {
            if (configAllowed.indexOf(item) != -1) {
                configStorage[table][item] = conf[item];
            }
        });
        return Msql(table);

    };
    
    // select more than one recoreds
    Msql.select = function () {
        return utils.buildSql(sqlTemplate.select, restriction.pairs);
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
                finalWhere[field] = field + ' = \"' + utils.escape(value) + '\"';
            }

            // 数字
            if (typeof value == 'number') {
                finalWhere[field] = field + ' = ' + value;
            }

            // 对象
            if (typeof value == 'object') {
                // 数组
                if (Array.isArray(value)) {
                    // 遍历每一个条件
                    finalWhere[field] = '(' + value.map(function (itemValue) {
                        return utils.compileWhere(field, itemValue);
                    }).join(' OR ') + ')';
                }
                // 对象
                else {
                     finalWhere[field] = utils.compileWhere(field, value);
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

    Msql.field = function (fields) {
        restriction.setField(fields);
        return Msql;
    };

    // find only one record
    Msql.find = function (query) {
        if (typeof query != 'object') {
            if (! config['pk']) {
                throw new Error('you may forget set the field served as primary key');
            }
            restriction.setWhere(config['pk'] + ' = ' + query);
        } else {
            var field = Object.keys(query)[0];
            restriction.setWhere(field + ' = ' + query[field]);
        }
        return utils.buildSql(sqlTemplate.select, restriction.pairs);
    };

    // create a new record
    Msql.create = function (newObj) {
        // 获取值列表
        var values = Object.keys(newObj).map(function (field) {
            if (typeof newObj[field] == 'string') {
                return '\"' + utils.escape(newObj[field]) + '\"';
            }
            return newObj[field];
        });
        restriction.setCreate({
            createKey: '(' + Object.keys(newObj).join(', ') + ')',
            createValue: '(' + values.join(', ') + ')'
        });
        return Msql.buildSql(sqlTemplate.create);
    };

    // update one or more record
    Msql.update = function (query) {
        
    };

    // delete one or more record
    Msql.delete = function (query) {
        
    };

    return Msql;

}

module.exports = Msql;
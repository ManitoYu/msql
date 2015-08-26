module.exports = (function Msql(table) {

    // 比较操作
    var _condCompareObj = {
        $eq: ' = ',
        $neq: ' <> ',
        $gt: ' > ',
        $egt: ' >= ',
        $lt: ' < ',
        $elt: ' <= '
    };
    var _condCompareKeys = Object.keys(_condCompareObj);

    // 编译where条件
    var compileWhere = function (field, obj) {

        var condType = Object.keys(obj)[0];
        var condValue = obj[condType];
        var condReturn;

//       console.log(field, condType, obj[condType]);

        switch (true) {
            case _condCompareKeys.indexOf(condType) != -1:
                condReturn = field + _condCompareObj[condType] + condValue;
                break;

            case condType == '$in':
                condValue = condValue.map(function (cv) {
                    if (typeof cv == 'string') {
                        return '\"' + escape(cv) + '\"';
                    } else {
                        return cv;
                    }
                });
                condReturn =  field + ' in ' + '(' + condValue.join(', ') + ')';
                break;

            case condType == '$like':
                // 单个like查询
                if (typeof condValue != 'object') {
                    return field + ' like \"' + condValue + '\"';
                }
                // 多个like查询
                condReturn = condValue.map(function (itemValue) {
                    return field + ' like \"' + itemValue + '\"';
                }).join(' OR ');
                break;

            default:
                throw new Error('not allowed query type: ' + condType);
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
        },
        setField: function (fields) {
            this.options.field = fields.join(', ');
        },
        setCreate: function (createObj) {
            this.options.createKey = createObj.createKey;
            this.options.createValue = createObj.createValue;
        }
    };

    var sqlTemplate = {

        select: 'SELECT {field} FROM {table}{where}',
        create: 'INSERT INTO {table}{createKey} VALUES {createValue}'

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
                finalWhere[field] = field + ' = \"' + Msql.escape(value) + '\"';
            }

            // 数字
            if (typeof value == 'number') {
                finalWhere[field] = field + ' = ' + Msql.escape(value);
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

    Msql.field = function (fields) {
        restriction.setField(fields);
        return Msql;
    };

    // find only one record
    Msql.find = function (query) {
        
    };

    // create a new record
    Msql.create = function (newObj) {
        // 获取值列表
        var values = Object.keys(newObj).map(function (field) {
            if (typeof newObj[field] == 'string') {
                return '\"' + Msql.escape(newObj[field]) + '\"';
            }
            return newObj[field];
        });
        restriction.setCreate({
            createKey: '(' + Object.keys(newObj).join(', ') + ')',
            createValue: '(' + values.join(', ') + ')'
        });
        return Msql.replace(sqlTemplate.create);
    };

    // update one or more record
    Msql.update = function (query) {
        
    };

    // delete one or more record
    Msql.delete = function (query) {
        
    };
    
    Msql.replace = function (sqlTemp) {
        var sql = sqlTemp;
        var rep = restriction.options;
        console.log(rep);
        // 遍历传入的约束条件
        Object.keys(rep).forEach(function (key) {
           sql = sql.replace(new RegExp('{' + key + '}', 'g'), rep[key]);
        });
        return sql;
    };

    Msql.escape = function (value) {
        return value.replace(/([\'\"])/g, '\\$1');
    }
    
    return Msql;

});
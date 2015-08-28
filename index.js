var configAllowed = ['pk'];
var configStorage = {};

var restriction = {
    pairs: {
        field: '*',
    },
    setTable: function (table) {
        this.pairs.table = table;
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
    },
    setLimit: function () {
        var args = arguments[0];
        switch (args.length) {
            case 1:
                this.pairs.limit = ' LIMIT ' + args[0];
                break;

            case 2:
                this.pairs.limit = ' LIMIT ' + args[0] + ', ' + args[1];
                break;

            default:
                throw new Error('limit may exists paramters error');
        }
    },
    setKeyAndValue: function (kv) {
        this.pairs.keyAndValue = kv;
    },
    clear: function (table) {
        this.pairs = {
            field: '*',
            table: table
        };
    }
};

var sqlTemplate = {

    select: 'SELECT {field} FROM {table}{where}{limit}',
    create: 'INSERT INTO {table}{createKey} VALUES {createValue}',
    update: 'UPDATE {table} SET {keyAndValue}{where}{limit}',
    delete: 'DELETE FROM {table}{where}'

};

var utils = {

    /**
     * 编译sql语句
     *
     * @param sqlTemp
     * @returns {*}
     */
    buildSql: function (sqlTemp) {
        var sql = sqlTemp;
        var rep = restriction.pairs;
        // 遍历传入的约束条件
        Object.keys(rep).forEach(function (key) {
            sql = sql.replace(new RegExp('{' + key + '}', 'g'), rep[key]);
        });
        sql = sql.replace(/{\w+}/ig, '');
        restriction.clear(rep.table);
        return sql;
    },

    /**
     * 编译where条件
     *
     * @param field
     * @param obj
     * @returns {string}
     */
    compileWhere: function (field, obj) {

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

        var condType = Object.keys(obj)[0];
        var condValue = obj[condType];
        var condReturn;

    //  console.log(field, condType, obj[condType]);

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
    },

    /**
     * 单双引号过滤
     *
     * @param value
     * @returns {string}
     */
    escape: function (value) {
        return '\"' + value.replace(/([\'\"])/g, '\\$1') + '\"';
    },

}

function Msql(table) {

    // 获取配置
    var config = configStorage[table] || {};

    // 设置当前活动表
    restriction.setTable(table);

    /**
     * 配置
     *
     * @param conf
     * @returns {*}
     */
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

    /**
     * 查询多条记录
     *
     * @returns {*}
     */
    Msql.select = function () {
        return utils.buildSql(sqlTemplate.select, restriction.pairs);
    };

    /**
     * 查询单条记录
     *
     * @param query
     * @returns {*}
     */
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
        restriction.setLimit({ 0: 1 });
        return utils.buildSql(sqlTemplate.select);
    };

    /**
     * 创建新记录
     *
     * @param newObj
     * @returns {*}
     */
    Msql.create = function (newObj) {
        // 获取值列表
        var values = Object.keys(newObj).map(function (field) {
            if (typeof newObj[field] == 'string') {
                return utils.escape(newObj[field]);
            }
            return newObj[field];
        });
        restriction.setCreate({
            createKey: '(' + Object.keys(newObj).join(', ') + ')',
            createValue: '(' + values.join(', ') + ')'
        });
        return utils.buildSql(sqlTemplate.create);
    };

    /**
     * 更新记录
     *
     * @param query
     * @returns {*}
     */
    Msql.update = function (query) {
        if (! restriction.pairs.where) {
            restriction.setWhere(config['pk'] + ' = ' + query['id']);
            delete query['id'];
        }
        var kv = Object.keys(query).map(function (item) {
            var value = query[item];
            return item + ' = ' + (typeof value == 'string' ? utils.escape(value) : value);
        }).join(', ');
        restriction.setKeyAndValue(kv);

        return utils.buildSql(sqlTemplate.update);
    };

    /**
     * 删除记录
     * @param query
     * @returns {*}
     */
    Msql.delete = function (query) {
        if (typeof query != 'object') {
            restriction.setWhere(config['pk'] + ' = ' + query);
        }
        if (typeof query == 'object') {
            var field = Object.keys(query)[0];
            var value = query[field];
            restriction.setWhere(field + ' = ' + (typeof value == 'string' ? utils.escape(value) : value));
        }
        return utils.buildSql(sqlTemplate.delete);
    };

    /**
     * where限制
     *
     * @param where
     * @returns {Msql}
     */
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
                finalWhere[field] = field + ' = ' + utils.escape(value);
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

    /**
     * 字段限制
     *
     * @param fields
     * @returns {Msql}
     */
    Msql.field = function (fields) {
        restriction.setField(fields);
        return Msql;
    };

    /**
     * 查询条数限制
     */
    Msql.limit = function () {
        restriction.setLimit(arguments);
        return Msql;
    }

    return Msql;
}

module.exports = Msql;
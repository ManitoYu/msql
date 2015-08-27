/**
 * 编译where条件
 *
 * @param field
 * @param obj
 * @returns {string}
 */
exports.compileWhere = function (field, obj) {

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

/**
 * 构建sql语句
 *
 * @param sqlTemp
 * @param pairs
 * @returns {*}
 */
exports.buildSql = function (sqlTemp, pairs) {
    var sql = sqlTemp;
    var rep = pairs;
    // 遍历传入的约束条件
    Object.keys(rep).forEach(function (key) {
        sql = sql.replace(new RegExp('{' + key + '}', 'g'), rep[key]);
    });
    return sql;
};

/**
 * 转义单双引号
 *
 * @param value
 * @returns {*|XML|string|void}
 */
exports.escape = function (value) {
    return value.replace(/([\'\"])/g, '\\$1');
};
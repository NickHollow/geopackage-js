/**
 * Dao module.
 * @module dao/dao
 */

import sqliteQueryBuilder from '../db/sqliteQueryBuilder'
import ColumnValues from './columnValues'

/**
 * Base DAO
 * @class Dao
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 */
class Dao {
  constructor(geoPackage) {
    /**
     * GeoPackage object this dao belongs to
     * @type {module:geoPackage~GeoPackage}
     */
    this.geoPackage = geoPackage;
    /**
     * Database connection to the sqlite file
     * @type {module:db/geoPackageConnection~GeoPackageConnection}
     */
    this.connection = geoPackage.getDatabase();
  }
  /**
   * Copies object properties from result object to the object
   * @param  {Object} object object to copy properties to
   * @param  {Object} result object to copy properties from
   */
  populateObjectFromResult(object, result) {
    if (!result)
      return object;
    for (var key in result) {
      object[key] = result[key];
    }
  }
  /**
   * Checks if the table exists
   * @return  {Boolean}
   */
  isTableExists() {
    var results = this.connection.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [this.gpkgTableName]);
    return !!results;
  }
  /**
   * Refreshes the object by id
   * @param  {Object} object object to refresh
   * @return {Object}
   */
  refresh(object) {
    return this.queryForSameId(object);
  }
  /**
   * Query for object by id
   * @param  {object} id ID of the object to query for
   * @return {Object} object created from the raw database object
   */
  queryForId(id) {
    var whereString = this.buildPkWhere(id);
    var whereArgs = this.buildPkWhereArgs(id);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString);
    var result = this.connection.get(query, whereArgs);
    if (!result)
      return;
    var object = this.createObject(result);
    // TOOD something is wrong here
    this.populateObjectFromResult(object, result);
    return object;
  }
  queryForSameId(object) {
    var idArray = this.getMultiId(object);
    return this.queryForMultiId(idArray);
  }
  getMultiId(object) {
    var idValues = [];
    for (var i = 0; i < this.idColumns.length; i++) {
      var idValue = object.values ? object.values[this.idColumns[i]] : object[this.idColumns[i]];
      if (idValue !== undefined) {
        idValues.push(idValue);
      }
    }
    return idValues;
  }
  /**
   * Query for object by multi id
   * @param  {module:dao/columnValues~ColumnValues} idValues ColumnValues with the multi id
   * @return {Object} object created from the raw database object
   */
  queryForMultiId(idValues) {
    var whereString = this.buildPkWhere(idValues);
    var whereArgs = this.buildPkWhereArgs(idValues);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString);
    var result = this.connection.get(query, whereArgs);
    if (!result)
      return;
    var object = this.createObject(result);
    this.populateObjectFromResult(object, result);
    return object;
  }
  /**
   * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
   * @param  {string} [where]     Optional where clause
   * @param  {object[]} [whereArgs] Optional where args array
   * @return {Object[]} raw object array from the database
   */
  queryForAll(where, whereArgs) {
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, where);
    return this.connection.all(query, whereArgs);
  }
  /**
   * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
   * @param  {string} fieldName name of the field to query for
   * @param  {string} value     value of the like clause
   * @return {Object[]} raw object array from the database
   */
  queryForLike(fieldName, value) {
    var values = new ColumnValues();
    values.addColumn(fieldName, value);
    var where = this.buildWhereLike(values);
    var whereArgs = this.buildWhereArgs(value);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, where);
    return this.connection.all(query, whereArgs);
  }
  /**
   * Queries for all matches and returns them.  Only queries for the specified column name  Be aware this pulls all results into memory
   * @param {string}  columnName  name of the column to query for
   * @param {module:dao/columnValues~ColumnValues} [fieldValues] optional values to filter on
   * @return {Object[]} raw object array from the database
   */
  queryForColumns(columnName, fieldValues) {
    var where;
    var whereArgs;
    if (fieldValues) {
      where = this.buildWhere(fieldValues);
      whereArgs = this.buildWhereArgs(fieldValues);
    }
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", [columnName], where);
    return this.connection.all(query, whereArgs);
  }
  /**
   * Queries for all items in the table with a page size and page number
   * @param  {Number} pageSize size of the chunk to query for
   * @param  {Number} page     chunk number to query for
   * @return {Object[]} raw object array from the database
   */
  queryForChunk(pageSize, page) {
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, undefined, undefined, undefined, undefined, this.idColumns[0], pageSize, page * pageSize);
    return this.connection.all(query);
  }
  /**
   * Iterate all items in the table one at a time.  If no parameters are passed, iterates the entire table.  Returns an Iterable object
   * @param  {string} [field]   field to filter on
   * @param  {Object} [value]   value to filter on
   * @param  {string} [groupBy] group by clause
   * @param  {string} [having]  having clause
   * @param  {string} [orderBy] order by clause
   * @return {Iterable} iterable of database objects
   */
  queryForEach(field, value, groupBy, having, orderBy) {
    if (!field) {
      var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'");
      var count = 0;
      return this.connection.each(query);
    }
    else {
      var whereString = this.buildWhereWithFieldAndValue(field, value);
      var whereArgs = this.buildWhereArgs(value);
      var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString);
      return this.connection.each(query, whereArgs);
    }
  }
  rawQueryForEach(query, queryArgs) {
    return this.connection.each(query, queryArgs);
  }
  /**
   * Iterate all rows in the table that match the given values.
   *
   * @param {module:dao/columnValues~ColumnValues} fieldValues column values to match
   * @return {Iterable<object>}
   * @todo this method will throw an error if the iterator is not exhausted
   */
  queryForFieldValues(fieldValues) {
    var whereString = this.buildWhere(fieldValues);
    var whereArgs = this.buildWhereArgs(fieldValues);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString);
    return this.connection.each(query, whereArgs);
  }
  /**
   * Query for and return the first row that matches the given values.
   *
   * @param {module:dao/columnValues~ColumnValues} fieldValues column values to match
   * @return {?object} the first matching row or null
   */
  queryForFirstFieldValues(fieldValues) {
    var whereString = this.buildWhere(fieldValues);
    var whereArgs = this.buildWhereArgs(fieldValues);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString);
    return this.connection.get(query, whereArgs);
  }
  /**
   * Iterate all matching objects
   * @param  {string} join      join clause
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs array of where query values
   * @param  {string[]} columns   columns to query for
   * @return {Iterable.<Object>}
   */
  queryJoinWhereWithArgs(join, where, whereArgs, columns) {
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", columns, where, join);
    var count = 0;
    return this.connection.each(query, whereArgs);
  }
  /**
   * Iterate all distinct matching rows in the table
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs array of where query values
   * @return {Iterable.<Object>}
   */
  queryWhereWithArgsDistinct(where, whereArgs) {
    var query = sqliteQueryBuilder.buildQuery(true, "'" + this.gpkgTableName + "'", undefined, where);
    var count = 0;
    return this.connection.each(query, whereArgs);
  }
  /**
   * Iterate all matching rows
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] array of where query values
   * @param  {string} [groupBy]   group by clause
   * @param  {string} [having]    having clause
   * @param  {string} [orderBy]   order by clause
   * @param  {string} [limit]     limit clause
   * @return {Iterable.<Object>}
   */
  queryWhere(where, whereArgs, groupBy, having, orderBy, limit) {
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, where, undefined, groupBy, having, orderBy, limit);
    return this.connection.each(query, whereArgs);
  }
  /**
   * Get the primary key where clause
   * @param  {Object|Object[]} idValue id
   * @return {string} primary key where clause
   */
  buildPkWhere(idValue) {
    if (Array.isArray(idValue)) {
      var idValuesArray = idValue;
      var idColumnValues = new ColumnValues();
      for (var i = 0; i < idValuesArray.length; i++) {
        idColumnValues.addColumn(this.idColumns[i], idValuesArray[i]);
      }
      return this.buildWhere(idColumnValues);
    }
    return this.buildWhereWithFieldAndValue(this.idColumns, idValue);
  }
  /**
   * Get the primary key where args
   * @param  {Object} idValue id
   * @return {Object[]} where args
   */
  buildPkWhereArgs(idValue) {
    if (Array.isArray(idValue)) {
      var idValuesArray = idValue;
      var values = [];
      for (var i = 0; i < idValuesArray.length; i++) {
        values = values.concat(this.buildWhereArgs(idValuesArray[i]));
      }
      return values;
    }
    return this.buildWhereArgs(idValue);
  }
  /**
   * Build where (or selection) LIKE statement for fields
   * @param  {module:dao/columnValues~ColumnValues} fields    columns and values
   * @param  {string} operation AND or OR
   * @return {string} where clause
   */
  buildWhereLike(fields, operation) {
    var whereString = '';
    for (var i = 0; i < fields.columns.length; i++) {
      var column = fields.columns[i];
      if (i) {
        whereString += ' ' + operation + ' ';
      }
      whereString += this.buildWhereWithFieldAndValue(column, fields.getValue(column), 'like');
    }
    return whereString;
  }
  /**
   * Build where or selection statement for fields
   * @param  {module:dao/columnValues~ColumnValues} fields    columns and values
   * @param  {string} [operation=AND] AND or OR
   * @return {string} where clause
   */
  buildWhere(fields, operation) {
    operation = operation || 'and';
    var whereString = '';
    for (var i = 0; i < fields.columns.length; i++) {
      var column = fields.columns[i];
      if (i) {
        whereString += ' ' + operation + ' ';
      }
      whereString += this.buildWhereWithFieldAndValue(column, fields.getValue(column));
    }
    return whereString;
  }
  buildWhereArgs(values) {
    var args = [];
    if (Array.isArray(values)) {
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (value !== undefined && value !== null) {
          args.push(value);
        }
      }
    }
    else if (values.columns) {
      for (var i = 0; i < values.columns.length; i++) {
        var column = values.columns[i];
        var value = values.getValue(column);
        if (value !== undefined && value !== null) {
          args.push(value);
        }
      }
    }
    else {
      if (values !== undefined || values !== null) {
        args.push(values);
      }
    }
    return args.count ? null : args;
  }
  /**
   * Builds a where clause from the field and value with an optional operation.  If the value is empty, 'is null' is added to the query for the field
   * @param  {string} field     field name
   * @param  {Object} [value]     optional value to filter on
   * @param  {string} [operation='='] optional operation
   * @return {string} where clause
   */
  buildWhereWithFieldAndValue(field, value, operation) {
    operation = operation || '=';
    var whereString = '' + field + ' ';
    if (value === undefined || value === null) {
      whereString += "is null";
    }
    else {
      whereString += operation + ' ?';
    }
    return whereString;
  }
  /**
   * Query for all rows in the table that match
   * @param  {string} field   field to match
   * @param  {string} value   value to match
   * @param  {string} [groupBy] group by clause
   * @param  {string} [having]  having clause
   * @param  {string} [orderBy] order by clause
   * @return {Object[]} array of raw database objects
   */
  queryForAllEq(field, value, groupBy, having, orderBy) {
    var whereString = this.buildWhereWithFieldAndValue(field, value);
    var whereArgs = this.buildWhereArgs(value);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString, undefined, groupBy, having, orderBy);
    return this.connection.all(query, whereArgs);
  }
  /**
   * Count rows in the table optionally filtered by the parameters specified
   * @param  {module:dao/columnValues~ColumnValues|string} [fields] Either a ColumnValues object or a string specifying a field name
   * @param  {Object} [value]  value to filter on if fields is a string
   * @return {Number} count of objects
   */
  count(fields, value) {
    if (!fields) {
      return this.connection.count(this.gpkgTableName);
    }
    var where;
    var whereArgs;
    var query;
    if (fields.columns) {
      where = this.buildWhere(fields, 'and');
      whereArgs = this.buildWhereArgs(fields);
      query = sqliteQueryBuilder.buildCount("'" + this.gpkgTableName + "'", where);
    }
    else {
      where = this.buildWhereWithFieldAndValue(fields, value);
      whereArgs = this.buildWhereArgs(value);
      query = sqliteQueryBuilder.buildCount("'" + this.gpkgTableName + "'", where);
    }
    try {
      var result = this.connection.get(query, whereArgs);
      return result.count;
    } catch (e) {
      return 0;
    }
  }
  /**
   * Get the min of the column
   * @param  {string} column    column name
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] where args
   * @return {Number}
   */
  minOfColumn(column, where, whereArgs) {
    return this.connection.minOfColumn("'" + this.gpkgTableName + "'", column, where, whereArgs);
  }
  /**
   * Get the max of the column
   * @param  {string} column    column name
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] where args
   * @return {Number}
   */
  maxOfColumn(column, where, whereArgs) {
    return this.connection.maxOfColumn("'" + this.gpkgTableName + "'", column, where, whereArgs);
  }
  /**
   * Delete the object passed in.  Object is deleted by id
   * @param  {Object} object object to delete
   * @return {Number} number of objects deleted
   */
  delete(object) {
    if (object.getId) {
      return this.deleteById(object.getId());
    }
    return this.deleteByMultiId(this.getMultiId(object));
  }
  /**
   * Delete the object specified by the id
   * @param  {Object} idValue id value
   * @return {Number} number of objects deleted
   */
  deleteById(idValue) {
    var where = this.buildPkWhere(idValue);
    var whereArgs = this.buildPkWhereArgs(idValue);
    return this.connection.delete("'" + this.gpkgTableName + "'", where, whereArgs);
  }
  /**
   * Delete the object specified by the ids
   * @param  {module:dao/columnValues~ColumnValues} idValue id values
   * @return {Number} number of objects deleted
   */
  deleteByMultiId(idValues) {
    var where = this.buildPkWhere(idValues);
    var whereArgs = this.buildPkWhereArgs(idValues);
    return this.connection.delete("'" + this.gpkgTableName + "'", where, whereArgs);
  }
  /**
   * Delete objects that match the query
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs where arguments
   * @return {Number} number of objects deleted
   */
  deleteWhere(where, whereArgs) {
    return this.connection.delete("'" + this.gpkgTableName + "'", where, whereArgs);
  }
  /**
   * Delete all objects in the table
   * @return {Number} number of objects deleted
   */
  deleteAll() {
    return this.connection.delete("'" + this.gpkgTableName + "'", null, null);
  }
  /**
   * Insert the object into the table
   * @param  {Object} object object to be inserted
   * @return {module:db/adapter~ROWID} id of the inserted object
   */
  create(object) {
    var sql = sqliteQueryBuilder.buildInsert("'" + this.gpkgTableName + "'", object);
    var insertObject = sqliteQueryBuilder.buildUpdateOrInsertObject(object);
    return this.connection.insert(sql, insertObject);
  }
  /**
   * Update all rows that match the query
   * @param  {module:dao/columnValues~ColumnValues} values    values to insert
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs where arguments
   * @return {module:db/adapter~DBWriteResult} from [`GeoPackageConnection.run()`]{@link module:db/geoPackageConnection~GeoPacakgeConnection#run}
   */
  updateWithValues(values, where, whereArgs) {
    var update = sqliteQueryBuilder.buildUpdate("'" + this.gpkgTableName + "'", values, where, whereArgs);
    return this.connection.run(update.sql, update.args);
  }
  /**
   * Update the object specified
   * @param  {Object} object object with updated values
   * @return {module:db/adapter~DBWriteResult} from [`GeoPackageConnection.run()`]{@link module:db/geoPackageConnection~GeoPacakgeConnection#run}
   */
  update(object) {
    var updateValues = sqliteQueryBuilder.buildUpdateOrInsertObject(object);
    var update = sqliteQueryBuilder.buildObjectUpdate("'" + this.gpkgTableName + "'", object);
    var multiId = this.getMultiId(object);
    if (multiId.length) {
      var where = ' where ';
      for (var i = 0; i < multiId.length; i++) {
        where += '"' + this.idColumns[i] + '" = $' + sqliteQueryBuilder.fixColumnName(this.idColumns[i]);
        updateValues[sqliteQueryBuilder.fixColumnName(this.idColumns[i])] = multiId[i];
      }
      update += where;
    }
    return this.connection.run(update, updateValues);
  }
  /**
   * Query for the given object by ID, and if it exists, update its database
   * record.  Otherwise, create a new database record from the given object.
   * Return a [`DBWriteResult`]{@link module:db/adapter~DBWriteResult} if an
   * update occurs, or a [`ROWID`]{@link module:db/adapter~ROWID} if a new record
   * is created.
   *
   * @param  {Object} object object to update or create
   * @return ({module:db/adapter~ROWID | {module:db/adapter~DBWriteResult})
   * @todo return only one type of value
   */
  createOrUpdate(object) {
    var existing = this.queryForSameId(object);
    if (!existing) {
      return this.create(object);
    }
    else {
      return this.update(object);
    }
  }
  /**
   * Drops this table
   * @return {Number} results of the drop
   */
  dropTable() {
    return this.connection.dropTable(this.gpkgTableName);
  }
  rename(newName) {
    var result = this.connection.run('ALTER TABLE ' + '"' + this.gpkgTableName + '" RENAME TO "' + newName + '"');
    this.gpkgTableName = newName;
  }
}

export default Dao;

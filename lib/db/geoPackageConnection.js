/**
 * Connection to the SQLite file
 * @module db/geoPackageConnection
 */

import GeoPackageConstants from '../geoPackageConstants'
// #if IS_NOT_BROWSER
import SqliteAdapter from './sqliteAdapter'
// #endif
// #if IS_BROWSER
import SqljsAdapter from './sqljsAdapter'
// #endif

if (typeof(process) !== 'undefined' && process.platform !== 'browser' && process.version && !process.env.FORCE_SQLJS) {
  console.log('Better SQLite');
} else {
  console.log('SQL.js');
}

/**
 * Creates a connection to the SQLite file and when connected, returns a promise that resolves the connection.
 * This will create a {module:db/sqliteAdapter~Adapter} if running in node and the FORCE_SQLJS environment variable is not set.
 * This will create a {module:db/sqljsAdapter~Adapter} if running in the browser or the FORCE_SQLJS environment variable is set
 * @see {module:db/sqliteAdapter~Adapter}
 * @see {module:db/sqljsAdapter~Adapter}
 * @class
 * @param  {string} filePath path to the sqlite file
 * @return {Promise<module:db/geoPackageConnection~GeoPackageConnection>}
 * @todo change this constructor to return an actual `GeoPackageConnection` instance instead of a `Promise`
 */
class GeoPackageConnection {
  constructor(filePath) {
    this.filePath = filePath
    if (typeof (process) !== 'undefined' && process.platform !== 'browser' && process.version && !process.env.FORCE_SQLJS) {
      this.adapterCreator = SqliteAdapter;
    }
    else {
      this.adapterCreator = SqljsAdapter;
    }
  }

  async connect() {
    this.adapter = await this.adapterCreator.createAdapter(this.filePath)
    return this;
  }
  /**
   * Close the database.
   */
  close() {
    this.adapter.close();
  }
  /**
   * exports the GeoPackage as a file
   * @return {Buffer} buffer containing the contents of the file
   */
  export() {
    return this.adapter.export();
  }
  /**
   * Gets the raw connection to the database
   * @return {Object}
   */
  getDBConnection() {
    return this.adapter.db;
  }
  /**
   * Connects to a GeoPackage database
   * @param  {Object} db database to connect to
   * @return {(module:db/sqliteAdapter~Adapter|module:db/sqljsAdapter~Adapter)}
   */
  setDBConnection(db) {
    return this.adapter = this.adapterCreator.createAdapterFromDb(db);
  }
  /**
  * Registers the given function so that it can be used by SQL statements
  * @param  {string} name               name of function to register
  * @param  {Function} functionDefinition function to register
  * @return {(module:db/sqliteAdapter~Adapter|module:db/sqljsAdapter~Adapter)} the adapter in use
  */
  registerFunction(name, functionDefinition) {
    this.adapter.registerFunction(name, functionDefinition);
    return this.adapter;
  }
  /**
   * Gets the first result from the query
   * @param  {string} sql    sql query to run
   * @param  {Array|Object} [params] array of substitution parameters
   * @return {object}
   */
  get(sql, params) {
    return this.adapter.get(sql, params);
  }
  /**
   * Run the given SQL and return the results.
   * @param  {string} sql    sql to run
   * @param  {Array|Object} [params] array of substitution parameters
   * @return {@module:db/adapter~DBWriteResult}
   */
  run(sql, params) {
    return this.adapter.run(sql, params);
  }
  /**
   * Executes the query and returns all results in an array
   * @param  {string} sql sql to run
   * @param  {Array|Object} [params] substitution parameters
   * @return {Object[]}
   */
  all(sql, params) {
    return this.adapter.all(sql, params);
  }
  /**
   * Executes the query and returns an Iterable object of results
   * @param  {string} sql    sql to run
   * @param  {Array|Object} [params] substitution parameters
   * @return {Iterable<Object>}
   */
  each(sql, params) {
    return this.adapter.each(sql, params);
  }
  /**
   * Gets the minimum value from the column
   * @param  {string} table     table to query
   * @param  {string} column    column to get the min value from
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {Object}
   */
  minOfColumn(table, column, where, whereArgs) {
    var minStatement = 'select min(' + column + ') as min from ' + table;
    if (where) {
      minStatement += ' ';
      if (where.indexOf('where')) {
        where = 'where ' + where;
      }
      minStatement += where;
    }
    return this.adapter.get(minStatement, whereArgs).min;
  }
  /**
   * Gets the maximum value from the column
   * @param  {string} table     table to query
   * @param  {string} column    column to get the max value from
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {Object}
   */
  maxOfColumn(table, column, where, whereArgs, callback) {
    var maxStatement = 'select max(' + column + ') as max from ' + table;
    if (where) {
      maxStatement += ' ';
      if (where.indexOf('where')) {
        where = 'where ' + where;
      }
      maxStatement += where;
    }
    return this.adapter.get(maxStatement, whereArgs).max;
  }
  /**
   * Return the count of objects in the table
   * @param  {string} table table name
   * @param  {string} [where] where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {Number}
   */
  count(table, where, whereArgs) {
    return this.adapter.count(table, where, whereArgs);
  }
  /**
   * Execute the given `INSERT` statement and return the ID of the last row
   * inserted.
   * @param  {string} sql SQL insert statement
   * @param  {Array|Object} params substitution parameters
   * @return {module:db/adapter~ROWID} ID of the last row inserted
   */
  insert(sql, params) {
    return this.adapter.insert(sql, params);
  }
  /**
   * Delete rows from the table of the given name.
   * @param  {string} tableName table name to delete from
   * @param  {string} [where] where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {Number} number of rows deleted
   */
  delete(tableName, where, whereArgs) {
    var deleteStatement = 'DELETE FROM ' + tableName + '';
    if (where) {
      deleteStatement += ' WHERE ' + where;
    }
    return this.adapter.delete(deleteStatement, whereArgs);
  }
  /**
   * Drop the table with the given name.
   * @param  {string} tableName table to drop
   * @return {Boolean} results of table drop
   */
  dropTable(tableName) {
    return this.adapter.dropTable(tableName);
  }
  /**
   * Gets information about the table specified.  If data is returned, the table exists
   * @param  {string} tableName table to check
   * @return {Object}
   */
  tableExists(tableName) {
    return this.adapter.get('SELECT name FROM sqlite_master WHERE type="table" AND name=?', [tableName]);
  }
  /**
   * Checks if a table and column exist
   * @param  {string} tableName  table to check
   * @param  {string} columnName column to check
   * @return {Boolean}
   */
  columnAndTableExists(tableName, columnName) {
    var columns = this.adapter.all('PRAGMA table_info(\'' + tableName + '\')');
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].name === columnName) {
        return true;
      }
    }
    return false;
  }
  /**
   * Sets the APPLICATION_ID and user_version for GeoPackage
   */
  setApplicationId() {
    var buff = new Buffer(GeoPackageConstants.APPLICATION_ID);
    var applicationId = buff.readUInt32BE(0);
    this.adapter.run('PRAGMA application_id = ' + applicationId);
    this.adapter.run('PRAGMA user_version = ' + GeoPackageConstants.USER_VERSION);
  }
  /**
   * gets the application_id from the sqlite file
   * @return {Object}
   */
  getApplicationId() {
    return this.adapter.get('PRAGMA application_id').application_id;
  }
}

/**
 * Convenience method
 * @see {module:db/geoPackageConnection~GeoPackageConnection}
 * @see {module:db/sqliteAdapter~Adapter}
 * @see {module:db/sqljsAdapter~Adapter}
 * @param  {string|Buffer} filePath string path to an existing file or a path to where a new file will be created or a Buffer containing the contents of the file, if undefined, an in memory database is created
 * @return {Promise} that resolves
 */
export async function connect(filePath) {
  const c = new GeoPackageConnection(filePath);
  return await c.connect()
}

/**
 * Convenience method
 * @param  {Object}   db       open database to connect to
 * @return {Promise}
 */
export function connectWithDatabase(db) {
  const connection = new GeoPackageConnection(undefined);
  return connection.setDBConnection(db);
}

export default GeoPackageConnection;

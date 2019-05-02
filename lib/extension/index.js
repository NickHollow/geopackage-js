/**
 * Metadata module.
 * @module extension
 * @see module:dao/dao
 */


import Dao from '../dao/dao'
import ColumnValues from '../dao/columnValues'
import TableCreator from '../db/tableCreator'

/**
  * Indicates that a particular extension applies to a GeoPackage, a table in a
  * GeoPackage or a column of a table in a GeoPackage. An application that access
  * a GeoPackage can query the gpkg_extensions table instead of the contents of
  * all the user data tables to determine if it has the required capabilities to
  * read or write to tables with extensions, and to “fail fast” and return an
  * error message if it does not.
 * @class Extension
 */
class Extension {
  constructor() {
    /**
     * Name of the table that requires the extension. When NULL, the extension
     * is required for the entire GeoPackage. SHALL NOT be NULL when the
     * column_name is not NULL.
     * @member {String}
     */
    this.table_name;
    /**
     * Name of the column that requires the extension. When NULL, the extension
     * is required for the entire table.
     * @member {String}
     */
    this.column_name;
    /**
     * The case sensitive name of the extension that is required, in the form
     * <author>_<extension_name>.
     * @member {String}
     */
    this.extension_name;
    /**
     * Definition of the extension in the form specfied by the template in
     * GeoPackage Extension Template (Normative) or reference thereto.
     * @member {String}
     */
    this.definition;
    /**
     * Indicates scope of extension effects on readers / writers: read-write or
     * write-only in lowercase.
     * @member {String}
     */
    this.scope;
  }
  setExtensionName(author, extensionName) {
    this.extension_name = Extension.buildExtensionName(author, extensionName);
  }
  getAuthor() {
    return Extension.getAuthorWithExtensionName(this.extension_name);
  }
  getExtensionNameNoAuthor() {
    return Extension.getExtensionNameNoAuthor(this.extension_name);
  }
  static buildExtensionName(author, extensionName) {
    return author + Extension.EXTENSION_NAME_DIVIDER + extensionName;
  }
  static getAuthorWithExtensionName(extensionName) {
    return extensionName.split(Extension.EXTENSION_NAME_DIVIDER)[0];
  }
  static getExtensionNameNoAuthor(extensionName) {
    return extensionName.slice(extensionName.indexOf(Extension.EXTENSION_NAME_DIVIDER) + 1);
  }
}

Extension.EXTENSION_NAME_DIVIDER = "_";

Extension.READ_WRITE = "read-write";
Extension.WRITE_ONLY = "write-only";

/**
 * Extension Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
class ExtensionDao extends Dao {

  createObject(row) {
    var e = new Extension();
    for (var key in row) {
      e[key] = row[key];
    }
    return e;
  }
  queryByExtension(extensionName) {
    var results = this.queryForAllEq(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    var e = this.createObject(results[0]);
    return e;
  }
  queryByExtensionAndTableName(extensionName, tableName) {
    var values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
    var extensions = [];
    for (var row of this.queryForFieldValues(values)) {
      var e = this.createObject(row);
      extensions.push(e);
    }
    if (extensions.length) {
      return extensions;
    }
    else {
      return false;
    }
  }
  queryByExtensionAndTableNameAndColumnName(extensionName, tableName, columnName) {
    var values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
    values.addColumn(ExtensionDao.COLUMN_COLUMN_NAME, columnName);
    var extensions = [];
    for (var row of this.queryForFieldValues(values)) {
      var e = this.createObject(row);
      extensions.push(e);
    }
    if (extensions.length) {
      return extensions;
    }
    else {
      return false;
    }
  }
  createTable() {
    var tc = new TableCreator(this.geoPackage);
    return tc.createExtensions();
  }
  deleteByExtension(extensionName) {
    var values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    this.deleteWhere(this.buildWhere(values, '='), this.buildWhereArgs(values));
  }
  deleteByExtensionAndTableName(extensionName, tableName) {
    var values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
    this.deleteWhere(this.buildWhere(values, 'and'), this.buildWhereArgs(values));
  }
}

ExtensionDao.TABLE_NAME = "gpkg_extensions";
ExtensionDao.COLUMN_TABLE_NAME = "table_name";
ExtensionDao.COLUMN_COLUMN_NAME = "column_name";
ExtensionDao.COLUMN_EXTENSION_NAME = "extension_name";
ExtensionDao.COLUMN_DEFINITION = "definition";
ExtensionDao.COLUMN_SCOPE = "scope";

ExtensionDao.prototype.gpkgTableName = ExtensionDao.TABLE_NAME;
ExtensionDao.prototype.idColumns = [ExtensionDao.COLUMN_TABLE_NAME, ExtensionDao.COLUMN_COLUMN_NAME, ExtensionDao.COLUMN_EXTENSION_NAME];

export {
  ExtensionDao,
  Extension
}

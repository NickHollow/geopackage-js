/**
 * Base Extension
 * @module extension/baseExtension
 */

import {Extension} from './index'

/**
 * Abstract base GeoPackage extension
 * @class
 */
class BaseExtension {
  constructor(geoPackage) {
    this.geoPackage = geoPackage;
    this.connection = geoPackage.connection;
    this.extensionsDao = geoPackage.getExtensionDao();
  }
  /**
   * Get the extension or create as needed
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @param  {String}   definition    extension definition
   * @param  {String}   scopeType     extension scope type
   * @return {Promise<module:extension/baseExtension~BaseExtension>}
   */
  getOrCreate(extensionName, tableName, columnName, definition, scopeType) {
    var extension = this.getExtension(extensionName, tableName, columnName);
    if (extension) {
      return Promise.resolve(extension);
    }
    return this.extensionsDao.createTable()
      .then(function () {
        return this.createExtension(extensionName, tableName, columnName, definition, scopeType);
      }.bind(this));
  }
  /**
   * Get the extension for the name, table name and column name
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @param  {Function} callback      Called with err if one occurred and the extension
   */
  getExtension(extensionName, tableName, columnName) {
    if (!this.extensionsDao.isTableExists()) {
      return false;
    }
    return this.extensionsDao.queryByExtensionAndTableNameAndColumnName(extensionName, tableName, columnName);
  }
  /**
   * Determine if the GeoPackage has the extension
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   */
  hasExtension(extensionName, tableName, columnName) {
    var exists = this.getExtension(extensionName, tableName, columnName);
    return !!this.getExtension(extensionName, tableName, columnName).length;
  }
  createExtension(extensionName, tableName, columnName, definition, scopeType) {
    var extension = new Extension();
    extension.table_name = tableName;
    extension.column_name = columnName;
    extension.extension_name = extensionName;
    extension.definition = definition;
    extension.scope = scopeType;
    return this.extensionsDao.create(extension);
  }
}

export default BaseExtension

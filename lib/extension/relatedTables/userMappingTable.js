/**
 * userMappingTable module.
 * @module extension/relatedTables
 */

import UserTable from '../../user/userTable'
import UserCustomColumn from '../../user/custom/userCustomColumn'
import DataTypes from '../../db/dataTypes'

/**
 * Contains user mapping table factory and utility methods
 * @class
 * @extends {module:user/userTable~UserTable}
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   user mapping columns
 */
class UserMappingTable extends UserTable {

  /**
   * Get the base id column
   * @return {module:user/userColumn~UserColumn}
   */
  getBaseIdColumn() {
    return this.getColumnWithColumnName(UserMappingTable.COLUMN_BASE_ID);
  }
  /**
   * Get the related id column
   * @return {module:user/userColumn~UserColumn}
   */
  getRelatedIdColumn() {
    return this.getColumnWithColumnName(UserMappingTable.COLUMN_RELATED_ID);
  }
  /**
   * Creates a user mapping table with the minimum required columns followed by the additional columns
   * @param  {string} tableName name of the table
   * @param  {module:user/userColumn~UserColumn[]} additionalColumns additional columns
   * @return {module:extension/relatedTables~UserMappingTable}
   */
  static create(tableName, columns) {
    var allColumns = UserMappingTable.createRequiredColumns(0);
    if (columns) {
      allColumns = allColumns.concat(columns);
    }
    return new UserMappingTable(tableName, allColumns);
  }
  /**
   * Get the number of required columns
   * @return {Number}
   */
  static numRequiredColumns() {
    return UserMappingTable.createRequiredColumns(0).length;
  }
  /**
   * Create the required columns
   * @param  {Number} [startingIndex=0] starting index of the required columns
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createRequiredColumns(startingIndex) {
    startingIndex = startingIndex || 0;
    return [
      UserMappingTable.createBaseIdColumn(startingIndex++),
      UserMappingTable.createRelatedIdColumn(startingIndex)
    ];
  }
  /**
   * Create the base id column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createBaseIdColumn(index) {
    var baseIdColumn = UserCustomColumn.createColumn(index, UserMappingTable.COLUMN_BASE_ID, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true);
    return baseIdColumn;
  }
  /**
   * Create the related id column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createRelatedIdColumn(index) {
    return UserCustomColumn.createColumn(index, UserMappingTable.COLUMN_RELATED_ID, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true);
  }
  /**
   * Get the required columns
   * @return {string[]}
   */
  static requiredColumns() {
    return [UserMappingTable.COLUMN_BASE_ID, UserMappingTable.COLUMN_RELATED_ID];
  }
}

UserMappingTable.COLUMN_BASE_ID = 'base_id';
UserMappingTable.COLUMN_RELATED_ID = 'related_id';

export default UserMappingTable

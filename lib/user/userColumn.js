/**
 * @module user/userColumn
 */

import DataTypes from '../db/dataTypes'

/**
 * A `UserColumn` is meta-data about a single column from a {@link module:/user/userTable~UserTable}.
 *
 * @class
 * @param {Number} index column index
 * @param {string} name column name
 * @param {module:db/dataTypes~GPKGDataType} dataType data type of the column
 * @param {?Number} max max value
 * @param {Boolean} notNull not null
 * @param {?Object} defaultValue default value or null
 * @param {Boolean} primaryKey `true` if this column is part of the table's primary key
 */
class UserColumn {
  constructor(index, name, dataType, max, notNull, defaultValue, primaryKey) {
    this.index = index;
    this.name = name;
    this.dataType = dataType;
    this.max = max;
    this.notNull = notNull;
    this.defaultValue = defaultValue;
    this.primaryKey = primaryKey;
    this.validateMax();
  }
  /**
   * Gets the type name
   * @return {module:db/dataTypes~GPKGDataType}
   */
  getTypeName() {
    return DataTypes.name(this.dataType);
  }
  /**
   * Validate that if max is set, the data type is text or blob
   */
  validateMax() {
    if (this.max && this.dataType !== DataTypes.GPKGDataType.GPKG_DT_TEXT && this.dataType !== DataTypes.GPKGDataType.GPKG_DT_BLOB) {
      throw new Error('Column max is only supported for TEXT and BLOB columns. column: ' + this.name + ', max: ' + this.max + ', type: ' + this.getTypeName());
    }
  }
  /**
   *  Create a new primary key column
   *
   *  @param {Number} index column index
   *  @param {string} name  column name
   *
   *  @return {module:user/userColumn~UserColumn} created column
   */
  static createPrimaryKeyColumnWithIndexAndName(index, name) {
    return new UserColumn(index, name, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true, undefined, true);
  }
  /**
   *  Create a new column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {module:db/dataTypes~GPKGDataType} type         data type
   *  @param {Boolean} notNull      not null
   *  @param {Object} defaultValue default value or nil
   *
   *  @return {module:user/userColumn~UserColumn} created column
   */
  static createColumnWithIndex(index, name, type, notNull, defaultValue) {
    return UserColumn.createColumnWithIndexAndMax(index, name, type, undefined, notNull, defaultValue);
  }
  /**
   *  Create a new column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {module:db/dataTypes~GPKGDataType} type         data type
   *  @param {Number} max max value
   *  @param {Boolean} notNull      not null
   *  @param {Object} defaultValue default value or nil
   *
   *  @return {module:user/userColumn~UserColumn} created column
   */
  static createColumnWithIndexAndMax(index, name, type, max, notNull, defaultValue) {
    return new UserColumn(index, name, type, max, notNull, defaultValue, false);
  }
}

export default UserColumn

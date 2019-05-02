/**
 * SimpleAttributesRow module.
 * @module extension/relatedTables
 */

import UserRow from '../../user/userRow'

/**
 * User Simple Attributes Row containing the values from a single result set row
 * @class
 * @extends {module:user/userRow~UserRow}
 * @param  {module:extension/relatedTables~SimpleAttributesTable} simpleAttributesTable simple attributes table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
class SimpleAttributesRow extends UserRow {
  constructor(simpleAttributesTable, columnTypes, values) {
    super(simpleAttributesTable, columnTypes, values);
    this.simpleAttributesTable = simpleAttributesTable;
  }
  /**
   * Gets the primary key id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn() {
    return this.simpleAttributesTable.getIdColumn();
  }
  /**
   * Gets the id
   * @return {Number}
   */
  getId() {
    return this.getValueWithColumnName(this.getIdColumn().name);
  }
}

export default SimpleAttributesRow

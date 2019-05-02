/**
 * @module attributes/attributeTable
 */

import UserTable from '../user/userTable'
import {ContentsDao} from '../core/contents'

/**
 * Represents a user attribute table
 * @class AttributeTable
 * @extends {module:user/userTable~UserTable}
 * @constructor
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   attribute columns
 */
class AttributeTable extends UserTable {
  constructor(tableName, columns) {
    super(tableName, columns)
    /**
     * Contents of this AttributeTable
     * @member {module:core/contents~Contents}
     */
    this.contents;
  }
  /**
   * Set the contents
   * @param  {module:core/contents~Contents} contents the contents
   */
  setContents(contents) {
    this.contents = contents;
    if (contents.data_type !== ContentsDao.GPKG_CDT_ATTRIBUTES_NAME) {
      throw new Error('The Contents of an Attributes Table must have a data type of ' + ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);
    }
  }
}

export default AttributeTable;

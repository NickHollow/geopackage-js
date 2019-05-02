/**
 * DataColumnConstraints module.
 * @module dataColumnConstraints
 */

import Dao from '../dao/dao'

/**
 * Contains data to specify restrictions on basic data type column values
 * @class DataColumnConstraints
 */
var DataColumnConstraints = function() {

  /**
   * Case sensitive name of constraint
   * @member {string}
   */
  this.constraint_name;

  /**
   * Lowercase type name of constraint: range | enum | glob
   * @member {string}
   */
  this.constraint_type;

  /**
   * Specified case sensitive value for enum or glob or NULL for range constraint_type
   * @member {string}
   */
  this.value;

  /**
   * Minimum value for 'range' or NULL for 'enum' or 'glob' constraint_type
   * @member {Number}
   */
  this.min;

  /**
   * 0 (false) if min value is exclusive, or 1 (true) if min value is inclusive
   * @member {Number}
   */
  this.min_is_inclusive;

  /**
   * Maximum value for 'range' or NULL for 'enum' or 'glob' constraint_type
   * @member {Number}
   */
  this.max;

  /**
   * 0 (false) if max value is exclusive, or 1 (true) if max value is inclusive
   * @member {Number}
   */
  this.max_is_inclusive;

  /**
   * For ranges and globs, describes the constraing; for enums, describes the enum value.
   */
  this.description;

}

/**
 * Data Column Constraints Data Access Object
 * @class
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @extends {module:dao/dao~Dao}
 */
class DataColumnConstraintsDao extends Dao{
  /**
   * Creates a new DataColumnConstraints object
   * @return {module:dataColumnConstraints~DataColumnConstraints}
   */
  createObject() {
    return new DataColumnConstraints();
  }
  /**
   * query by constraint name
   * @param  {String} constraintName     constraint name
   * @return {Iterable}
   */
  queryByConstraintName(constraintName) {
    return this.queryForEach(DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME, constraintName);
  }
  /**
   * Query by the unique column values
   * @param  {String} constraintName     constraint name
   * @param  {String} constraintType     constraint type
   * @param  {String} value              value
   * @return {module:dataColumnConstraints~DataColumnConstraints}
   */
  queryUnique(constraintName, constraintType, value) {
    var dataColumnConstraints = new DataColumnConstraints();
    dataColumnConstraints.constraint_name = constraintName;
    dataColumnConstraints.constraint_type = constraintType;
    dataColumnConstraints.value = value;
    return this.queryForSameId(dataColumnConstraints);
  }
}

DataColumnConstraintsDao.TABLE_NAME = "gpkg_data_column_constraints";
DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME = "constraint_name";
DataColumnConstraintsDao.COLUMN_CONSTRAINT_TYPE = "constraint_type";
DataColumnConstraintsDao.COLUMN_VALUE = "value";
DataColumnConstraintsDao.COLUMN_MIN = "min";
DataColumnConstraintsDao.COLUMN_MIN_IS_INCLUSIVE = "min_is_inclusive";
DataColumnConstraintsDao.COLUMN_MAX = "max";
DataColumnConstraintsDao.COLUMN_MAX_IS_INCLUSIVE = "max_is_inclusive";
DataColumnConstraintsDao.COLUMN_DESCRIPTION = "description";

DataColumnConstraintsDao.ENUM_TYPE = 'enum';
DataColumnConstraintsDao.GLOB_TYPE = 'glob';
DataColumnConstraintsDao.RANGE_TYPE = 'range';

DataColumnConstraintsDao.prototype.gpkgTableName = DataColumnConstraintsDao.TABLE_NAME;
DataColumnConstraintsDao.prototype.idColumns = [DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME, DataColumnConstraintsDao.COLUMN_CONSTRAINT_TYPE, DataColumnConstraintsDao.COLUMN_VALUE];

export {
  DataColumnConstraintsDao,
  DataColumnConstraints
}

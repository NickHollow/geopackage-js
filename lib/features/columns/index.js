/**
 * @module features/columns
 */

import Dao from '../../dao/dao'

/**
 * `GeometryColumns` models the [gpkg_geometry_columns](http://www.geopackage.org/spec/#_geometry_columns)
 * table.  Rows in this table define the column in a [user feature table]{@link module:features/user/featureTable~FeatureTable}
 * that contains vector feature geometry data.
 *
 * @class GeometryColumns
 */
class GeometryColumns {
  constructor() {
    /**
       * Name of the table containing the geometry column
       * @member {string}
       */
    this.table_name;
    /**
     * Name of a column in the feature table that is a Geometry Column
     * @member {string}
     */
    this.column_name;
    /**
     * Name from Geometry Type Codes (Core) or Geometry Type Codes (Extension)
     * in Geometry Types (Normative)
     * @member {string}
     */
    this.geometry_type_name;
    /**
     * Spatial Reference System ID: gpkg_spatial_ref_sys.srs_id
     * @member {module:dao/spatialReferenceSystem~SpatialReferenceSystem}
     */
    this.srs;
    /**
     * Unique identifier for each Spatial Reference System within a GeoPackage
     * @member {Number}
     */
    this.srs_id;
    /**
     * 0: z values prohibited; 1: z values mandatory; 2: z values optional
     * @member {byte}
     */
    this.z;
    /**
     * 0: m values prohibited; 1: m values mandatory; 2: m values optional
     * @member {byte}
     */
    this.m;
  }
  getGeometryType() {
    return this.geometry_type_name;
  }
}


// /**
//  * Contents
//  */
// @ForeignCollectionField(eager = false)
// private ForeignCollection<Contents> contents;
//
// /**
//  * Geometry Columns
//  */
// @ForeignCollectionField(eager = false)
// private ForeignCollection<GeometryColumns> geometryColumns;
//
// /**
//  * Matrix Tile Set
//  */
// @ForeignCollectionField(eager = false)
// private ForeignCollection<TileMatrixSet> tileMatrixSet;
/**
 * Geometry Columns Data Access Object
 *
 * @class GeometryColumnsDao
 * @extends {module:dao/dao~Dao}
 */
class GeometryColumnsDao extends Dao {
  createObject() {
    return new GeometryColumns();
  }
  /**
   * Fetch the [geometry column]{@link module:features/columns~GeometryColumns}
   * associated with the user table with the given name.  Return `undefined` if
   * no geometry column exists for the given table name.
   *
   * @param {string} tableName table name
   * @returns {?module:features/columns~GeometryColumns}
   */
  queryForTableName(tableName) {
    var results = this.queryForAllEq(GeometryColumnsDao.COLUMN_TABLE_NAME, tableName);
    if (results && results.length) {
      var gc = this.createObject();
      this.populateObjectFromResult(gc, results[0]);
      return gc;
    }
    return;
  }
  /**
   * Get the feature table names.
   *
   * @returns {string[]} an array of feature table name strings
   */
  getFeatureTables() {
    var tableNames = [];
    for (var result of this.connection.each('select ' + GeometryColumnsDao.COLUMN_TABLE_NAME + ' from ' + this.gpkgTableName)) {
      tableNames.push(result[GeometryColumnsDao.COLUMN_TABLE_NAME]);
    }
    return tableNames;
  }
  /**
   *  Get the Spatial Reference System of the Geometry Columns
   *
   *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
   *  @param {callback} callback called with an error if one occurred and the {SpatialReferenceSystem}
   */
  getSrs(geometryColumns) {
    var dao = this.geoPackage.getSpatialReferenceSystemDao();
    return dao.queryForId(geometryColumns.srs_id);
    ;
  }
  /**
   *  Get the Contents of the Geometry Columns
   *
   *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
   *  @return {ContentsDao} contents dao
   */
  getContents(geometryColumns) {
    var dao = this.geoPackage.getContentsDao();
    return dao.queryForId(geometryColumns.table_name);
  }
  getProjection(projectionObject) {
    var srs = this.getSrs(projectionObject);
    var srsDao = this.geoPackage.getSpatialReferenceSystemDao();
    return srsDao.getProjection(srs);
  }
}

/**
 * tableName field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_TABLE_NAME = "table_name";

/**
 * columnName field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_COLUMN_NAME = "column_name";

/**
 * id 1 field name, tableName
 * @type {String}
 */
GeometryColumnsDao.COLUMN_ID_1 = GeometryColumnsDao.COLUMN_TABLE_NAME;

/**
 * id 2 field name, columnName
 * @type {String}
 */
GeometryColumnsDao.COLUMN_ID_2 = GeometryColumnsDao.COLUMN_COLUMN_NAME;

/**
 * geometryTypeName field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_GEOMETRY_TYPE_NAME = "geometry_type_name";

/**
 * srsId field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_SRS_ID = 'srs_id';

/**
 * z field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_Z = "z";

/**
 * m field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_M = "m";

/**
 * Table Name
 * @type {String}
 */
GeometryColumnsDao.prototype.gpkgTableName = 'gpkg_geometry_columns';

GeometryColumnsDao.prototype.idColumns = [GeometryColumnsDao.COLUMN_ID_1, GeometryColumnsDao.COLUMN_ID_2];
GeometryColumnsDao.prototype.columns =
  [GeometryColumnsDao.COLUMN_TABLE_NAME, GeometryColumnsDao.COLUMN_COLUMN_NAME, GeometryColumnsDao.COLUMN_GEOMETRY_TYPE_NAME, GeometryColumnsDao.COLUMN_SRS_ID, GeometryColumnsDao.COLUMN_Z, GeometryColumnsDao.COLUMN_M];

GeometryColumns.TABLE_NAME = "tableName";
GeometryColumns.COLUMN_NAME = "columnName";
GeometryColumns.GEOMETRY_TYPE_NAME = "geometryTypeName";
GeometryColumns.SRS_ID = "srsId";
GeometryColumns.Z = "z";
GeometryColumns.M = "m";

export {
  GeometryColumns,
  GeometryColumnsDao
};

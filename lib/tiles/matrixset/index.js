/**
 * @module tiles/matrixset
 * @see module:dao/dao
 */
import Dao from '../../dao/dao'
import BoundingBox from '../../boundingBox'

/**
 * `TileMatrixSet` models the [`gpkg_tile_matrix_set`](https://www.geopackage.org/spec121/index.html#_tile_matrix_set)
 * table.  A row in this table defines the minimum bounding box (min_x, min_y,
 * max_x, max_y) and spatial reference system (srs_id) for all tiles in a
 * [tile pyramid](https://www.geopackage.org/spec121/index.html#tiles_user_tables)
 * user data table.  While the parent [Contents]{@link module:core/contents~Contents}
 * row/object also defines a bounding box, the tile matrix set bounding box is
 * used as the reference for calculating tile column/row matrix coordinates, so
 * (min_x, max_y) in SRS coordinates would be the upper-left corner of the tile
 * at tile matrix coordinate (0, 0).  The parent `Contents` bounding box may be
 * smaller or larger than the `TileMatrixSet` bounding box, and its purpose is
 * to guide a user-facing application to the target region of the tile pyramid.
 * The [`srs_id`]{@link module:tiles/matrixset~TileMatrixSet#srs_id} of the `TileMatrixSet`, on the other hand, must
 * match that of the parent [`Contents`]{@link module:core/contents~Contents#srs_id}.
 *
 * @class TileMatrixSet
 */
class TileMatrixSet {
  constructor() {
    /**
     * Name of the [tile pyramid user data table](https://www.geopackage.org/spec121/index.html#tiles_user_tables)
     * that stores the tiles
     * @member {string}
     */
    this.table_name;
    /**
     * Unique identifier for each Spatial Reference System within a GeoPackage
     * @member {SRSRef}
     */
    this.srs_id;
    /**
     * Bounding box minimum easting or longitude for all content in table_name
     * @member {Number}
     */
    this.min_x;
    /**
     * Bounding box minimum northing or latitude for all content in table_name
     * @member {Number}
     */
    this.min_y;
    /**
     * Bounding box maximum easting or longitude for all content in table_name
     * @member {Number}
     */
    this.max_x;
    /**
     * Bounding box maximum northing or latitude for all content in table_name
     * @member {Number}
     */
    this.max_y;
  }
  setBoundingBox(boundingBox) {
    this.min_x = boundingBox.minLongitude;
    this.max_x = boundingBox.maxLongitude;
    this.min_y = boundingBox.minLatitude;
    this.max_y = boundingBox.maxLatitude;
  }
  getBoundingBox() {
    return new BoundingBox(this.min_x, this.max_x, this.min_y, this.max_y);
  }
  setContents(contents) {
    if (contents && contents.data_type === 'tiles') {
      this.table_name = contents.table_name;
    }
  }
}

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixSetDao
 * @extends {module:dao/dao~Dao}
 */
class TileMatrixSetDao extends Dao {
  createObject() {
    return new TileMatrixSet();
  }
  /**
   * Return an array of names of [tile tables]{@link module:tiles/user/tileTable~TileTable}
   * in this DAO's [GeoPackage]{@link module:tiles/matrixset~TileMatrixSetDao#geoPackage}.
   *
   * @returns {string[]} array of table names
   */
  getTileTables() {
    var tableNames = [];
    for (var result of this.connection.each('select ' + TileMatrixSetDao.COLUMN_TABLE_NAME + ' from ' + TileMatrixSetDao.TABLE_NAME)) {
      tableNames.push(result[TileMatrixSetDao.COLUMN_TABLE_NAME]);
    }
    return tableNames;
  }
  getProjection(tileMatrixSet) {
    var srs = this.getSrs(tileMatrixSet);
    if (!srs)
      return;
    var srsDao = this.geoPackage.getSpatialReferenceSystemDao();
    return srsDao.getProjection(srs);
  }
  /**
   * Get the Spatial Reference System of the Tile Matrix set
   * @param  {TileMatrixSet}   tileMatrixSet tile matrix set
   */
  getSrs(tileMatrixSet) {
    var dao = this.geoPackage.getSpatialReferenceSystemDao();
    return dao.queryForId(tileMatrixSet.srs_id);
  }
  getContents(tileMatrixSet) {
    var dao = this.geoPackage.getContentsDao();
    return dao.queryForId(tileMatrixSet.table_name);
  }
}

TileMatrixSet.TABLE_NAME = "tableName";
TileMatrixSet.MIN_X = "minX";
TileMatrixSet.MIN_Y = "minY";
TileMatrixSet.MAX_X = "maxX";
TileMatrixSet.MAX_Y = "maxY";
TileMatrixSet.SRS_ID = "srsId";

TileMatrixSetDao.TABLE_NAME = "gpkg_tile_matrix_set";
TileMatrixSetDao.COLUMN_PK = "table_name";
TileMatrixSetDao.COLUMN_TABLE_NAME = "table_name";
TileMatrixSetDao.COLUMN_SRS_ID = "srs_id";
TileMatrixSetDao.COLUMN_MIN_X = "min_x";
TileMatrixSetDao.COLUMN_MIN_Y = "min_y";
TileMatrixSetDao.COLUMN_MAX_X = "max_x";
TileMatrixSetDao.COLUMN_MAX_Y = "max_y";

TileMatrixSetDao.prototype.gpkgTableName = 'gpkg_tile_matrix_set';
TileMatrixSetDao.prototype.idColumns = [TileMatrixSetDao.COLUMN_PK];
TileMatrixSetDao.prototype.columns = [TileMatrixSetDao.COLUMN_TABLE_NAME, TileMatrixSetDao.COLUMN_SRS_ID, TileMatrixSetDao.COLUMN_MIN_X, TileMatrixSetDao.COLUMN_MIN_Y, TileMatrixSetDao.COLUMN_MAX_X, TileMatrixSetDao.COLUMN_MAX_Y];

TileMatrixSetDao.prototype.columnToPropertyMap = {};
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_TABLE_NAME] = TileMatrixSet.TABLE_NAME;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_SRS_ID] = TileMatrixSet.SRS_ID;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_MIN_X] = TileMatrixSet.MIN_X;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_MIN_Y] = TileMatrixSet.MIN_Y;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_MAX_X] = TileMatrixSet.MAX_X;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_MAX_Y] = TileMatrixSet.MAX_Y;

export {
  TileMatrixSetDao,
  TileMatrixSet
}

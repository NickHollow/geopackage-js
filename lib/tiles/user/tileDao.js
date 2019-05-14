/**
 * tileDao module.
 * @module tiles/user/tileDao
 */


import UserDao from '../../user/userDao'
import TileGrid from '../tileGrid'
import TileRow from './tileRow'
import {TileMatrixSetDao} from '../matrixset'
import {TileMatrixDao} from '../matrix'
import BoundingBox from '../../boundingBox'
import BoundingBoxUtils from '../tileBoundingBoxUtils'
import ColumnValues from '../../dao/columnValues'
import TileColumn from './tileColumn'

import proj4 from 'proj4'

/**
 * `TileDao` is a {@link module:dao/dao~Dao} subclass for reading
 * [user tile tables]{@link module:tiles/user/tileTable~TileTable}.
 *
 * @class TileDao
 * @extends {module:user/userDao~UserDao}
 * @param  {GeoPackageConnection} connection
 * @param  {TileTable} table
 * @param  {TileMatrixSet} tileMatrixSet
 * @param  {TileMatrix[]} tileMatrices
 */
class TileDao extends UserDao {
  constructor(geoPackage, table, tileMatrixSet, tileMatrices) {
    super(geoPackage, table);
    this.tileMatrixSet = tileMatrixSet;
    this.tileMatrices = tileMatrices;
    this.zoomLevelToTileMatrix = [];
    this.widths = [];
    this.heights = [];
    if (tileMatrices.length === 0) {
      this.minZoom = 0;
      this.maxZoom = 0;
    }
    else {
      this.minZoom = this.tileMatrices[0].zoom_level;
      this.maxZoom = this.tileMatrices[this.tileMatrices.length - 1].zoom_level;
    }
    // Populate the zoom level to tile matrix and the sorted tile widths and heights
    for (var i = this.tileMatrices.length - 1; i >= 0; i--) {
      var tileMatrix = this.tileMatrices[i];
      this.zoomLevelToTileMatrix[tileMatrix.zoom_level] = tileMatrix;
    }
    this.initialize();
  }
  initialize() {
    var tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
    this.srs = tileMatrixSetDao.getSrs(this.tileMatrixSet);
    this.projection = this.srs.organization.toUpperCase() + ':' + this.srs.organization_coordsys_id;
    // Populate the zoom level to tile matrix and the sorted tile widths and heights
    for (var i = this.tileMatrices.length - 1; i >= 0; i--) {
      var tileMatrix = this.tileMatrices[i];
      var width = tileMatrix.pixel_x_size * tileMatrix.tile_width;
      var height = tileMatrix.pixel_y_size * tileMatrix.tile_height;
      this.widths.push(width);
      this.heights.push(height);
    }
    this.setWebMapZoomLevels();
  }
  webZoomToGeoPackageZoom(webZoom) {
    var webMercatorBoundingBox = BoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(0, 0, webZoom);
    return this.determineGeoPackageZoomLevel(webMercatorBoundingBox, webZoom);
  }
  setWebMapZoomLevels() {
    this.minWebMapZoom = 20;
    this.maxWebMapZoom = 0;
    this.webZoomToGeoPackageZooms = {};
    var totalTileWidth = this.tileMatrixSet.max_x - this.tileMatrixSet.min_x;
    var totalTileHeight = this.tileMatrixSet.max_y - this.tileMatrixSet.min_y;
    for (var i = 0; i < this.tileMatrices.length; i++) {
      var tileMatrix = this.tileMatrices[i];
      var singleTileWidth = totalTileWidth / tileMatrix.matrix_width;
      var singleTileHeight = totalTileHeight / tileMatrix.matrix_height;
      var tileBox = new BoundingBox(this.tileMatrixSet.min_x, this.tileMatrixSet.min_x + singleTileWidth, this.tileMatrixSet.min_y, this.tileMatrixSet.min_y + singleTileHeight);
      var proj4Projection = proj4(this.projection, 'EPSG:4326');
      var ne = proj4Projection.forward([tileBox.maxLongitude, tileBox.maxLatitude]);
      var sw = proj4Projection.forward([tileBox.minLongitude, tileBox.minLatitude]);
      var degPerTile = (ne[0] - sw[0]);
      var globeTileCount = 360.0 / degPerTile;
      var zoom = Math.round(Math.log2(globeTileCount));
      if (this.minWebMapZoom > zoom) {
        this.minWebMapZoom = zoom;
      }
      if (this.maxWebMapZoom < zoom) {
        this.maxWebMapZoom = zoom;
      }
      this.webZoomToGeoPackageZooms[zoom] = tileMatrix.zoom_level;
    }
  }
  determineGeoPackageZoomLevel(webMercatorBoundingBox, zoom) {
    return this.webZoomToGeoPackageZooms[zoom];
  }
  /**
   * Get the bounding box of tiles at the zoom level
   * @param  {Number} zoomLevel zoom level
   * @return {BoundingBox}           bounding box of the zoom level, or null if no tiles
   */
  getBoundingBoxWithZoomLevel(zoomLevel) {
    var boundingBox;
    var tileMatrix = this.getTileMatrixWithZoomLevel(zoomLevel);
    if (tileMatrix) {
      var tileGrid = this.queryForTileGridWithZoomLevel(zoomLevel);
      if (tileGrid) {
        var matrixSetBoundingBox = this.getBoundingBox();
        boundingBox = BoundingBoxUtils.getTileGridBoundingBox(matrixSetBoundingBox, tileMatrix.matrix_width, tileMatrix.matrix_height, tileGrid);
      }
      return boundingBox;
    }
    else {
      return boundingBox;
    }
  }
  getBoundingBox() {
    return this.tileMatrixSet.getBoundingBox();
  }
  queryForTileGridWithZoomLevel(zoomLevel) {
    var where = this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    var whereArgs = this.buildWhereArgs(zoomLevel);
    var minX = this.minOfColumn(TileColumn.COLUMN_TILE_COLUMN, where, whereArgs);
    var maxX = this.maxOfColumn(TileColumn.COLUMN_TILE_COLUMN, where, whereArgs);
    var minY = this.minOfColumn(TileColumn.COLUMN_TILE_ROW, where, whereArgs);
    var maxY = this.maxOfColumn(TileColumn.COLUMN_TILE_ROW, where, whereArgs);
    var tileGrid;
    if (minX != null && minY != null && maxX != null && maxY != null) {
      tileGrid = new TileGrid(minX, maxX, minY, maxY);
    }
    return tileGrid;
  }
  /**
   * Get the tile grid of the zoom level
   * @param  {Number} zoomLevel zoom level
   * @return {TileGrid}           tile grid at zoom level, null if no tile matrix at zoom level
   */
  getTileGridWithZoomLevel(zoomLevel) {
    var tileGrid;
    var tileMatrix = this.getTileMatrixWithZoomLevel(zoomLevel);
    if (tileMatrix) {
      tileGrid = new TileGrid(0, ~~tileMatrix.matrix_width - 1, 0, ~~tileMatrix.matrix_height - 1);
    }
    return tileGrid;
  }
  /**
   * get the tile table
   * @return {TileTable} tile table
   */
  getTileTable() {
    return this.table;
  }
  /**
   * Create a new tile row with the column types and values
   * @param  {Array} columnTypes column types
   * @param  {Array} values      values
   * @return {TileRow}             tile row
   */
  newRowWithColumnTypes(columnTypes, values) {
    return new TileRow(this.getTileTable(), columnTypes, values);
  }
  /**
   * Create a new tile row
   * @return {TileRow} tile row
   */
  newRow() {
    return new TileRow(this.getTileTable());
  }
  /**
   * Get the tile matrix at the zoom level
   * @param  {Number} zoomLevel zoom level
   * @return {TileMatrix}           tile matrix
   */
  getTileMatrixWithZoomLevel(zoomLevel) {
    return this.zoomLevelToTileMatrix[zoomLevel];
  }
  /**
   * Query for a tile.  Return null if the tile row does not exist.
   *
   * @param  {Number} column    column
   * @param  {Number} row       row
   * @param  {Number} zoomLevel zoom level
   * @return {?module:tiles/user/tileRow~TileRow} or null
   */
  queryForTile(column, row, zoomLevel) {
    var fieldValues = new ColumnValues();
    fieldValues.addColumn(TileColumn.COLUMN_TILE_COLUMN, column);
    fieldValues.addColumn(TileColumn.COLUMN_TILE_ROW, row);
    fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    const record = this.queryForFirstFieldValues(fieldValues);
    return record ? this.getRow(record) : null;
  }
  queryForTilesWithZoomLevel(zoomLevel, tileCallback) {
    var iterator = this.queryForEach(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    var thisgetRow = this.getRow.bind(this);
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: function () {
        var nextRow = iterator.next();
        if (!nextRow.done) {
          return {
            value: thisgetRow(nextRow.value),
            done: false
          };
        }
        return {
          done: true
        };
      }.bind(this)
    };
  }
  /**
   * Query for Tiles at a zoom level in descending row and column order
   * @param  {Number} zoomLevel    zoom level
   * @param  {Function} tileCallback callback for each tile
   * @param  {Function} doneCallback called when all tiles are retrieved
   */
  queryForTilesDescending(zoomLevel, tileCallback) {
    var iterator = this.queryForEach(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel, undefined, undefined, TileColumn.COLUMN_TILE_COLUMN + ' DESC, ' + TileColumn.COLUMN_TILE_ROW + ', DESC');
    var thisgetRow = this.getRow.bind(this);
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: function () {
        var nextRow = iterator.next();
        if (!nextRow.done) {
          return {
            value: thisgetRow(nextRow.value),
            done: false
          };
        }
        return {
          done: true
        };
      }.bind(this)
    };
  }
  /**
   * Query for tiles at a zoom level and column
   * @param  {Number} column       column
   * @param  {Number} zoomLevel    zoom level
   * @param  {Function} tileCallback called for each tile
   * @param  {Function} doneCallback called when all tiles have been retrieved
   */
  queryForTilesInColumn(column, zoomLevel, tileCallback) {
    var fieldValues = new ColumnValues();
    fieldValues.addColumn(TileColumn.COLUMN_TILE_COLUMN, column);
    fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    var iterator = this.queryForFieldValues(fieldValues);
    var thisgetRow = this.getRow.bind(this);
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: function () {
        var nextRow = iterator.next();
        if (!nextRow.done) {
          var tileRow = thisgetRow(nextRow.value);
          return {
            value: tileRow,
            done: false
          };
        }
        else {
          return {
            done: true
          };
        }
      }
    };
  }
  /**
   * Query for tiles at a zoom level and row
   * @param  {Number} row       row
   * @param  {Number} zoomLevel    zoom level
   * @param  {Function} tileCallback called for each tile
   * @param  {Function} doneCallback called when all tiles have been retrieved
   */
  queryForTilesInRow(row, zoomLevel, tileCallback, doneCallback) {
    var fieldValues = new ColumnValues();
    fieldValues.addColumn(TileColumn.COLUMN_TILE_ROW, row);
    fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    var iterator = this.queryForFieldValues(fieldValues);
    var thisgetRow = this.getRow.bind(this);
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: function () {
        var nextRow = iterator.next();
        if (!nextRow.done) {
          var tileRow = thisgetRow(nextRow.value);
          return {
            value: tileRow,
            done: false
          };
        }
        else {
          return {
            done: true
          };
        }
      }
    };
  }
  /**
   * Query by tile grid and zoom level
   * @param  {TileGrid} tileGrid  tile grid
   * @param  {Number} zoomLevel zoom level
   * @param  {Function} tileCallback called for each tile
   * @param  {Function} doneCallback called when all tiles have been retrieved
   */
  queryByTileGrid(tileGrid, zoomLevel) {
    if (!tileGrid)
      return [];
    var tileCount = 0;
    var x = tileGrid.min_x;
    var where = '';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, tileGrid.min_x, '>=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, tileGrid.max_x, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, tileGrid.min_y, '>=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, tileGrid.max_y, '<=');
    var whereArgs = this.buildWhereArgs([zoomLevel, tileGrid.min_x, tileGrid.max_x, tileGrid.min_y, tileGrid.max_y]);
    var iterator = this.queryWhereWithArgsDistinct(where, whereArgs);
    var thisgetRow = this.getRow.bind(this);
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: function () {
        var nextRow = iterator.next();
        if (!nextRow.done) {
          var tileRow = thisgetRow(nextRow.value);
          return {
            value: tileRow,
            done: false
          };
        }
        else {
          return {
            done: true
          };
        }
      }
    };
  }
  deleteTile(column, row, zoomLevel) {
    var where = '';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, column);
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, row);
    var whereArgs = this.buildWhereArgs([zoomLevel, column, row]);
    return this.deleteWhere(where, whereArgs);
  }
  getSrs() {
    return this.geoPackage.getContentsDao().getSrs(this.tileMatrixSet);
  }
  /**
   * Drop the [user tile pyramid table]{@link module:tiles/user/tileTable~TileTable}
   * and delete its associated [tile matrix set]{@link module:tiles/matrixset~TileMatrixSet}
   * and [tile matrix]{@link module:tiles/matrix~TileMatrix} records.
   *
   * @return result of {@link module:user/userDao~UserDao#dropTable}
   */
  dropTable() {
    var tileMatrixDao = this.geoPackage.getTileMatrixDao();
    var dropResult = UserDao.prototype.dropTable.call(this);
    var tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
    tileMatrixSetDao.delete(this.tileMatrixSet);
    for (var i = this.tileMatrices.length - 1; i >= 0; i--) {
      var tileMatrix = this.tileMatrices[i];
      tileMatrixDao.delete(tileMatrix);
    }
    var dao = this.geoPackage.getContentsDao();
    dao.deleteById(this.gpkgTableName);
    return dropResult;
  }
  rename(newName) {
    UserDao.prototype.rename.call(this, newName);
    var oldName = this.tileMatrixSet.table_name;
    var values = {};
    values[TileMatrixSetDao.COLUMN_TABLE_NAME] = newName;
    var where = this.buildWhereWithFieldAndValue(TileMatrixSetDao.COLUMN_TABLE_NAME, oldName);
    var whereArgs = this.buildWhereArgs([oldName]);
    var contentsDao = this.geoPackage.getContentsDao();
    var contents = contentsDao.queryForId(oldName);
    contents.table_name = newName;
    contents.identifier = newName;
    contentsDao.create(contents);
    var tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
    tileMatrixSetDao.updateWithValues(values, where, whereArgs);
    var tileMatrixDao = this.geoPackage.getTileMatrixDao();
    var tileMatrixUpdate = {};
    tileMatrixUpdate[TileMatrixDao.COLUMN_TABLE_NAME] = newName;
    var tileMatrixWhere = this.buildWhereWithFieldAndValue(TileMatrixDao.COLUMN_TABLE_NAME, oldName);
    tileMatrixDao.updateWithValues(tileMatrixUpdate, tileMatrixWhere, whereArgs);
    contentsDao.deleteById(oldName);
  }
}

export default TileDao

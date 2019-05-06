import proj4 from 'proj4'

import TileBoundingBoxUtils from '../tileBoundingBoxUtils'

class TileCreator {
  constructor(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo) {
    this.width = width;
    this.height = height;
    this.tileMatrix = tileMatrix;
    this.projectionFrom = srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id;
    this.projectionFromDefinition = srs.definition;
    this.projectionTo = projectionTo.toUpperCase();
    this.tileBoundingBox = tileBoundingBox;
    this.tileMatrixSet = tileMatrixSet;
    this.chunks = [];
    this.tileHeightUnitsPerPixel = (tileBoundingBox.maxLatitude - tileBoundingBox.minLatitude) / height;
    this.tileWidthUnitsPerPixel = (tileBoundingBox.maxLongitude - tileBoundingBox.minLongitude) / width;
    // use this as a quick check if the projections are equal.  If they are we can shortcut some math
    // special cases 'EPSG:900913' =='EPSG:3857' == 'EPSG:102113'
    this.sameProjection = (this.projectionFrom === this.projectionTo) || (this.projectionTo === 'EPSG:3857' && (this.projectionFrom === 'EPSG:900913' || this.projectionFrom === 'EPSG:102113'));
  }
  projectTile(tileData, gridColumn, gridRow) {
    var bb = TileBoundingBoxUtils.getTileBoundingBox(this.tileMatrixSet.getBoundingBox(), this.tileMatrix, gridColumn, gridRow);
    if (!this.sameProjection) {
      return this.reproject(tileData, bb);
    }
    else {
      return this.cutAndScale(tileData, bb);
    }
  }
  cutAndScale(tileData, tilePieceBoundingBox) {
    var position = TileBoundingBoxUtils.determinePositionAndScale(tilePieceBoundingBox, this.tileMatrix.tile_height, this.tileMatrix.tile_width, this.tileBoundingBox, this.height, this.width);
    if (position.xPositionInFinalTileStart >= this.width || position.xPositionInFinalTileEnd <= 0 || position.yPositionInFinalTileStart >= this.height || position.yPositionInFinalTileEnd <= 0) {
      // this tile doesn't belong just skip it
    }
    else {
      this.addChunk(tileData, position);
    }
  }
  addChunk(chunk, position) {
    this.chunks.push({
      chunk: chunk,
      position: position
    });
  }
  reproject(tileData, tilePieceBoundingBox) {
    var y = 0;
    var x = 0;
    var height = this.height;
    var width = this.width;
    var proj4To = proj4(this.projectionTo);
    var proj4From;
    if (this.projectionFrom) {
      try {
        proj4From = proj4(this.projectionFrom);
      }
      catch (e) { }
    }
    if (!proj4From && this.projectionFromDefinition) {
      proj4From = proj4(this.projectionFromDefinition);
    }
    var conversion;
    try {
      conversion = proj4(this.projectionTo, this.projectionFrom);
    }
    catch (e) { }
    if (!conversion) {
      conversion = proj4(this.projectionTo, this.projectionFromDefinition);
    }
    var latitude;
    var rows = [];
    for (var i = 0; i < height; i++) {
      rows.push(i);
    }
    var columns = [];
    for (var i = 0; i < width; i++) {
      columns.push(i);
    }
    for (const row of rows) {
      latitude = this.tileBoundingBox.maxLatitude - (row * this.tileHeightUnitsPerPixel);
      var currentColumns = columns.slice();
      for (const column of currentColumns) {
        // loop over all pixels in the target tile
        // determine the position of the current pixel in the target tile
        var longitude = this.tileBoundingBox.minLongitude + (column * this.tileWidthUnitsPerPixel);
        // project that lat/lng to the source coordinate system
        var projected = conversion.forward([longitude, latitude]);
        var projectedLongitude = projected[0];
        var projectedLatitude = projected[1];
        // now find the source pixel
        var xPixel = this.tileMatrix.tile_width - Math.round((tilePieceBoundingBox.maxLongitude - projectedLongitude) / this.tileMatrix.pixel_x_size);
        var yPixel = Math.round((tilePieceBoundingBox.maxLatitude - projectedLatitude) / this.tileMatrix.pixel_y_size);
        if (xPixel >= 0 && xPixel < this.tileMatrix.tile_width
          && yPixel >= 0 && yPixel < this.tileMatrix.tile_height) {
          this.addPixel(column, row, xPixel, yPixel);
        }
      }
    }
  }
}

export default TileCreator
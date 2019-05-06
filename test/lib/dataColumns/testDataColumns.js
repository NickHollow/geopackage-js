var DataColumnsDao = require('../../../lib/dataColumns').DataColumnsDao
  , DataColumns = require('../../../lib/dataColumns').DataColumns
  , DataColumnConstraintsDao = require('../../../lib/dataColumnConstraints').DataColumnConstraintsDao
  , DataColumnConstraints = require('../../../lib/dataColumnConstraints').DataColumnConstraints
  , GeoPackageAPI = require('../../../lib/.').GeoPackage
  , TableCreator = require('../../../lib/db/tableCreator').default
  , testSetup = require('../../fixtures/testSetup')
  , path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('Data Columns tests', function() {

  var geoPackage;

  var originalFilename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
  var filename;

  function copyGeopackage(orignal, copy, callback) {
    if (typeof(process) !== 'undefined' && process.version) {
      var fsExtra = require('fs-extra');
      fsExtra.copy(originalFilename, filename, callback);
    } else {
      filename = originalFilename;
      callback();
    }
  }

  beforeEach('create the GeoPackage connection', function(done) {
    filename = path.join(__dirname, '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
    copyGeopackage(originalFilename, filename, async function(err) {
      geoPackage = await GeoPackageAPI.open(filename)
      should.exist(geoPackage);
      should.exist(geoPackage.getDatabase().getDBConnection());
      geoPackage.getPath().should.be.equal(filename);
      done();
    });
  });

  afterEach('should close the geopackage', function(done) {
    geoPackage.close();
    testSetup.deleteGeoPackage(filename, done);
  });

  it('should get the data column for property_0', function() {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumns('FEATURESriversds', 'property_0');
    dataColumn.should.be.deep.equal({
      table_name: 'FEATURESriversds',
      column_name: 'property_0',
      name: 'Scalerank',
      title: 'Scalerank',
      description: 'Scalerank',
      mime_type: null,
      constraint_name: null
    });
  });

  it('should get the contents for the data column for property_0', function() {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumns('FEATURESriversds', 'property_0');
    var contents = dc.getContents(dataColumn);
    contents.should.be.deep.equal({
      table_name: 'FEATURESriversds',
      data_type: 'features',
      identifier: 'FEATURESriversds',
      description: null,
      last_change: '2015-12-04T15:28:59.122Z',
      min_x: -20037508.342789244,
      min_y: -19971868.88040857,
      max_x: 20037508.342789244,
      max_y: 19971868.880408563,
      srs_id: 3857
    });
  });

  it('should get the data column for geom', function() {
    var dc = new DataColumnsDao(geoPackage);
    var dataColumn = dc.getDataColumns('FEATURESriversds', 'geom');
    should.not.exist(dataColumn);
  });

  it('should create a data column', function() {
    var dao = new DataColumnsDao(geoPackage);
    var dc = new DataColumns();
    dc.table_name = 'FEATURESriversds';
    dc.column_name = 'test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';
    var result = dao.create(dc);
    should.exist(result);
    var dataColumn = dao.getDataColumns('FEATURESriversds', 'test');
    dataColumn.should.be.deep.equal({
      table_name: 'FEATURESriversds',
      column_name: 'test',
      name: 'Test Name',
      title: 'Test',
      description: 'Test Description',
      mime_type: 'text/html',
      constraint_name: 'test constraint'
    });
  });

  it('should query by the constraint name to retrieve a data column', function() {
    var dao = new DataColumnsDao(geoPackage);
    var dc = new DataColumns();
    dc.table_name = 'FEATURESriversds';
    dc.column_name = 'test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';
    var result = dao.create(dc);
    should.exist(result);
    for (var dataColumn of dao.queryByConstraintName('test constraint')) {
      dataColumn.should.be.deep.equal({
        table_name: 'FEATURESriversds',
        column_name: 'test',
        name: 'Test Name',
        title: 'Test',
        description: 'Test Description',
        mime_type: 'text/html',
        constraint_name: 'test constraint'
      });
    }
  });

  it('should create a data column constraint', function() {
    var tc = new TableCreator(geoPackage);
    return tc.createDataColumnConstraints()
    .then(function() {
      var dao = new DataColumnConstraintsDao(geoPackage);
      var dc = new DataColumnConstraints();
      dc.constraint_name = 'test constraint';
      dc.constraint_type = 'range';
      dc.value = 'NULL';
      dc.min = 5;
      dc.min_is_inclusive = true;
      dc.max = 6;
      dc.max_is_inclusive = true;
      dc.description = 'constraint description';

      var resutl = dao.create(dc);
      for (var dataColumnConstraint of dao.queryByConstraintName('test constraint')) {
        dataColumnConstraint.should.be.deep.equal({
          constraint_name: 'test constraint',
          constraint_type: 'range',
          value: 'NULL',
          min: 5,
          min_is_inclusive: 1,
          max: 6,
          max_is_inclusive: 1,
          description: 'constraint description'
        });
      }
    });
  });

  it('should create a data column constraint and query unique', function() {
    var tc = new TableCreator(geoPackage);
    return tc.createDataColumnConstraints()
    .then(function() {
      var dao = new DataColumnConstraintsDao(geoPackage);
      var dc = new DataColumnConstraints();
      dc.constraint_name = 'test constraint';
      dc.constraint_type = 'range';
      dc.value = 'NULL';
      dc.min = 5;
      dc.min_is_inclusive = true;
      dc.max = 6;
      dc.max_is_inclusive = true;
      dc.description = 'constraint description';

      var result = dao.create(dc);
      var dataColumnConstraint = dao.queryUnique('test constraint', 'range', 'NULL');
      dataColumnConstraint.should.be.deep.equal({
        constraint_name: 'test constraint',
        constraint_type: 'range',
        value: 'NULL',
        min: 5,
        min_is_inclusive: 1,
        max: 6,
        max_is_inclusive: 1,
        description: 'constraint description'
      });
    });
  });

});

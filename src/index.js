const fs = require('fs');
const vtpbf = require('vt-pbf');
const geojsonvt = require('geojson-vt');

const helpers = require('./helpers.js');

var writeTile = function(xPath, y, mvt) {
    fs.writeFile(`${xPath}/${y}.mvt`, mvt, function(err) {
        // File is done writing when this is hit, update the entry in the tracking entry
        console.log(`Tile ${xPath}/${y} write completed`);
        if (err) {
            console.log(err);
        }
    });
};

var getTileForProcessing = function(z, x, y, tileIndex, options, xPath) {
    console.log(`Getting tile ${z} ${x} ${y} `);
    var tile = tileIndex.getTile(z, x, y);

    if (tile !== null) {
        var pbfOptions = {};

        pbfOptions[options.layerName] = tile;
        var pbf = vtpbf.fromGeojsonVt(pbfOptions);

        writeTile(xPath, y, pbf);
    } else {
        console.log(`Tile ${xPath}/${y} empty. Not written.`);
    }
};

var geojson2mvt = function(geoJson, options, geojsonvtOptions) {

    const tileIndex = geojsonvt(geoJson, geojsonvtOptions);

    // create the "root directory" to place downloaded tiles in
    try {
        fs.mkdirSync(options.rootDir, 0777);
    } catch (err) {
        if (err.code !== 'EEXIST') callback(err);
    }

    var tileCoords = {};
    var tileBounds;

    for (var z = options.zoom.min; z <= options.zoom.max; z++) {

        //create z directory in the root directory
        var zPath = `${options.rootDir}/${z.toString()}/`;
        try {
            fs.mkdirSync(zPath, 0777)
        } catch (err) {
            if (err.code !== 'EEXIST') callback(err);
        }

        // get the x and y bounds for the current zoom level
        var tileBounds = helpers.getTileBounds(options.bbox, z);
        console.log(tileBounds)

        // x loop
        for (var x = tileBounds.xMin; x <= tileBounds.xMax; x++) {

            // create x directory in the z directory
            var xPath = zPath + x.toString();
            try {
                fs.mkdirSync(xPath, 0777)
            } catch (err) {
                if (err.code !== 'EEXIST') callback(err);
            }

            // y loop
            for (var y = tileBounds.yMin; y <= tileBounds.yMax; y++) {
                getTileForProcessing(z, x, y, tileIndex, options, xPath);
            }
        }
    }
};

module.exports = geojson2mvt;

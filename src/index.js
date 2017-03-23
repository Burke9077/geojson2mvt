const fs = require('fs');
const vtpbf = require('vt-pbf');
const geojsonvt = require('geojson-vt');

const helpers = require('./helpers.js');
const child_process = require('child_process');
const scribe = child_process.fork(__dirname + '/scribe.js');

// Variable to keep track of what we've done so far
var tileVars = {
    total: 0,
    remaining: 0,
    done: false
}

// Log any messages sent from scribe
scribe.on('message', function(m) {
    // Decrement the counter, scribe is done
    tileVars.remaining = tileVars.remaining - 1;

    if (tileVars.done === true) {
        if (tileVars.remaining === 0) {
            process.exit(0);
        }
    }
});

var getTileForProcessing = function(z, x, y, tileIndex, options, xPath) {
    console.log(`Getting tile ${z} ${x} ${y} `);
    var tile = tileIndex.getTile(z, x, y);

    if (tile !== null) {
        var pbfOptions = {};

        pbfOptions[options.layerName] = tile;
        var pbf = vtpbf.fromGeojsonVt(pbfOptions);

        tileVars.total = tileVars.total + 1;
        tileVars.remaining = tileVars.remaining + 1;

        scribe.send({
            xPath: xPath,
            y: y,
            pbf: pbf
        });
    } else {
        console.log(`Tile ${xPath}/${y} empty. Not written.`);
    }
};

var geojson2mvt = function(geoJson, options, geojsonvtOptions) {

    const tileIndex = geojsonvt(geoJson, geojsonvtOptions);

    var tileCoords = {};
    var tileBounds;

    for (var z = options.zoom.min; z <= options.zoom.max; z++) {

        // Starting directory (z)
        var zPath = `${options.rootDir}/${z.toString()}/`;

        // get the x and y bounds for the current zoom level
        var tileBounds = helpers.getTileBounds(options.bbox, z);
        console.log(tileBounds)

        // x loop
        for (var x = tileBounds.xMin; x <= tileBounds.xMax; x++) {

            // X directory path
            var xPath = zPath + x.toString();

            // y loop
            for (var y = tileBounds.yMin; y <= tileBounds.yMax; y++) {
                getTileForProcessing(z, x, y, tileIndex, options, xPath);
            }
        }
    }

    tileVars.done = true;
};

module.exports = geojson2mvt;

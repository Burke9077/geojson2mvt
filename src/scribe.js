// Scribe writes things sent to it

const fs = require('fs');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

process.on('message', function(writeObjs) {
    const path = `${writeObjs.xPath}/${writeObjs.y}.mvt`;
    mkdirp(getDirName(path), function(err1) {
        if (err1) {
            console.error(err1);
        }

        console.log(`Begin writing ${path}`);
        fs.writeFile(path, Buffer(writeObjs.pbf), function(err) {
            if (err) {
                console.error(err);
            }

            // File is done writing when this is hit, update the entry in the tracking entry
            console.log(`Done writing ${path}`);
            process.send(`Tile ${path} write completed`);
        });
    });
});

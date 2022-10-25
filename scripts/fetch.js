const COLLECTION = require('../config/collection.json');
const { SourceManager } = require('../lib/index.js');

const argv = require("process.argv");
const processArgv = argv(process.argv.slice(2));

const config = processArgv({
  outputDir: null
});

if ( config.help ) {

    let msg = `usage: generate [options]
  --help      : this message
  --outputDir : specify an output directory
    `;

    console.log(msg);
    process.exit(0);
}

let srcMGR = new SourceManager(COLLECTION, config.outputDir);

let getRepoPathProcessor = srcMGR.getRepoPath;
srcMGR.getRepoPath = function getRepoPath( jsonObj ) {

  if( !jsonObj ) {
    return null;
  }

  if (  Object.prototype.hasOwnProperty(jsonObj,'collection') &&
        jsonObj.collection ) {

    if ( jsonObj.collection.length == 1 ) {
      return getRepoPath(jsonObj.url);
    }

    for ( let ref of jsonObj.references ) {
      if ( ref.name === "download" ) {
        return getRepoPathProcessor({ url: ref.url });
      }
    }

    return null;

  } else {

    return getRepoPathProcessor({ url: jsonObj.url });
  }

  return null;
}

srcMGR.fetchSources();

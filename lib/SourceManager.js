const fs = require('fs');
const path = require('path');
const { simpleGit, CleanOptions } = require('simple-git');
const { v4: uuidv4 } = require('uuid');

class SourceManager {

  #gitOptions = {
     'baseDir': null,
     'binary': 'git',
     'maxConcurrentProcesses': 6,
     'trimmed': false,
  }

  #gitClient = null;

  constructor(src, rootPath) {

    this.dataSource = src;

    // file paths
    this.sources.root = (rootPath ? rootPath : this.sources.root);
    this.#gitOptions.baseDir = path.resolve( this.sources.root );

    if ( !fs.existsSync(this.#gitOptions.baseDir) ) {
      fs.mkdirSync(this.#gitOptions.baseDir);
    }

    // initialize
    this.#gitClient = simpleGit(this.#gitOptions);
    this.cleanup();
  }

  cleanup() {

    if ( fs.existsSync(this.#gitOptions.baseDir) ) {
      fs.rmSync(this.#gitOptions.baseDir, { recursive: true, force: true });
      fs.mkdirSync(this.#gitOptions.baseDir);
    }

    this.#gitClient.clean(CleanOptions.FORCE);
  }

  set dataSource(src) {

    if ( !src || typeof(src) !== 'object' ) {
      throw new Error('invalid sources input')
    }

    // TODO:
    // validate input

    this.sources = src;
  }

  async fetchSources ( sources ) {

    let self = this;
    let collectionName = '';
    let targetSources = (sources ? sources : self.sources);

    targetSources.forEach(async function (src) {

      let repoPath = self.getRepoPath(src);
      if(!repoPath) {
        self.onCloneStart( repoPath, new Error('Invalid repository path') )
        return;
      }

      self.onCloneStart( repoPath );
      await self.#gitClient.clone(repoPath).then(() => {
        self.onCloneEnd(repoPath);
      }).catch( (err) => {
        self.onCloneEnd(repoPath, err);
      });

    })

  }

  onCloneStart( repoPath, err ) {
    if(!repoPath || err) {
      return;
    }
    console.log('# Cloning into... ' + repoPath);
  }

  // Overload this method to recieve callbacks when repositories are
  // cloned, or if there are errors in cloning
  onCloneEnd( repoPath, err ) {

    if ( err ) {
      console.log('An error occurred while cloning ' + repoPath);
      console.log(err);
      return;
    }

    console.log("> Cloned " + repoPath);
  }

  // Overload this method to provide your own method of extracting
  // a repository URL from the JSON object
  getRepoPath (item) {

    if ( item.url.indexOf('git') >= 0 ) {

      if ( item.url.indexOf('git') >= 0 ) {

        if( item.url.indexOf('github') >= 0 &&
            item.url.indexOf('#') > 10) {

          return item.url.split('#')[0];
        }

        return item.url;
      }

      return item.url;

    } else if ( item.references && item.references.length > 0 ){

      for ( let ref in item.references ) {

        return getRepoPath(ref);

      }

    }

    return null;
  }

}

module.exports = SourceManager;

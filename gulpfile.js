var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var es = require('event-stream');
var runSync = require('run-sequence');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var replace = require('gulp-replace');
var git = require('git-rev');
var q = require('q');
var jsdoc = require('gulp-jsdoc3');
var run = require('gulp-run');
var rename = require('gulp-rename');

var paths = {
  startCode: './src/pluginStart.js',
  endCode: './src/pluginEnd.js',
  exportCode: './src/export.js',
  interfaces: './src/interfaces/*.js',
  models: './src/models/*.js',
  deferredModel: './src/models/deferred.js',
  store: './src/storage/**/*.js',
  apiWrappers: './src/APIs/**/*.js',
  utilities: './src/utils/*.js',
  context: './src/context/**/*.js',
  main: './src/main.js',
  distro: './dist',
  tmp: './.tmp',
  docs: './docs'
};
var codePaths = [paths.startCode, paths.main, paths.deferredModel, paths.utilities, paths.interfaces, paths.models, paths.store, paths.context, paths.apiWrappers, paths.exportCode, paths.endCode];

var pluginName = "flybits.js";
var pluginMinifiedName = "flybits.min.js";

var startLiveReloadServer = function(){
  browserSync.init({
    open: false,
    server: {
      baseDir: ''
    }
  });
  console.log("> started live reload server");
};

var changeDetected = function(file){
  console.log('> change detected',file);

  runSync('build','jsdoc',function(){
    browserSync.reload();
  });
};

gulp.task('clean',function(){
  return es.concat(
    gulp.src(paths.tmp).pipe(clean()),
    gulp.src(paths.distro).pipe(clean()),
    gulp.src(paths.docs).pipe(clean())
  );
});

gulp.task('default', ['build']);

gulp.task('combine',function(){
  return es.concat(
    gulp.src(codePaths)
      .pipe(concat(pluginMinifiedName))
      .pipe(uglify())
      .pipe(gulp.dest(paths.tmp)),
    gulp.src(codePaths)
      .pipe(concat(pluginName))
      .pipe(gulp.dest(paths.tmp))
  );
});

gulp.task('injectVersion',function(){
  var deferred = q.defer();
  git.branch(function(branchStr){
    git.short(function(hash){
      var versionStr = branchStr+":"+hash;
      var header = "// @author Justin Lam\n" +
                   "// @version " +versionStr+"\n";
      gutil.log("@branch",branchStr);
      gutil.log("@version",versionStr);

      gulp.src(paths.tmp+"/"+pluginName)
        .pipe(insert.prepend(header))
        .pipe(replace(/--flbversion/i, versionStr))
        .pipe(gulp.dest(paths.distro));
      gulp.src(paths.tmp+"/"+pluginMinifiedName)
        .pipe(insert.prepend(header))
        .pipe(replace(/--flbversion/i, versionStr))
        .pipe(gulp.dest(paths.distro));

      deferred.resolve();
    });
  });

  return deferred.promise;
});

gulp.task('watchChanges',function(){
  startLiveReloadServer();
  var paths = codePaths.slice(1);
  paths.unshift('README.md');
  gulp.watch(paths,changeDetected);
});

gulp.task('dev',function(callback){
  runSync('build','jsdoc','watchChanges',callback);
});

gulp.task('build',function(callback){
  runSync('clean','combine','injectVersion',callback);
});

gulp.task('test',function(callback){
  return run('npm run testnocolor').exec()
    .pipe(rename('testrun_'+new Date().getTime()))
    .pipe(gulp.dest('testResults'));
});

gulp.task('jsdoc',function(callback){
  var deferred = q.defer();
  var paths = codePaths.slice(1,codePaths.length-1);
  paths.unshift('README.md');
  gulp.src(paths,{read:false})
    .pipe(jsdoc(function(){
      deferred.resolve();
    }));
  return deferred.promise;
});

const gulp = require("gulp");
const fs = require('fs');
const replace = require('gulp-replace');
const webpack = require('webpack-stream');
const del = require('del');
const exec = require('gulp-exec');

const ENV_KEYS = ['WEB_URL_BASE_CONST', 'WALLET_URL_BASE_CONST', 'TRADING_CHART_DATA_URL_BASE_CONST'];

gulp.task('default', ['clean-chart-build-and-temp']);

gulp.task('build-adapter-and-copy-src', function () {
    return gulp.src('src/**').pipe(exec('npm run build-adapter'))
        .pipe(gulp.dest('temp'));
});

gulp.task('replace-env', ['build-adapter-and-copy-src'], () => {
    let task = gulp.src(['./src/constants/web.const.js']);
    ENV_KEYS.forEach((key) => {
        if (process.env[key]) {
            task = task.pipe(replace(key, "'" + process.env[key] + "'"));
        }
    });
    return task.pipe(gulp.dest('./temp/constants'));
});

gulp.task('build', ['replace-env'], () => {
    return gulp.src(['./temp/index.js'])
        .pipe(webpack(require('./config/webpack.config.prod.js')))
        .pipe(gulp.dest('dist/'));
});

gulp.task('copy-public',['build'] ,function () {
    return gulp.src('public/**')
        .pipe(gulp.dest('dist/'));
});

gulp.task('clean-chart-build-and-temp', ['copy-public'], function () {
    return del(['./public/datafeeds/adapter/dist/**',
        './public/datafeeds/adapter/lib/**',
        './temp/**'
    ], {
        force: true
    });
});

// dummy env values
const setEnvValues = () => {
    process.env.NODE_ENV = 'production';
    for (const key of ENV_KEYS) {
        process.env[key] = 'Sample value / url';
    }
}
setEnvValues();
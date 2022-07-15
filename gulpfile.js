const { src, dest, parallel, series, watch } = require('gulp');
const concat = require('gulp-concat');
const htmlmin = require('gulp-htmlmin');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const sass = require('gulp-sass')(require('sass'));
const rename = require('gulp-rename');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const svgsprite = require('gulp-svg-sprite');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const tiny = require('gulp-tinypng-compress');
const babel = require('gulp-babel');
const notify = require('gulp-notify');
const uglify = require('gulp-uglify-es').default;
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const ftp = require('vinyl-ftp');
const pug = require('gulp-pug');
const pugLinter = require('gulp-pug-linter');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const revdel = require('gulp-rev-delete-original');
const { readFileSync } = require('fs');
const browsersync = require('browser-sync').create();


const clean = () => {
	return del(['dist']);
}

const fonts = () => {
	src('src/fonts/**/*.ttf')
		.pipe(ttf2woff())
		.pipe(dest('dist/fonts'))
	return src('src/fonts/**.ttf')
		.pipe(ttf2woff2())
		.pipe(dest('dist/fonts'))
}

const resources = () => {
	return src('src/resources/**')
		.pipe(dest('dist/resources'))
}

const styles = () => {
	return src('src/scss/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'expanded'
		}).on('error', notify.onError()))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(autoprefixer({
			cascade: false
		}))
		.pipe(cleancss({
			level: 2
		}))
		.pipe(sourcemaps.write())
		.pipe(dest('dist/css'))
		.pipe(browsersync.stream())
}

const layout = () => {
	return src('src/index.pug')
		.pipe(pug({
				pretty: true
		}).on('error', notify.onError()))
		.pipe(dest('dist'))
		.pipe(browsersync.stream())
}
const svgSprites = () => {
	return src('src/img/**/*.svg')
		.pipe(svgsprite({
				mode: {
						stack: {
								sprite: '../sprite.svg'
						}
				}
		}))
		.pipe(dest('dist/img'))
}

const scripts = () => {
	return src('src/js/main.js')	
		.pipe(webpackStream(
			{
			mode: 'development',
			output: {
				filename: 'main.js',
			},
			module: {
				rules: [{
				test: /\.m?js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
					presets: ['@babel/preset-env']
					}
				}
				}]
			},
			}
		))
		.on('error', function (err) {
			console.error('WEBPACK ERROR', err);
			this.emit('end'); // Don't stop the rest of the task
		})
		.pipe(sourcemaps.init())
		.pipe(uglify().on("error", notify.onError()))
    	.pipe(sourcemaps.write('.'))
		.pipe(rename({ suffix: '.min' }))
		.pipe(dest('dist/js'))
		.pipe(browsersync.stream())
}

const img = () => {
	return src([
		'src/img/**/*.jpg',
		'src/img/**/*.jpeg',
		'src/img/**/*.png',
		'src/img/**/*.webp',
	])
		.pipe(dest('dist/img'))
}

const watchFiles = () => {
	browsersync.init({
		server: {
			baseDir: 'dist'
		}
	});
}

watch('src/**/**/*.pug', layout);
watch('src/scss/**/*.scss', styles);
watch('src/img/**/**.jpg', img);
watch('src/img/**/**.jpeg', img);
watch('src/img/**/**.png', img);
watch('src/img/**/**.webp', img);
watch('src/img/**/**.svg', svgSprites);
watch('src/resources/**', resources);
watch('src/fonts/**.ttf', fonts);
watch('src/js/**/*.js', scripts);

exports.layout = layout;
exports.styles = styles;
exports.scripts = scripts;
exports.fonts = fonts;
exports.svgSprites = svgSprites;
exports.img = img;
exports.clean = clean;
exports.default = series(clean, parallel(layout, scripts, fonts, resources, img, svgSprites), styles, watchFiles);
// exports.default = series(clean, fonts, resources, layout, scripts, styles, img, svgSprites, watchFiles);



const stylesBuild = () => {
	return src('src/scss/**/*.scss')
		.pipe(sass({
			outputStyle: 'expanded'
		}).on('error', notify.onError()))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(autoprefixer({
			cascade: false
		}))
		.pipe(cleancss({
			level: 2
		}))
		.pipe(dest('dist/css'))
}

const scriptsBuild = () => {
	return src('src/js/main.js')
		.pipe(webpackStream(
			{
			mode: 'development',
			output: {
				filename: 'main.js',
			},
			module: {
				rules: [{
				test: /\.m?js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
					presets: ['@babel/preset-env']
					}
				}
				}]
			},
			}))
		.on('error', function (err) {
			console.error('WEBPACK ERROR', err);
			this.emit('end'); // Don't stop the rest of the task
		})
		.pipe(uglify().on("error", notify.onError()))
		.pipe(rename({ suffix: '.min' }))
		.pipe(dest('dist/js'))
}

const layoutBuild = () => {
	return src('./src/index.pug')
		.pipe(pug({
			pretty: false
		}).on('error', notify.onError()))
		.pipe(dest('dist'))
}

const tinypng = () => {
	return src([
		'src/img/**/*.jpg',
		'src/img/**/*.jpeg',
		'src/img/**/*.png',
		'src/img/**/*.webp',
	])
    .pipe(tiny({
			key: 'LZQqrGgVXzdQRdPYJMKhv6R5hs6kQMr2',
			log: true
    }))
    .pipe(dest('dist/img'))
}

exports.build = series(clean, parallel(layoutBuild, scriptsBuild, fonts, resources, img, svgSprites), stylesBuild, tinypng);



const cache = () => {
	return src('dist/**/*.{css,js,svg,png,jpg,jpeg,woff2,woff}', {
		base: 'dist'
	})
		.pipe(rev())
		.pipe(revdel())
		.pipe(dest('dist'))
		.pipe(rev.manifest('rev.json'))
		.pipe(dest('dist'))
}

const rewrite = () => {
	const manifest = readFileSync('dist/rev.json');

	return src('dist/index.html')
		.pipe(revRewrite({ manifest }))
		.pipe(dest('dist'));
}

exports.cache = series(cache, rewrite);



const deploy = () => {
	let conn = ftp.create({
		host: '',
		user: '',
		password: '',
		parallel: 10,
		log: gutil.log
	});

	let globs = [
		'dist/**',
	];

	return src(globs, {
			base: 'dist',
			buffer: false
		})
		.pipe(conn.newer('')) // only upload newer files
		.pipe(conn.dest(''));
}

exports.deploy = deploy;
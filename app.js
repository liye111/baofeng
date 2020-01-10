var createError = require('http-errors');
var express = require('express');
var path = require('path');
//使用中间件[cookie-session]操作session
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
//获取post提交参数的中间件
var bodyParser = require('body-parser')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine("html",require("ejs").__express);

//使用中间件[cookie-session]操作session
app.use(cookieSession({
  name: 'cursession',
  keys: ['123!@#@', 'ab@!#c']
}));
app.use((req, res, next) => {

  //获取当前已登录的用户
  let curUname = req.session.CURUSR ? req.session.CURUSR : '';

  if (req.url == '/main' && curUname == '') {
      res.render('admin/404.html', { "tip": "请先登录", "url": "/logins" });
      next();
      return false;
  } else {
      next();
  }

})

//post以键值对方式提交
app.use(bodyParser.urlencoded({ extended: false }))
//post提交的数据转成json
app.use(bodyParser.json())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads",express.static(path.join(__dirname, 'uploads')));
app.use('/', indexRouter);
app.use(adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

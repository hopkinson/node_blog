var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// 会话
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
// 页面通知
var flash = require('connect-flash');
// var index = require('./routes/index');
var routes = require('./routes');
// 数据库设置
var settings = require('./setting.js');




var app = express();
// port端口
app.set('port', process.env.PORT || 4000)

// 模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//会话信息存储到mongoDB中
app.use(session({
    secret: settings.cookieSecret, //防止篡改cookie
    key: settings.db, //Cookie名字
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30, //cookie生存期
        store: new MongoStore({
            // db: settings.db,
            // host: settings.host,
            // port: settings.port
            url: 'mongodb://localhost/nodeBlog'
        })
    }
}))



routes(app);


// module.exports = app;
app.listen(app.get('port'), function(err) {
    console.log('=========')
    console.log('server listening on port:' + app.get('port'))
})

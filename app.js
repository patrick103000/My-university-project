var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');

const session = require('express-session');

//rich
const auth = require('./routes/middleware/authentication');
const seatstate = require('./routes/seatstate')
const bookSeatRouter = require('./routes/bookseat');



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
//sh
var dataRouter = require('./routes/dataprocess');
//lee
const merchantRouter = require('./routes/merchant');
const cartRouter = require('./routes/cart');
const restaurantRouter = require('./routes/restaurant');



var app = express();

// 配置 body-parser 中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: "YTxVfHnsyKcmSSGtBfXtQ9cEZsWTUG3k29d82eNfHgkchX9af8HVzxkKxCZABZr8",
  resave: false,
  saveUninitialized: false
}));


function showheadericon(req, res, next) {
  if(req.auth_r){
    req.header_view = 'header_auth.ejs';
    next();
  }else{
    req.header_view  = 'header.ejs';
    next();
  }
}

app.use(auth.checkrefreshToken)
app.use(showheadericon)


app.use('/users', usersRouter);
app.use('/',indexRouter);

//sh
app.use('/login', dataRouter);
app.use('/log-in', dataRouter);
app.use('/register', dataRouter);
app.use('/register-page', dataRouter);
app.use('/background',dataRouter);
app.use('/store-add', dataRouter);
app.use('/menu-add', dataRouter);
app.use('/menu-update', dataRouter);
app.use('/showinfo', dataRouter)
app.use('/updateinfo', dataRouter)
app.use('/checkout',dataRouter)
app.use('/check_neworders', dataRouter)
app.use('/completeOrder', dataRouter)

//rich
app.use('/logout', dataRouter)


app.use('/bookseat',auth.checkaccessToken,bookSeatRouter);
app.use('/seatstate', seatstate);



//lee
app.use('/restaurant', restaurantRouter);
app.use('/store/:id',restaurantRouter);//檢視餐廳頁面
app.use('/menu/:id',restaurantRouter)
app.use('/menu',restaurantRouter)
app.use('/cart',cartRouter);
app.use('/orderinfo-page',auth.checkaccessToken, restaurantRouter)
app.use('/order/:id', restaurantRouter)
  
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



const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');


const sensorRouter = require('./routes/sensordata');//

const sensorApp = express();

sensorApp.set("views", path.join(__dirname, 'views'));
sensorApp.set('view engine', 'ejs');

sensorApp.use(logger('dev'));//用於在控制台或文件中記錄http請求信息
sensorApp.use(express.json());
sensorApp.use(express.urlencoded({ extended: false }));
sensorApp.use(cookieParser());//將cookie標頭檔轉成js對象
sensorApp.use(express.static(path.join(__dirname, 'public')));



sensorApp.use('/sensordata',sensorRouter);

// catch 404 and forward to error handler

sensorApp.use(function(req, res, next) {
    next(createError(404));
});
  
  // error handler
  
sensorApp.use(function(err, req, res, next) {
    // set locals, only providing error in development
    console.log("err.message:"+JSON.stringify(err.message));
    res.locals.message = err.message;
    res.locals.error = req.sensorApp.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
    
});


module.exports = sensorApp;
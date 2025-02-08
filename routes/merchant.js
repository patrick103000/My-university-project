var express = require('express');
var router = express.Router();
router.get('/', function(req, res, next) {
    res.render('merchant',{
        main:"main.ejs",
        header: req.header_view
    }); 
});

module.exports = router;
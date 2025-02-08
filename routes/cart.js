var express = require('express');
var router = express.Router();
router.get('/', function(req, res, next) {
    res.render('cart_auth',{header: req.header_view}); 
});

module.exports = router;
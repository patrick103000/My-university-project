var express = require('express');
var router = express.Router();
router.get('/', function(req, res, next) {

    if(req.auth_a){//若認證通過
        res.render('menu_auth'); 
    }else{
        res.render('menu')
    }
    
});

module.exports = router;
var express = require('express');
var router = express.Router();
let queue = require("../golbalvalue/queue");

/* GET home page. */
router.get('/', function(req, res, next) {

  if(req.auth_a){//若認證通過
    const AheadOf = queue.getCustomersAheadOf(req.userdata.mail);
    if(queue.getCustomerByMail(req.userdata.mail) && AheadOf != -1){
      res.render('index_auth', {
        main:"main.ejs",
        title:'gogofast_auth',
        seat_booking: "showqueue_auth.ejs"
        // CustomersAheadOf:AheadOf
      })
    }else if(queue.getCustomerByMail(req.userdata.mail) && AheadOf <= 0){
      res.render('index_auth', {
        main:"main.ejs",
        title: 'gogofast_auth',
        seat_booking: "bookSeat_auth.ejs"
      }); 
    }else{
      res.render('index_auth', {
        main:"main.ejs",
        title: 'gogofast_auth',
        seat_booking: "bookSeat_auth.ejs"
      }); 
    }

  }else{
    res.render('index', {
      main:"main.ejs",
      title: 'gogofast',
      seat_booking: "bookSeat_auth.ejs"
    }); 
  }

});


module.exports = router;

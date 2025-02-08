const express = require('express');
const router = express.Router();
const tables = require('../golbalvalue/TablesSeats_value').tables;
let queue = require("../golbalvalue/queue");

router.get('/', function(req, res, next) {
    console.log('req.userdata')
    console.log(req.userdata)

    if(req.userdata){
        const seats = queue.getcustomerseat(req.userdata.mail)
        if(seats){
            console.log(seats);
            res.render('seatstate',{
                customerseats:JSON.stringify(seats)
            })
        }else{
            res.render('seatstate',{
                customerseats:'null'
            })
        }

    }else{
        res.render('seatstate',{
            customerseats:'null'
        })
    }
});



module.exports = router;
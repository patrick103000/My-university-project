const express = require('express');
const router = express.Router();
const tables = require('../golbalvalue/TablesSeats_value').tables;
const Queue = require('../golbalvalue/queue');
const socket = require('../golbalvalue/socket');

router.post('/', async function(req, res, next) {
    // 检查是否存在 req.body.Number，因为我们现在使用 POST 请求
    if (req.body.Number) {
        const numberOfPeople = parseInt(req.body.Number, 10);
        console.log('test 1');

        // 检查是否是一个有效的数字并且大于零
        if (!isNaN(numberOfPeople) && numberOfPeople > 0) {
            console.log('test 2');
            if (req.auth_a === true) {
                console.log('test 3');
                Queue.addCustomer(numberOfPeople, req.userdata);
                console.log("book userdata " + req.userdata);
                console.log("queue length : " + Queue.getQueueLength());
                res.redirect('/');
            } else {
                // 處理未經授權的情況
                res.status(401).send('未經授權');
            }
        } else {
            // 處理不合法的人數值
            res.status(400).send('無效的人數');
        }
    } else {
        // 處理缺少人數值的情況
        res.status(400).send('缺少人數值');
    }

    console.log(tables);
});


router.get('/seatstate', async function(req, res, next) {
    if(Queue.getcustomerseat(req.userdata.mail)){
        const seats = Queue.getcustomerseat(req.userdata.mail);
        console.log('/seatstate  seats')
        console.log(seats)
        res.render('seatstate_forbooking',{
            getemptydata: JSON.stringify(seats)
        })
    }

})



module.exports = router;
const express = require('express');
const router = express.Router();
const tables = require('../golbalvalue/TablesSeats_value.js').tables;
const socket_server = require('../golbalvalue/socket.js');
//const socket_server = require('../golbalvalue/golbalclass.js');

router.use(express.json());
/* GET users listing. */

router.get('/', function(req, res){
    const clientIP = req.ip;
    console.log(clientIP);
})
router.post('/', function(req, res, next) {
    const jsonData = req.body; // JSON 数据已经被解析为 JavaScript 对象
    
    
    changeSeatstate(jsonData.TableNum , jsonData.SeatNum, jsonData.SeatFull);
    res.json({ message: 'JSON data received and processed.'});
});
function changeSeatstate(tablenum, seatnum, seatfull){
    
    let result = tables.getSeatObject(tablenum,seatnum).changeSeatState_quikly(seatfull);//更改server內seat的state
    if(result){//changeSeatState將反回一個result，以確認seatfull是否已變更
        console.log(tablenum+"  "+seatnum+" change state be empty ");
        socket_server.socket_server().emit('seatStateChanged', {//傳送資訊，以更新客戶端畫面
            tablenum,
            seatnum,
            seatfull
        });
    }

}

module.exports = router;

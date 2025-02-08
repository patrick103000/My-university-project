// 引入所需模块
var express = require('express');
var router = express.Router();
const mysql = require('mysql2/promise');
const Data2sql = require('../class/dataconnect'); // 导入Data2sql类
const db = new Data2sql(); // 创建Data2sql实例
const auth = require('./middleware/authentication');
// 处理路由的GET请求
router.get('/',function(req, res, next) {
  
    const url = req.originalUrl;
    const path = url.split('/');
    const type = path[1];
    const id = path[2];
    console.log(type,id)
//根據餐廳跳轉到菜單頁面---------------
    if(type === "menu"){
        console.log("跳轉至菜單")
        db.showmenu(id)
        .then((Result) => {
        if (Result.success) {
            // 渲染menu视图，传递标题和菜单数据
            res.render('menu', {
            header: req.header_view,
            title: '菜单',
            menuRow: Result.menuRow,
            Store_id:id,
            });
        } else {
            console.error(Result.message);
        }
    });
    }else if(type === "restaurant"){
        res.render('restaurant',{header: req.header_view})

//跳轉到訂單資訊頁面-------------------------
    }else if(type === "orderinfo-page"){
        console.log("===========================order")
        db.showorder(req.userdata.id)
        .then((Result) => {
            if (Result.success) {
                console.error(Result.message);
                // 渲染menu视图，传递标题和菜单数据
                res.render('order', {
                header: req.header_view,
                order_id:id,
                orderRow: Result.orderRow,
                });
                
            } else {
                res.render('index');
                console.error(Result.message);
            }
        });

//根據訂單編號跳轉到個別的訂單資訊---------------        
    }else if(type === "order"){
       
        db.show_orderinfo(id)
        .then((Result) => {
            //console.log(Result.orderRow[0].Order_info,Result.orderRow[0].Order_complete)
        if (Result.success) {
            // 渲染menu视图，传递标题和菜单数据
            res.render('order-info', {
            order_id:id,
            store_id:Result.orderRow[0].Store_id,
            orderRow: Result.orderRow[0].Order_info,
            orderTime: Result.orderRow[0].Order_time,
            complete: Result.orderRow[0].Order_complete,
            header: req.header_view,
            });
        } else {
            console.error(Result.message);
        }
        });
}});



module.exports = router;

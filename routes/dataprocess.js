var express = require('express');
var router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require("bcrypt");// Improting bcrypt package
const Data2sql = require('../class/dataconnect'); // 导入Data2sql类
const db = new Data2sql(); // 创建Data2sql实例
const users = [];
var Store_id = "";

////BYfurich
const jwt = require('jsonwebtoken');
const session = require('express-session');

//接收get請求
router.get('/', function(req, res) {

  const url = req.originalUrl;
  const result = req.body; // 獲取POST請求中的JSON

  if(url === "/log-in"){  //登入頁面
    res.render('log-in', {
      title: 'enter',
      message: '',
      result: true
    })

  } else if(url === "/register-page"){ //註冊頁面
    res.render('register', {
      title: 'register',
      message: '',
      result: true
  });
  
  }else if(url === "/update"){
    db.showmenu(result.user) //菜單查詢
    .then((menuResult) => {
      if (menuResult.success) {
        res.render('background', {
          title: 'background',
          menuRow: menuResult.menuRow
        });
        Store_id = result.user;
      } else if(!menuResult.success) {
        res.render('background', {
          title: 'background',
          menuRow: menuResult.menuRow
        });
      }else{
        console.error(menuResult.message);
        
    }}
    );   
  }else if (url === "/showinfo"){
    db.show_storeinfo(req.userdata.id)
    .then((result) => {
      res.json( {
        info: result.inforow,
        success: result.success,
        redirectTo: 'restaurantInfo-div'
      })
    })
  }else if (url === "/logout"){
    const auth = require('./middleware/authentication')
    router.use(auth.checkaccessToken)
    if(req.auth_a){
      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');
      res.redirect('/'); 

    }
    
  }




});



//接收post請求
router.post('/', async(req, res) =>{

  const url = req.originalUrl;
  const result = req.body; // 獲取POST請求中的JSON
  
  const id = Date.now().toString();
  const name = req.body.name;
  const email = req.body.email;


//登入頁面----------------------------------------
  if(url === "/log-in"){  
    res.render('log-in', {
      title: 'login',
      message: ''
  });
//註冊頁面-------------------------------------
  } else if(url === "/register-page"){

    res.render('register', {
      title: 'register',
      message: ''
  });

//登入比對----------------------------------------
  } else if(url === "/login"){

    db.login(email, req.body.password)
    .then((result) => {
      
      if (result.success) {
        if(result.role === "user"){ //用戶
          const refreshToken = generateRefreshToken(result.id);
          const accessToken = generateAccessToken(result.userdata);
          ///////Byfurich
          let redirectTo = '/index';
          if(req.session.previousUrl){
            redirectTo = req.session.previousUrl; 
          }
          res.cookie('refreshToken', refreshToken);
          res.cookie('accessToken', accessToken);
          res.redirect('/');
         
        } else { // 商家
          db.showmenu(result.id) // 菜單查詢
            .then((menuResult) => {
              db.showorderbyorder(result.id)
              .then((orderResult) => {
              const renderData = {
                title: 'background',
                userid: result.id,
                redirectTo: 'order-div',
              };
              if (menuResult.success) {
                const refreshToken = generateRefreshToken(result.id);
                const accessToken = generateAccessToken(result.userdata);

                renderData.menuresult = menuResult.success;
                renderData.menuRow = menuResult.menuRow;
                renderData.menumessage = menuResult.message;
                renderData.success = false;
                renderData.orderRow = orderResult.orderRow;

                res.cookie('refreshToken', refreshToken);
                res.cookie('accessToken', accessToken);

              } else {
                renderData.menuresult = menuResult.success;
                // 在不成功的情況下，你可能想要處理其他相應的邏輯
              }
              res.render('background', renderData);
              Store_id = result.user;
            })
            })
            .catch((error) => {
              console.error('Error fetching menu:', error);
              // 在發生錯誤的情況下處理
              res.status(500).send('Internal Server Error');
            });
        }
        
      } else {
        res.render('log-in', {
          title: 'Login',
          message: result.message,
          result: result.success
        });
      }
    });  


//註冊-------------------------------------
  } else if(url === "/register"){ 
    const hashedPassword = await bcrypt.hash(req.body.password,10);
    try{
      if(req.body.password===req.body.checkpassword)
      {
        users.push({
          id: id,
          name: name,
          email: email,
          password: hashedPassword, 
        })  
        db.register(id,name,email, hashedPassword)
        .then((result) => {

          if (result.success) {
            console.log(result.message);
              res.render('log-in', {
                title: 'login',
                result:result.success
              });
          } else {
            console.error(result.message);
              res.render('register', {
                title: 'register',
                message: result.message,
                result: result.success
              });
          }
        });
      };
      
    }catch(e){
      res.redirect("/register-page")
    }


//新增餐廳-------------------------------
  } else if(url === "/store-add"){ 
    
    res.render('index', {
      title: 'enter',
    });


//新增餐點----------------------------------
  } else if(url === "/menu-add"){ 
    const data = req.body;
    db.addmenu(req.userdata.id,data.meal,data.price, data.production,data.category)
        .then((result) => {
          if (result.success) {
            db.showmenu(Store_id) //菜單查詢
              .then((menuResult) => {
              if (menuResult.success) {
                res.render('background', {
                  menuresult:menuResult.success,
                  title: 'background',
                  menuRow: menuResult.menuRow,
                  menumessage: menuResult.message,
                  redirectTo: 'addmenu-div'
                });
              } else {
                console.error(menuResult.message);  
            }});
            
          }
    })
    
    

//更新菜單資訊------------------------

  }else if(url === "/menu-update") {
    const data = req.body;
    const menuItems = data.menuItems;
    const menudata = data.menuData;

    db.deletemenu(menuItems.id)
    db.savemenu(menudata,menuItems.id);

//更新店家資訊------    
  }else if(url === "/updateinfo"){
    const data = req.body;
    db.updateinfo(req.userdata.id,data)


//結帳---------------
  }else if(url === "/checkout") {
    const data = req.body;
    if (!req.userdata || !req.userdata.id) {
      res.status(400).send('無法結帳，請先登入');
      return;
    }
    try {
      const result = await db.checkout(req.userdata.id, data);
  
      if (result.success) {
        res.json({
          success: true,
          message: 'Data successfully inserted into the database',
          orderId: result.orderId,
          orderDetails: '感謝你的購買'  // 這裡應該是實際的訂單細節資訊
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing the request: ' + error.message
      });
    }
  

//檢查是否有新訂單    
  }else if (url === "/check_neworders"){
    db.checkneworder(req.userdata.id)
    .then((Result) => {
      if (Result.success) {
          // 渲染menu视图，传递标题和菜单数据
          res.render('order', {
          order_id:id,
          orderRow: Result.orderRow,
          });
      } else {
          console.error(Result.message);
      }
  });

}else if (url === "/completeOrder"){
  db.updatestatu(req.body.orderId)
  .then((orderResult) => {
    res.json({ success: true, message: '訂單已完成' });
  })
  .catch((error) => {
    console.error('Error completing order:', error);
    res.json({ success: false, message: '訂單完成失敗' });
  });
}



});








//-------------------------------------------
function generateAccessToken(userdata) {
  return jwt.sign(userdata, "ms.Te:HVsZTp|&?Q+uRC(<CH=vB3MeC7", { expiresIn: '20m' }); // 設定適當的密鑰和到期時間，BYfurich
}
// 生成 JWT Refresh Token
function generateRefreshToken(userid) {
  const ID = {id : userid};
  console.log(ID);
  return jwt.sign(ID, "5bcPTK[.3]'@^nC%=-5x=YXk+)$`rWQ{" , { expiresIn: '1d' }); // 設定適當的密鑰和到期時間，BYfurich
}



module.exports = router;

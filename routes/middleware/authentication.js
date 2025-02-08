const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');


const secretkey_r ="5bcPTK[.3]'@^nC%=-5x=YXk+)$`rWQ{";
const secretkey_a ="ms.Te:HVsZTp|&?Q+uRC(<CH=vB3MeC7";

async function checkrefreshToken(req, res, next){//檢測有沒有登入
  if(await refreshToken_authentication(req, res)){//檢測refreshToken的有效性(含是否有refreshtoken)
    req.auth_r = true;//紀錄其已登入
    if(await accesstoken_authentication(req, res)){//檢驗accessToken有效性(含是否有accesstoken)，若有效
      const accessToken = jwt.verify(req.cookies.accessToken,secretkey_a);//解碼accessToken
      req.userdata = {
        id:accessToken.id,
        name:accessToken.name,
        mail:accessToken.mail  
      }
      req.auth_a = true;
      next();
    }else{//若accessToken過期或沒有accessToken，則生成新的accessToken
      if(req.cookies.accessToken){//若有舊的accessToken，則先清除
        res.clearCookie('accessToken');
      }
      const refreshToken = jwt.verify(req.cookies.refreshToken, secretkey_r);
      const accessToken = await generateAccessToken(refreshToken.id);
      res.cookie('accessToken', accessToken);
      req.userdata = {
        id:accessToken.id,
        name:accessToken.name,
        mail:accessToken.mail  
      }
      req.auth_a = true;
      next();
    }
  }else{//
    req.auth_r = false;
    next();
  }
}


async function refreshToken_authentication(req,res) {//負責檢測有沒有token，及token有沒有合規

  if(req.cookies.refreshToken){
    try{
      jwt.verify(req.cookies.refreshToken,secretkey_r);//解碼refreshToken
      return true;
    }catch(err_r){
      if (err_r instanceof jwt.TokenExpiredError) {//若refreshToken過期
        return false;
      }else if(err_r instanceof jwt.JsonWebTokenError){
        res.clearCookie('refreshToken');
        res.status(401).json({ error: 'Token validation failed' });
      }
    }
  }else{
    return false;
  }
}
async function checkaccessToken(req, res, next){
  
    if(await accesstoken_authentication(req, res)){//檢驗accessToken有效性(含是否有accesstoken)
      const accessToken = jwt.verify(req.cookies.accessToken,secretkey_a);//解碼accessToken
      req.userdata = {
        id:accessToken.id,
        name:accessToken.name,
        mail:accessToken.mail  
      }
      req.auth_a = true;
      next();
    }else{//若accesstoken過期，則發送新的accessToken
      if(await refreshToken_authentication(req,res)){//檢測refreshToken的有效性(含是否有refreshtoken)
          const refreshToken = jwt.verify(req.cookies.refreshToken, secretkey_r);
          const accessToken = await generateAccessToken(refreshToken.id);
          console.log('accessToken'+accessToken);
          res.cookie('accessToken', accessToken);
          req.userdata = {
            id:accessToken.id,
            name:accessToken.name,
            mail:accessToken.mail  
          }
          req.auth_a = true;
          next();
      }else{//若refreshToken也過期則要求使用者要先登入
        res.send('<script>alert("請先登入會員"); window.location.href = "/log-in";</script>');
      }
    }

}

async function accesstoken_authentication(req,res) {//負責檢測有沒有token，及token有沒有合規

  if(req.cookies.accessToken){
    try{
      jwt.verify(req.cookies.accessToken,secretkey_a);//解碼accesstoken
      return true;
    }catch(err_a){
      if (err_a instanceof jwt.TokenExpiredError) {//若accesstoken過期
        return false;
      }else if(err_a instanceof jwt.JsonWebTokenError){//若accessTokenh錯誤
        res.clearCookie('accessToken');
        res.status(401).json({ error: 'Token validation failed' });
      }
    }
  }else{
    return false;
  }
}


async function generateAccessToken(userid){
    const connection =await connectToDatabase();
    const userdata = await getUserDataById_fromDB(connection, userid);
    return jwt.sign(userdata, secretkey_a, { expiresIn: '20m' }); // 設定密鑰和到期時間   
}


///database

async function connectToDatabase() { //連接資料庫
    let connection;
    try {
      connection = await mysql.createConnection({ // 移除 const
        user: 'root',
        password: '!QAZ2wsx',
        host: 'localhost',
        database: 'mydatabase'
      });
      console.log('Connected to MySQL');
    } catch (error) {
      console.error('Error connecting to MySQL:', error);
      throw error;
    }
    return connection; // 返回連接對象
  }

async function getUserDataById_fromDB(connection, uesrid) {//從Token資料比對資料庫中是否有這位user
    try {
      const [userRow] = await connection.execute('SELECT * FROM `user` WHERE Id = ?', [uesrid]);//查詢是否有存在
      const user = userRow[0];
      if (userRow.length === 0) {
        console.error('User not found');
      }else{
        //console.log({id:user.Id,name:user.User,mail:user.Email});
        return {id:user.Id,name:user.User,mail:user.Email};//若查詢到有此為user則回傳userid、mail、name
      }
    } catch (error) {
      console.error('Error checking if id exists:', error);
      throw error;
    }
  }


module.exports = {
  checkrefreshToken,
  checkaccessToken
}

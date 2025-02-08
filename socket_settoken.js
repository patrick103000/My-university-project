const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const secretkey_r ="5bcPTK[.3]'@^nC%=-5x=YXk+)$`rWQ{";
const secretkey_a ="ms.Te:HVsZTp|&?Q+uRC(<CH=vB3MeC7";

async function settoken(socket, next){
    const cookie = socket.request.headers.cookie;

    if (cookie) {
        const cookies = cookie.split('; ').reduce((obj, str) => {
            const parts = str.split('=');
            obj[parts[0]] = parts[1];
            return obj;
        }, {});

        if (await checkaccessToken(cookies,socket)) {
            socket.accessToken = cookies.accessToken;
            socket.userdata = cookies.userdata;
        }
    }

    next();
}

async function checkaccessToken(cookies){

    if(cookies.accessToken){
        if(await accessToken_authentication(cookies)){

            return true;
        }else{
            return false;
        }
        
    }else{
        return false;
    }
}

async function accessToken_authentication(cookies){
    try{
        
  
        cookies.userdata = jwt.verify(cookies.accessToken,secretkey_a);//解碼accessToken
        
        return true;
    }catch(err_r){
        
         if (err_r instanceof jwt.TokenExpiredError) {//若accessToken過期
            if(refreshToken_authentication(cookies)){
                jwt.verify(cookies.refreshToken,secretkey_r)
            }
         }
        // }else if(err_r instanceof jwt.JsonWebTokenError){
        //   res.clearCookie('accessToken');
        //   res.status(401).json({ error: 'Token validation failed' });
        // }
        return false;
    }
}


async function refreshToken_authentication(cookies) {//負責檢測有沒有token，及token有沒有合規

    if(cookies.refreshToken){
      try{
        const userid = jwt.verify(cookies.refreshToken,secretkey_r);//解碼refreshToken
        const accessToken = generateAccessToken(userid.id)
        cookies.userdata = jwt.verify(accessToken,secretkey_a);//解碼accessToken

        return true;
      }catch(err_r){
        return false
      }
    }else{
      return false;
    }
}
async function generateAccessToken(userid) {
    const connection = await connectToDatabase();
    const userdata = await getUserDataById_fromDB(connection, userid);
    return jwt.sign(userdata, secretkey_a, { expiresIn: '20m' }); // 直接使用 userdata 作为 payload
}
async function connectToDatabase() { //連接資料庫
    let connection;
    try {
      connection = await mysql.createConnection({ // 移除 const
        user: 'root',
        password: '!QAZ2wsx',
        host: 'localhost',
        database: 'mydatabase'
      });
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
        // console.log({id:user.Id,name:user.User,mail:user.Email});
        return {id:user.Id,name:user.User,mail:user.Email};//若查詢到有此為user則回傳userid、mail、name
      }
    } catch (error) {
      console.error('Error checking if id exists:', error);
      throw error;
    }
  }


module.exports = settoken;

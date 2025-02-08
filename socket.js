// ../golbalvalue/socket
const tables = require('./TablesSeats_value').tables;
const socket_io = require('socket.io');
const seat = require('../class/seatclass');
const settoken = require('./middleware/socket_settoken');
const customer = require('../class/customerclass');

let socket_server = null;
let socket_connectedUsers = {};
let socketvalue = null;

function socket_connect(socket) {
    // 取得連接的使用者資訊

    const userAgent = socket.handshake.headers['user-agent'];
    const userIpAddress = socket.handshake.address; // 取得使用者的 IP 位址
    const connectionTime = new Date(socket.handshake.time); // 取得連接的時間
    const accessToken = socket.accessToken || null;
    
    const mail = (socket.userdata && socket.userdata.mail) || null;

    const userId = socket.id; // 生成一個唯一的用户ID

    const isDuplicateUser = Object.values(socket_connectedUsers).some(user => {
        const timeDifference = Math.abs(user.connectionTime.getTime() - connectionTime.getTime());
        const isWithin2Seconds = timeDifference <= 2000; // 2秒以内的连接时间差
        const isSameIpAddress = user.userIpAddress === userIpAddress;
        const isSameaccessToekn = user.accessToken === accessToken;
        return isWithin2Seconds && isSameIpAddress || isSameaccessToekn;
    });
    


    if (!isDuplicateUser) {
        // 未发现相同用户信息，才添加到 socket_connectedUsers
        socket_connectedUsers[userId] = {
            userId,
            userAgent,
            userIpAddress,
            connectionTime,
            accessToken,
            mail
        };
    }
    getconnectedUsers();

    const userdata = checkaAthUserInQueue(socket.userdata);
    if (userdata) {
        resqueuenum(socket, userdata);
        // socket.emit('updatequeue', (userdata) => updatequeuenum(userdata, socket));
    }

    socket.on('getSeatsstate', (seatData) => getSeatsstate(seatData, mail, socket));
    socket.on('disconnect', function () {
        // console.log('user disconnected');
        delete socket_connectedUsers[userId]; // 用户断开连接时从用户列表中移除
        // getconnectedUsers(); // 更新用户列表
    });
}

function checkaAthUserInQueue(userdata){
    // const userdata = getUsetdata_fromAccessToekn(accessToken);
    if(userdata){
        const queue = require('./queue');
        const customer = queue.getCustomerByMail(userdata.mail)
        if(customer != null){
            return userdata;
        }
    }
    return false;
}

function resqueuenum(socket,userdata){
    const queue = require('./queue');

    const queuenum = queue.getCustomersAheadOf(userdata.mail)
    console.log('in resqueuenum')
    console.log(queuenum);
    socket.emit('showqueue',{queuenum:queuenum});
}
function updatequeuenum(userdata,socket){
    resqueuenum(socket,userdata);
}


async function getSeatsstate(seatData,mail,socket){
    console.log('seatData' + seatData)
    // console.log(seatData)
    const queue = require('./queue');
    const customerseats = queue.getcustomerseat(mail);
    if(customerseats){
        console.log('customerseats')
        console.log(customerseats)
        console.log('seatData')
        console.log(seatData)
    }
    const res_seatData ={};
    for (const tableunm in seatData) {
        const seats = seatData[tableunm];
        for (const seatnum of seats) {
            const seat = await tables.getSeatObject(tableunm, seatnum);
            const seatdata ={
                seatnum : seat.seatnum,
                seatfull: seat.seatfull
            }
            if (!res_seatData[tableunm]) {
                res_seatData[tableunm] = [];
            }
            res_seatData[tableunm].push(seatdata);
        }
    }
    // console.log('res_seatData')
    // console.log(res_seatData)
    socket.emit('seatDataResponse',res_seatData);
}
function getconnectedUsers() {
    console.log('當前已連接用戶數:'+Object.keys(socket_connectedUsers).length);
    Object.keys(socket_connectedUsers).forEach((userId) => {
        const user = socket_connectedUsers[userId];
        console.log(`用戶 id: ${userId}, Mail: ${user.mail}`);
    });
    return socket_connectedUsers;
}

function getUserSocketByaccessToken(accessToken) {
    for (const userId in socket_connectedUsers) {
      const user = socket_connectedUsers[userId];
      if (user.accessToken === accessToken) {
        return user;
      }
    }
    return null;
}
async function getSocketIdByMail(mail) {
    for (const userId in socket_connectedUsers) {
        const user = socket_connectedUsers[userId];

        if (user.mail === mail) {
            return userId;
        }
    }
    return null; // 如果未找到匹配的邮箱，返回 null
}

exports.get_user = function (){
    return socketvalue;
}


exports.initialize = async function (server) {
    if (socket_server === null) {

        socket_server = await socket_io(server);
        if(socket_server){
            console.log('socket is already created' + socket_server)
        }else{
            console.log('socket does not prepare')
        }
        socket_server.use(settoken);
        //帶增加初始化邏輯
        socket_server.on('connection', (socket)=>socket_connect(socket));


    }
    return socket_server;
}

exports.socket_server = function () {
    if(socket_server){
        console.log('socket_server was prepare IN socket_server')
        // console.log(socket_server)
        return socket_server;
    }else{
        throw console.error("can't found socket server");
    }

}

exports.sendsocketmessage_foundemptyseats = async function(customer, seatData,startTime) {

    // 创建要发送到客户端的消息对象
    // console.log('waiting for socket connect')
    const socketId = await waitForSocketId(customer,startTime);
    const socket = await socket_server.sockets.sockets.get(socketId)
    // console.log('socketId' + socketId)

    // console.log('socket' + socket)

    if (socket != null) {
        // console.log('already found customer socket')
        const message = {
            text: '已為您找到足夠的座位',
            iframeUrl: '/bookseat/seatstate', // 替换为您的 iframe URL
            confirmRoute: '/bookseat/confirmSeat', // 确认座位的路由
            cancelRoute: '/bookseat/keepwait', // 取消座位的路由
            //  
        };
        async function waitForCustomerResponse() {
            socket.emit('foundemptyseats', message);
            // console.log("socket.emit('seatStateChanged', seatData)")
            // console.log(seatData)
            /////////
            //將下方emit改成可以改變index中的seatstate socket 
            //初想為將seatfull設為null，及前端設判定 若為null則變為黃色
            socket.emit('seatStateChanged', seatData)//
            /////////
            return new Promise((resolve) => {
                const timer = setTimeout(() => {
                    console.log('Timer expired');
                    resolve('send again');
                }, 2000);
                    // 客戶端收到訊息的回應處理函式
                const onResponse = (data) => {
                    console.log(data);
                    let foundseat = data.foundseat;
                    if (foundseat === true) {
                        // 顧客找到合適的位子，解析為 true
                        console.log('resolve == true');
                        clearTimeout(timer)
                        resolve(true);
                    } else if (foundseat === false) {
                        // 顧客選擇繼續等待，解析為 false
                        console.log('resolve == false ');
                        clearTimeout(timer)
                        resolve(false);
                    } else if (foundseat === 'send again' || !socket.connected){
                        socket.off('customerResForQueue', onResponse); // 移除舊的事件監聽器
                        resolve('send again')
                    }
                };
        
                    // 將 onResponse 作為事件監聽器加入 socket.on
                socket.removeAllListeners('customerResForQueue');
                socket.on('customerResForQueue', onResponse);
            });
        }
        
        const customerResponse = await waitForCustomerResponse();

        console.log('customerResponse : ' + customerResponse);

        if(customerResponse === true) {//true>>已為顧客找到合適的位子
            //設定座位擁有者
            return true;
        }else if(customerResponse === false){//false>>顧客選擇繼續等待
            //釋放為當前顧客預留的座位
            //紀錄當前能接受的位置分散程度，下次不得低於本次程度
            return false;
        }else if(customerResponse === 'send again'){
            return this.sendsocketmessage_foundemptyseats(customer, seatData,startTime);
        }

        
    } else {//如果10分鐘內找不到人，則回應null
        
        return null;
    }

  };


async function waitForSocketId(customer,startTime) {
    const MAX_WAIT_TIME = 10 * 60 * 1000; // 10分钟的毫秒数

    while (Date.now() - startTime < MAX_WAIT_TIME) {
        // 开始尝试获取socketId
        console.log('Waiting socketId in while')
        const socketId = await getSocketIdByMail(customer.mail);

        // 如果成功获取到socketId，返回它
        if (socketId) {
            return socketId;
        }

        // 等待1秒后再次尝试
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // 10分钟内仍然无法获取socketId，返回null或者其他标志值
    return null;
}


async function updatecustomerqueuenum() {
    console.log(' in updatecustomerqueuenum ')
    console.log(getConnectedUsersWithEmailNotNull())
    const queue = require('./queue')
    for(const socket_user of getConnectedUsersWithEmailNotNull()){
        if(queue.getCustomerByMail(socket_user.mail)){
            const queuenum = queue.getCustomersAheadOf(socket_user.mail)
            if(queuenum != -1){
                const socket = await socket_server.sockets.sockets.get(socket_user.userId)
                socket.emit('showqueue',{
                    queuenum:queuenum
                })
            }else{
                const customerseat = queue.getcustomerseat(socket_user.mail)
                if(customerseat){
                    console.log(`${socket_user.mail} 已經擁有位子了`)
                    console.log(customerseat)
                }
            }
        }
    }
    function getConnectedUsersWithEmailNotNull() {
        const usersWithEmailNotNull = Object.keys(socket_connectedUsers)
            .filter(userId => socket_connectedUsers[userId].mail !== null)
            .map(userId => socket_connectedUsers[userId]);
        
        return usersWithEmailNotNull;
    }
}

async function checkcustomerseats(){

}

exports.getUserSocketByRefreshToken = getUserSocketByaccessToken;

exports.getSocketIdByMail = getSocketIdByMail;

exports.updatecustomerqueuenum = updatecustomerqueuenum; 

class Queue {

    constructor() {
          this.queue = [];
          this.customerMap = {};
          this.SeatsOwnerQueueMap ={};// for waiting customer to make suer that the seats is they want
    }
  
    async StartChecking(){
        // let highPriorityQueue = []
        // let highPriorityQueueMap ={};

        //use mail to be key for SeatsOwnerQueueMap
        
        
        while(true) {

            // let Queuekey = Object.keys(this.queue)
    
            if(this.getQueueLength() != 0){
                console.log("checking")
                const emptySeats = await this.hasEnoughEmptySeats(this.queue[0])
                // console.log("emptySeats")
                // console.log(emptySeats)
                if(emptySeats.hasEnoughEmptySeats){
                    const customer = this.queue.shift();
                    this.SeatsOwnerQueueMap[customer.mail] = this.customerMap[customer.mail]

                    this.handleCustomerWasSeatOwner(customer,emptySeats);

                }
                
            }
            
    
            await new Promise(resolve => setTimeout(resolve, 10000)); // 调整等待时间
        }
    }

    async handleCustomerWasSeatOwner(customer,seatsdata){

        const emptyseatsdata = seatsdata.seats;
        const socketdata = []
        const tables = require('../golbalvalue/TablesSeats_value').tables
        for(const seatdata of emptyseatsdata){
            const seat = await tables.getSeatObject(seatdata.tablenum,seatdata.seatnum)
            const seatowner_result = await seat.setowner(customer)
            socketdata.push(
                {
                    tablenum:seatdata.tablenum,
                    seatnum:seatdata.seatnum,
                    seatfull:seatowner_result
                }
            )
        }
        const socket_server = require('../golbalvalue/socket').socket_server()
        socket_server.emit('seatStateChanged',socketdata)
        const { updatecustomerqueuenum } = require('../golbalvalue/socket')
        updatecustomerqueuenum()
        // console.log('this.SeatsOwnerQueueMap[customer.mail].seats  in   handleCustomerWasSeatOwner')
        // console.log(this.SeatsOwnerQueueMap[customer.mail])
        const socket = require('../golbalvalue/socket');
        console.log("seatsdata in handle")
        console.log(seatsdata)
        this.SeatsOwnerQueueMap[customer.mail].seats = socketdata;

        const result = await socket.sendsocketmessage_foundemptyseats(customer,socketdata,Date.now())
        
        if(result != null){
            if(result){
                
            }else{//若顧客選擇繼續等候座位
                //釋放為當前顧客預留的座位
                //將顧客加至優先尋找佇列
                //紀錄當前能接受的位置分散程度，下次不得低於本次程度
                // this.SeatsOwnerQueueMap[customer.mail].seats
                console.log("successful to get customer socket : result = " + result) 

            }
        }else{
            //釋放為當前顧客預留的座位
            // 將顧客加回去queue前端
            //紀錄顧客的time passed coount，超過兩次則取消顧客列隊
            console.log(" the fail to get customer socket : result = " + result) 

        }
        
    }
    


    addCustomer(customer_count, userdata) {
        const customerclass = require('./customerclass');
        let customer = new customerclass(customer_count, userdata);

        this.customerMap[userdata.mail] = customer;
        // console.log('addCustomer susscefull'+userdata.mail);
        this.queue.push(customer);
    }
  

    leave() {
        const customer = this.queue.shift(); // 從對列頭部獲取 customer
        if (customer) {
            //如果成功取出，同時移除customerMap內的索引
            delete this.customerMap[customer.userdata.mail];
        }
        return customer;
    }
    


    async hasEnoughEmptySeats(userdata){
        if(this.customerstate_inqueue(userdata)){
        const customer = this.getCustomerByMail(userdata.mail);

            const tables = await require('../golbalvalue/TablesSeats_value').tables;
            
            const result = await tables.checkEmptySeats_ByCustomer(customer)

            if(result===false){//還沒有足夠的位置
                return {hasEnoughEmptySeats:false}
            }
            if(!result.needAskCanApart){//如果不需要詢問是否允許分坐
                //await new Promise(resolve => setTimeout(resolve, 600000)); // 调整等待时间
                
                return {
                    hasEnoughEmptySeats:true,
                    seats : result.seats
                }

            }else{//如果需要詢問是否允許分坐
                if(customer.asked_apart){//如果問過
                    if(canapart){//如果可以分坐
                        // return talbenum 及 需要更改狀態為等待顧客入座的座位
                        return {
                            hasEnoughEmptySeats:true,
                            seats : result.seats
                        }
        
                    }else{//如果不可以分坐
                        //則結束function，並且繼續等待足夠的座位
                    }
                }else{

                }
            }
            
        }


        

    }

    getSeatOfAuth(userdata){//提早入座功能
        return false;
    }
    customerstate_inqueue(userdata){
        if(this.getCustomerByMail(userdata.mail)){
            return true;
        }else{
            return false;
        }
    }
    getQueueLength() {
        return this.queue.length;
    }
  
    


    getCustomerByMail(mail) {

        return this.customerMap[mail] || null;
    }

    getCustomersAheadOf(mail) {
        const customer = this.customerMap[mail];
        if (!customer) {
            return -1; // 如果未找到匹配的 customer，返回 -1 表示未找到
        }

        // 查詢 customer 在queue中的位置
        const index = this.queue.indexOf(customer);
        if (index === -1) {
            return -1; // 如果未找到匹配的 customer，返回 -1 表示未找到
        }

        return index;
    }

    getcustomerseat(mail){
        const customer = this.SeatsOwnerQueueMap[mail];
        if(customer){
            return customer.seats
        }else{
            return null;
        }

    }

  }
  
module.exports = Queue;  
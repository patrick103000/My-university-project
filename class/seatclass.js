const customer = require("./customerclass");

class seat{
    constructor(tablenum, seatnum){
        this.tablenum = tablenum;
        this.seatnum = seatnum;
        this.nearby = {};
        this.owner = null;
        this.hasowner = false;
        this.seatfull = false;
        this.timer_Id = null;
        this.seatstate_records = [];//{用於紀錄當前的時間, 座位狀態, 該狀態所經過的時間}
        this.timer_state_1 = false;//第一階段，true>>倒數計時中; false>>沒在倒數中
        this.timer_state_2 = false;//第二階段
        this.timer_state_3 = false;//第三階段
        this.previous_seatstate = null;//該值只有在recording_seatstate內用於紀錄狀態時使用
    }

    getseatstate() {
        return this.hasowner;
    }
    addNearbySeat(seat) {
        this.nearby[seat.seatnum] = seat;
    }

    getseatnearby(){
        //return this.nearby;
        console.log(this.nearby);
    }
    findNextEmptySeat(seatgroup){
        for (let key = 1; key <= seatgroup.seatsgroupscount; key++) {
            if (seatgroup.seatgroup[key]) {
                const seats = seatgroup.seatgroup[key];
                for (const seat of seats) {
                    if (seat.length > 0) {
                        const firstSeat = seat[0];
                        if (!firstSeat.hasowner) {
                            return firstSeat;
                        }
                    }
                }
            }
        }
        return null;
    };
    
    FindEmptySeats(count) {
    
        const foundSeats = {};
        const visited = {}; // 用于记录已访问过的座位
        const queue = []; // 用于BFS的队列
    
        visited[this.seatnum] = true;
        queue.push({ seat: this });
    
        while (queue.length > 0 && count > 0) {
            const { seat } = queue.shift();
    
            if (!seat.hasowner) {
                foundSeats[seat.seatnum] = seat;
                count--;
            }
        
            for (const nearbySeatNum in seat.nearby) {
                if (!visited[nearbySeatNum]) {
                visited[nearbySeatNum] = true;
                queue.push({ seat: seat.nearby[nearbySeatNum] });
                }
            }
        }
    
        return { foundSeats, remainingCount: count };
    }

    async findnearbySeatWithPriority(count) {
        let foundSeats = {};
        let visited = {};
        let queue = new PriorityQueue((a, b) => a.distance < b.distance); // 使用优先队列
      
        visited[this.seatnum] = true;
        queue.add({ seat: this, distance: 0 });
      
        while (!queue.isEmpty() && count > 0) {
          const { seat, distance } = queue.poll();
      
          if (!seat.seatfull) {
            foundSeats[seat.seatnum] = seat;
            count--;
          }
      
          for (const nearbySeatNum in seat.nearby) {
            if (!visited[nearbySeatNum]) {
              visited[nearbySeatNum] = true;
              queue.add({ seat: seat.nearby[nearbySeatNum], distance: distance + 1 });
            }
          }
        }
      
        const remainingCount = count;
      
        return { foundSeats, remainingCount };
      }
    async findnearbySeat2(count) {
        let foundSeats = {}; // 用于存储找到的座位
        let visited = {}; // 用于标记已访问的座位
        let queue = [this]; // 使用队列来进行广度优先搜索，将起始座位加入队列
        visited[this.seatnum] = true; // 标记起始座位为已访问
      
        while (queue.length > 0) {
          let currentSeat = queue.shift(); // 从队列中取出当前座位
          foundSeats[currentSeat.seatnum] = currentSeat; // 将当前座位加入找到的座位列表
      
          // 检查是否已经找到足够的座位
        //   if (Object.keys(foundSeats).length >= count) {
        //     break;
        //   }
      
          // 遍历当前座位的附近座位
          for (const seatnum in currentSeat.nearby) {
            const nearbySeat = currentSeat.nearby[seatnum];
      
            // 检查是否符合条件且未被访问过
            if (!nearbySeat.seatfull && !visited[seatnum]) {
              queue.push(nearbySeat); // 将附近座位加入队列
              visited[seatnum] = true; // 标记附近座位为已访问
            }
          }
        }
        const remainingCount = count - Object.keys(foundSeats).length;

        // 检查是否找到足够的座位
        if (Object.keys(foundSeats).length >= count) {
            return { foundSeats, remainingCount: 0 };
        } else {
            return { foundSeats, remainingCount };
    }

    
        
    }
    async findnearbySeat(count) {
        let foundSeats = {}; // 用于存储找到的座位
        let visited = {
            [this.seatnum]: {
                seat: this,
                distance_array: {
                    [this.seatnum]: 0,
                },
            }    
        }; // 用于标记已访问的座位
        const seatArray = {
            [this.seatnum]: {
                seat: this,
                distance_array: {
                    [this.seatnum]: 0,
                },
            },
        };
        visited[this.seatnum] = true; // 标记起始座位为已访问
    
        while (count > 0 && Object.keys(foundSeats).length < count) {
            const currentSeatNum = Object.keys(seatArray)[0];
            const { seat, distance_array } = seatArray[currentSeatNum];
            delete seatArray[currentSeatNum];
    
            if (!seat.seatfull) {
                foundSeats[seat.seatnum] = seat;
            }
    
            for (const nearbySeatNum in seat.nearby) {
                if (!visited[nearbySeatNum]) {
                    visited[nearbySeatNum] = true;
                    const nearbySeat = seat.nearby[nearbySeatNum];
                    console.log('currentSeatNum : '+currentSeatNum);
                    console.log('nearbySeatNum'+ nearbySeatNum);
                    console.log('nearbySeat'+nearbySeat.seatnum);
                    const newDistance = distance_array[currentSeatNum] + 1;
                    seatArray[nearbySeatNum] = {
                        seat: nearbySeat,
                        distance_array: { ...distance_array, [nearbySeatNum]: newDistance },
                    };
                }
                console.log('currentSeatNum : '+currentSeatNum);
                console.log(seatArray);
            }
        }
    
        const remainingCount = count - Object.keys(foundSeats).length;
    
        return { foundSeats, remainingCount };
    }
    
    

    // seatArray{
    //     seatnum:{seat:seat_obj,distance_table:{seatnum:distance,seatnum:distance,seatnum:distance}
        
    // }
    
    FindFarthestSeat() {
        const visited = {}; // 用于记录已访问过的座位
        const queue = []; // 用于BFS的队列
    
        visited[this.seatnum] = true;
        queue.push({ seat: this, distance: 0 }); // 添加距离信息
    
        let farthestSeat = { seat: this, distance: 0 };
    
        while (queue.length > 0) {
            const { seat, distance } = queue.shift();
    
            if (distance > farthestSeat.distance) {
                farthestSeat = { seat, distance };
            }
    
            for (const nearbySeatNum in seat.nearby) {
                if (!visited[nearbySeatNum]) {
                    visited[nearbySeatNum] = true;
                    if(!seat.nearby[nearbySeatNum].seatfull){
                        queue.push({ seat: seat.nearby[nearbySeatNum], distance: distance + 1 });
                    }
                }
            }
        }
    
        return farthestSeat.seat;
    }
    
            

    CountAdjacencyIndex(targetSeatNum) {
        if (this.seatnum === targetSeatNum) {
          return 0; // 座位号就是目标座位号，步数为0
        }
    
        const visited = {}; // 用于记录已访问过的座位
        const queue = []; // 用于BFS的队列
    
        visited[this.seatnum] = true;
        queue.push({ seat: this, steps: 0 });
    
        while (queue.length > 0) {
          const { seat, steps } = queue.shift();
          
          for (const nearbySeatNum in seat.nearby) {
            if (!visited[nearbySeatNum]) {
              if (nearbySeatNum === targetSeatNum) {
                return steps + 1; // 找到目标座位，返回步数
              }
              
              visited[nearbySeatNum] = true;
              queue.push({ seat: seat.nearby[nearbySeatNum], steps: steps + 1 });
            }
          }
        }
    
        return null; // 未找到目标座位
    }


    ////////////////////////////////////////////////////////////////////////
    setowner(userid){
        this.owner = userid;
    }
    clearowner(){
        this.owner = null;
    }
    /*
    1.創建一個1 min 計時器function，監聽該段時間的true及false狀態的個別時間，
    2.
    */
    changeSeatState_BeEmpty(seatstate){
        this.changeSeatState_stage1(seatstate)
    }
    changeSeatState_stage1(seatstate){
        if(seatstate != this.seatfull && this.timer_state_1 === false){
            this.timer_state_1 = true;
            this.timer_Id = setTimeout(() => this.changeSeatState_stage2(seatstate),60000);//若1分鐘內，皆沒有離開位置，則開始第二階段計時
        }else if(seatstate === this.seatfull && this.timer_state_1 === true && this.timer_state_2 === true){//若已開始第二階段，則不需再重新等待一分鐘，可直接呼叫recording_seatstate
            recording_seatstate(seatstate);
        }else if(seatstate === this.seatfull && this.timer_state_1 === true && this.timer_state_2 === false){
            this.timer_state_1 = false;
            if (this.timer_Id !== null) {
                clearTimeout(this.timer_Id); // 中止計時
            }
            return false;
        }
    }
    changeSeatState_stage2(seatstate,changeSeatState_stage3){//第二階段計時，timer_state_1仍為true
        console.log("stage 2 start");
        if (this.timer_Id !== null && this.timer_state_2 === false) {
            clearTimeout(this.timer_Id); //清除階段一的timer
            this.timer_state_2 = true;//開始階段二timer_state_1、timer_state_2皆為true
            this.timer_Id = setTimeout(() => {
                if (this.timer_Id !== null) {//若階段2的時間內timer都沒有被終止
                    clearTimeout(this.timer_Id); // 中止計時
                    changeSeatState_stage3();
                }
            },240000);//第二個timer，紀錄之後4分鐘內的seatstate
            this.recording_seatstate(seatstate);//傳送經過stage1一分鐘後seatstate的資料
        }else{
            console.log("seat : "+this.tablenum+"-"+this.seatnum +" changeSeatState_stage2 error");
        }
    }

    recording_seatstate(seatstate){
        const timestamp = new Date().getTime();//紀錄當前時間
        console.log("recording on: " + timestamp + " " + seatstate);

        if (this.previous_seatstate === null && this.timer_Id !== null) {
            // 如果之前的previous_seatstate為空，則為第一次紀錄，直接紀錄當前的狀態
            elapsed_time = timestamp - 60000; 
            this.seatstate_records.push({ timestamp, seatstate, elapsed_time});
        } else if (seatstate !== this.previous_seatstate && this.timer_Id !== null) {
            // 如果當前狀態與之前狀態不同，則紀錄當前的狀態並計算與之前狀態的時間差
            const elapsed_time = timestamp - this.seatstate_records[this.seatstate_records.length - 1].timestamp;
            this.seatstate_records.push({ timestamp, seatstate, elapsed_time });
        }

        this.previous_seatstate = seatstate;


        //過濾出最近10分鐘內的紀錄 
        const tenMinutesAgo = timestamp - 600000;
        this.seatstate_records = this.seatstate_records.filter(record => record.timestamp >= tenMinutesAgo);
    }
    changeSeatState_stage3(){

    }

    changeSeatState_quikly(seatstate) {

        if(seatstate === true){
            this.seatfull = seatstate;
            this.hasowner = seatstate;
            return true;

        }else{
            this.seatfull = seatstate;
            this.hasowner = seatstate;
            return false;
        }
    }

    setowner(customer){
        this.seatfull = true;
        this.hasowner = true;
        this.owner = customer;

        return true
    }
    clearOwner(){
        this.seatfull = false;
        this.hasowner = false;
        this.owner = null;

        return true
    }

}

module.exports = seat ; 
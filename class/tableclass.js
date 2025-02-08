class tableclass {//包含table class 以及 create椅子的funtino(以綁定桌號)
  constructor(tablecount,column) {
    if (!tableclass.instance) {
      this.tables = {}; // 使用对象存储字母对应的对象
      this.tablesmap = {}; // 

      const row = tablecount / column;
      for (let i = 0; i < tablecount; i++) {
        const tablenum = this.getTableLabel(i);
        this.tables[tablenum] = {}; // 使用对象存储每个字母对应的对象
      }
      const tableKeys = Object.keys(this.tables);

      let keynum = 0;

      for(let j = 1;  j <= row; j++) {

        for(let k = 1 ; k <=column; k++){
          this.tablesmap[tableKeys[keynum]] = {column:k, row:j}
          keynum = keynum + 1
        }
      }
      tableclass.instance = this;
    }
    this.maxCapacityTable = null;

    return tableclass.instance;

  }

  getTableCount() {
    return Object.keys(this.tables).length;
  }
  async FindEmptySeats(count) {
    //以customer人數去尋找最符合他們實際所需人數的座位
    //返回2值，1為tablenum(tablekey);2為尚需尋為customer尋找的座位數
    //{ B: 0, C: 0, D: 2, E: 2, A: 3, F: 4, G: 4 }
    let needfoundseatcount = count; //记录尚需寻找的座位数量
    const tablestatus = await this.getAllSeatsStatus();
    let seatsStatus_rank = {};
    for (const tableKey in tablestatus) {
      const seatsStatus = tablestatus[tableKey];
      needfoundseatcount = needfoundseatcount - seatsStatus.emptyseatcount; 
      const current_needfoundseatcount = seatsStatus.emptyseatcount - count;
      seatsStatus_rank[tableKey] = Math.abs(current_needfoundseatcount);
    }
    if(needfoundseatcount > 0 ){
      return null
    }
    // 将对象转换为数组并排序
    const sortedRankArray = Object.entries(seatsStatus_rank)
      .sort((a, b) => a[1] - b[1]);
  
    // 从排名数组中获取排序后的对象
    const sortedSeatsStatusRank = Object.fromEntries(sortedRankArray);
  
    // console.log(sortedSeatsStatusRank);
    return sortedSeatsStatusRank;
  }
  


  async checkEmptySeats_ByCustomer(customer) {
    let needfoundcount = customer.customer_count;
    let SeatsStatusRank = await this.FindEmptySeats(needfoundcount);
    if(SeatsStatusRank === null){
      return false;
    }
    let seatgrouprank = [];
    
    for (const tablekey in SeatsStatusRank) {
      const checkresult = await this.checkEmptySeatsGroup(tablekey);

      for(const key in checkresult){
        let remainingCount=0;
        if(needfoundcount-Object.keys(checkresult[key]).length > 0 ){
          remainingCount = needfoundcount-Object.keys(checkresult[key]).length
        }
        // remainingCount = needfoundcount-Object.keys(checkresult[key]).length

        let seatgroup={
          tablekey:tablekey, 
          seats:checkresult[key],
          remainingCount:remainingCount
        }
        
        // 找到適當的位置插入元素（由小到大）
        let inserted = false;
        for (let i = 0; i < seatgrouprank.length; i++) {
          if (seatgroup.remainingCount < seatgrouprank[i].remainingCount) {
            seatgrouprank.splice(i, 0, seatgroup);
            inserted = true;
            break;
          }
        }
  
        if (!inserted) {
          seatgrouprank.push(seatgroup);
        }
      }
    }
    // console.log("seatgrouprank");
    // console.log(seatgrouprank);
    let seats = []
    let needAskCanApart = false;
    if(seatgrouprank[0].remainingCount > 0) {
      for(const seatgroup in seatgrouprank) {
        const tablenum = seatgroup.tableKey
        this.tablesmap[tablenum]
      }
    }

    for(const seatgroup of seatgrouprank){
      const seatskey = Object.keys(seatgroup.seats);

      ////////////////////////////////
      const seatskeyMap = seatskey.reduce((map, key, index) => {
        map[key] = index;
        return map;
      }, {});
      
      // 根據 seatgroup.seats 中的值排序 seatskey
      seatskey.sort((a, b) => seatgroup.seats[b] - seatgroup.seats[a] || seatskeyMap[a] - seatskeyMap[b]);
      /////////////////////////////
      // if(needfoundcount <= 0){
      //   break
      // }
      
      // console.log('seatgroup')
      // console.log(seatgroup)
      for(const key in seatskey){
        if(needfoundcount <= 0){
          break
        }
        // console.log('seatskey[key]');

        // console.log(seatskey[key]);
        seats.push({
            tablenum : seatgroup.tablekey,
            seatnum : seatskey[key]
          }
        )
        needfoundcount = needfoundcount - 1;
      }
      needAskCanApart = true
    }
    if(!needAskCanApart){
      return {
        seats : seats,
        needAskCanApart : false
      }
    }else{
      return {
        seats : seats,
        needAskCanApart : false
      }
    }
  }
  

  async checkEmptySeatsGroup(tablekey, count) {
    let emptyseats = await this.getemptyseat_array(tablekey);
    let seatgroup = {};
    let currentgroupcount = 1;

    while (emptyseats.length > 0) {
        // console.log('emptyseats')
        // console.log(emptyseats);
        const currentseat =[];
        currentseat.push(emptyseats[0]);         
        const array ={
          [currentseat[0].seatnum]:0
        }
        const result = await this.checkEmptySeatGroup(array, currentseat);

        seatgroup[currentgroupcount] = {};
        let visitedSeatKeys = Object.keys(result.visitedSeats);
        visitedSeatKeys = visitedSeatKeys.map(key => parseInt(key, 10));

        emptyseats = emptyseats.filter(seat => !visitedSeatKeys.includes(seat.seatnum));
        
        seatgroup[currentgroupcount] = result.visitedSeats
  
        // for(const key in visitedSeatKeys){
        //   const seatnum = emptyseats[key].seatnum;
        //   if(result.visitedSeats[seatnum]){
        //     seatgroup[currentgroupcount][seatnum] = emptyseats[key];
        //     delete emptyseats[key];
        //   }
        // }
        
        currentgroupcount++;
    }
    // console.log(seatgroup)
    return seatgroup;
  }


  
  async checkEmptySeatGroup(visitedSeats, needcheckseats) {//needcheckseats == 數組
    // 此处用于记录已访问的座位和尚需访问的座位
    // console.log('visitedSeats')
    // console.log(visitedSeats)
    // console.log('needcheckseats')
    // console.log(needcheckseats)
    while(needcheckseats.length != 0) {
      // console.log(visitedSeats)
      const currentseat = needcheckseats.shift();
      // console.log('currentseat')
      // console.log(currentseat.seatnum)
      if(currentseat.hasowner != true){
        const nearbyseats = currentseat.nearby;
        let findnewseat = false;
        for(const seatnum in nearbyseats){
          // console.log('nearbyseats seatnum')
          // console.log(seatnum)
          if(visitedSeats[seatnum] != undefined&&nearbyseats[seatnum].hasowner != true){
            // console.log('visitedSeats['+seatnum+'] +=1 == '+ visitedSeats[seatnum])
            visitedSeats[seatnum] =  visitedSeats[seatnum] + 1;
          }else if(nearbyseats[seatnum].hasowner != true){
            findnewseat = true;
            visitedSeats[seatnum] = 1
            needcheckseats.unshift(nearbyseats[seatnum]);
          }
        }

        if(findnewseat){
          // console.log('visitedSeats')
          // console.log(visitedSeats)
          // console.log('needcheckseats')
          // console.log(needcheckseats)
          const result = await this.checkEmptySeatGroup(visitedSeats,needcheckseats);
          // console.log('result.visitedSeats');
          // console.log(result.visitedSeats);
          // console.log('visitedSeats befroe');
          // console.log(visitedSeats);
          visitedSeats = { ...visitedSeats, ...result.visitedSeats };
          // console.log('visitedSeats after');
          // console.log(visitedSeats); 
          needcheckseats = result.needcheckseats;

        }
      }
    }

    return  {visitedSeats:visitedSeats,needcheckseats:needcheckseats};
    
  }
  


  async getfristemptyseat(tablekey){
    for (const seat of this.tables[tablekey]) {
      if(!seat.hasowner){
        return seat;
      }else{
        return null;
      }
    }
  }

  async getfristemptyseat_Array(tablekey) {
    const emptySeats = [];
  
    for (const seat of this.tables[tablekey]) {
      if (!seat.hasowner) {
        emptySeats.push(seat);
        return emptySeats;

      }
    }
  }
  
  async getemptyseat(tablekey) {
    let emptyseat = {};
    for (const seat of this.tables[tablekey]) {
      if (!seat.hasowner) {
        emptyseat[seat.seatnum] =  seat;
      }
    }
    return emptyseat;
  }


  async getemptyseat_array(tablekey) {
    let emptyseats = [];
    for (const seat of this.tables[tablekey]) {
      if (!seat.hasowner) {
        emptyseats.push(seat);

        
      }
    }
    return emptyseats;
  }
  
  async getAllSeatsStatus() {
    const seatsStatus = {};

    for (const tableKey in this.tables) {
      const table = this.tables[tableKey];
      const emptySeats = {};
      let emptySeatCount = 0;
      for (const seat of table) {
        if (!seat.getseatstate()) {
          emptySeats[seat.seatnum] = seat;
          emptySeatCount++;
        }
      }

      seatsStatus[tableKey] = {
        emptyseatcount: emptySeatCount,
        emptyseats: emptySeats,
      };
    }

    return seatsStatus;
  }


  
  getTableSeatState() {
    const tableSeatCounts = {};

    for (const tableKey of Object.keys(this.tables)) {
      const table = this.tables[tableKey];
      let emptySeats = 0;
      let fullSeats = 0;

      for (const seatObject of table) {
        if (seatObject.getseatstate() === true) {
          fullSeats++;
        } else {
          emptySeats++;
        }
      }

      tableSeatCounts[tableKey] = { emptySeats, fullSeats };
    }

    return tableSeatCounts;
  }

  // 获取指定 table 实例的对象
  getTableObject(tablenum) {
    if (this.tables.hasOwnProperty(tablenum)) {
      return this.tables[tablenum];
    } else {
      return "tableclass not found";
    }
  }

  // 为指定 table 实例设置对象
  setSeatsforTable(tablenum, seat) {
    if (this.tables.hasOwnProperty(tablenum)) {
      this.tables[tablenum] = seat;
      return `Object set for ${tablenum}: ${JSON.stringify(seat)}`;
    } else {
      return `tableclass : ${tablenum} not found`;
    }
  }

  // 在指定 table 实例上执行操作
  setSeatforTable(tablenum, action) {
    if (this.tables.hasOwnProperty(tablenum)) {
      return `${action} on ${tablenum}`;
    } else {
      return `tableclass : ${tablenum} not found`;
    }
  }

  getTableLabel(index) {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode(65 + (index % 26)) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  }

  setseatsnearby(tableKey){
      const half =  this.tables[tableKey].length /2;

      
      for (const seatObject of this.tables[tableKey]) {
        if (seatObject.seatnum <= half) {
            const oppositeSeatNum = seatObject.seatnum + half;
            if (oppositeSeatNum <= this.tables[tableKey].length) {
              seatObject.addNearbySeat(this.getSeatObject(tableKey, oppositeSeatNum));            
            }
            // 獲取左側相鄰座位
            if (seatObject.seatnum - 1 >= 1) {
                seatObject.addNearbySeat(this.getSeatObject(tableKey, seatObject.seatnum - 1));
            }

            // 獲取右側相鄰座位
            if (seatObject.seatnum + 1 <= half) {
                seatObject.addNearbySeat(this.getSeatObject(tableKey, seatObject.seatnum + 1));            }

        } else {
            const oppositeSeatNum = seatObject.seatnum - half;
            if (oppositeSeatNum <= this.tables[tableKey].length) {
              seatObject.addNearbySeat(this.getSeatObject(tableKey, oppositeSeatNum));            
            }
            // 獲取左側相鄰座位
            if (seatObject.seatnum - 1 > half) {
                seatObject.addNearbySeat(this.getSeatObject(tableKey, seatObject.seatnum - 1))            
            }
            // 獲取右側相鄰座位
            if (seatObject.seatnum + 1 <= this.tables[tableKey].length) {
                seatObject.addNearbySeat(this.getSeatObject(tableKey, seatObject.seatnum + 1));            
            }

        }
    }
  
  }
  CreateSeats(seats){
    const count =  Object.keys(this.tables).length - seats.length;
    if (count === 0) {
      const seat = require('./seatclass');
      const tableKeys = Object.keys(this.tables);


      for (let i = 0; i < tableKeys.length; i++) {
          const tableKey = tableKeys[i];
          const seatCount = seats[i];

          // 创建座位数组
          const seatArray = [];

          for (let j = 1; j <= seatCount; j++) {
              const seatObject = new seat(tableKey, j);
              seatArray.push(seatObject);
          }

          // 将座位数组分配给相应的桌子
          this.tables[tableKey] = seatArray;
          this.setseatsnearby(tableKey);
      }
    } else if (count > 0) {
      console.log("桌子數較椅子數多 "+count);
    } else if (count < 0) {
      console.log("椅子數較桌子數多 "+count);
    }
  }
  getSeatObject(tableKey, seatnum) {
    if (this.tables[tableKey]) {
        if (this.tables[tableKey][seatnum - 1]) {
            return this.tables[tableKey][seatnum - 1];
        }
    }
    return null; // 座位对象不存在
  }



  setMaxCapacityTable() {
    let maxCapacityTable = null;
    let maxCapacity = 0;

    for (const tableKey of Object.keys(this.tables)) {
      const seatCount = this.tables[tableKey].length;
      if (seatCount > maxCapacity) {
        maxCapacity = seatCount;
        maxCapacityTable = tableKey;
      }
    }

    this.maxCapacityTable =  maxCapacityTable;
  }

  // 获取每个桌子的座位数量
  getTableSeatCounts() {
    const tableSeatCounts = {};

    for (const tableKey of Object.keys(this.tables)) {
      const seatCount = this.tables[tableKey].length;
      tableSeatCounts[tableKey] = seatCount;
    }

    return tableSeatCounts;
  }
  //獲取指定桌子的擁有坐位數
  getSeatCount(talblenum) {
    return this.tables[talblenum].length;
  }




}


module.exports = tableclass;

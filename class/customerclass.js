class customer{//在加入排隊時才會被創建，結束用餐後才會被刪除
    constructor(customer_count,userdata){
        this.customer_count = customer_count;
        this.mail = userdata.mail;
        this.userdata = userdata;
        this.InQueue = true;
        this.canapart = false;
        this.asked_apart = false;
        this.seats = [];
    }
    getCustomer(){
        return this;
    }
    getCustomerCount(){
        return this.customer_count;
    }



    setseats(seats) {
        this.seats = {};
    
        for (const seat of seats) {
            const tablenum = seat.tablenum;
            const seatnum = seat.seatnum;
    
            if (!this.seats[tablenum]) {
                this.seats[tablenum] = {};
            }
    
            if (!this.seats[tablenum][seatnum]) {
                this.seats[tablenum][seatnum] = [];
            }
    
            this.seats[tablenum][seatnum].push(seat);
        }
    }
    

}



module.exports = customer;
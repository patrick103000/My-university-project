const mysql = require('mysql2/promise'); // 确保导入正确的 MySQL 库
const bcrypt = require('bcrypt'); // 如果您使用了 bcrypt 库
const { Store } = require('express-session');

class Data2sql {
  constructor() {
    this.pool = mysql.createPool({
      user: 'root',
      password: '!QAZ2wsx',
      host: 'localhost',
      database: 'mydatabase',
    });
  }

  async register(id, name, email, password) {
    let connection; // 在方法内部定义连接
    try {
      connection = await this.pool.getConnection();
      if (await this.emailExists(connection, email)) {
        return { success: false, message: 'Email already exists' };
      } else {
        const insertSQL = 'INSERT INTO `user` (Id, Role, User, Email, Password) VALUES (?, "user", ?, ?, ?)';
        const values = [id, name, email, password];
        await connection.query(insertSQL, values);
        connection.release();
        return { success: true, message: 'User registered successfully' };
      }
    } catch (error) {
      console.error('Error:', error);
      if (connection) connection.release(); // 确保在出错时释放连接
      return { success: false, message: 'User registration failed' };
    }
  }

  async emailExists(connection, email) {
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) AS count FROM `user` WHERE Email = ?', [email]);
      return rows[0].count > 0;
    } catch (error) {
      console.error('Error checking if email exists:', error);
      throw error;
    }
  }

  async login(email, password) {
    let connection; // 在方法内部定义连接
    try {
      connection = await this.pool.getConnection();
      const [userRow] = await connection.execute('SELECT * FROM `user` WHERE Email = ?', [email]);
      if (userRow.length === 0) {
        console.error('User not found');
        connection.release();
        return { success: false, message: '此用戶不存在，請先進行註冊' };
      }

      const user = userRow[0];
      const isPasswordValid = await bcrypt.compare(password, user.Password);
     
      if (isPasswordValid) {//如果登入成功
        connection.release();
        const userdata = {id:user.Id,name:user.User,mail:user.Email};//BYfurich
        return { success: true, message: 'Login successful', id: user.Id, role: user.Role,user:user.User, userdata:userdata};
      } else {
        connection.release();
        return { success: false, message: '密碼錯誤，請重新輸入' };
      }
    } catch (error) {
      console.error('Error:', error);
      if (connection) connection.release();
      return { success: false, message: 'Login failed' };
    }
  }

  async showmenu(store_id) {

    let connection; // 在方法内部定义连接
    try {
      connection = await this.pool.getConnection();
      const [menuRow] = await connection.execute('SELECT * FROM `menu` WHERE Store_id = ?', [store_id]);
      if (menuRow.length === 0) {//如果沒有餐點
        console.error('目前沒有菜單或查詢失敗');
        connection.release();
        return { success: false, message: '目前沒有餐點喔，請點擊下方"新增餐點"進行新增', menuRow };
      } else {//如果查詢成功
        console.log('菜單查詢成功');
        connection.release();
        return { success: true, message: 'Show menu', menuRow };
      }
    } catch (error) {
      console.error('Error:', error);
      if (connection) connection.release(); // 确保在出错时释放连接
      return { success: false, message: 'Failed to retrieve menu' };
    }
  }


  async addmenu(store_id, meal, price, production, type) {
    const newid = await this.checkmeal(store_id);

    const insertSQL = 'INSERT INTO `mydatabase`.`menu` (Store_id, Meal_id, Meal, Price, Production, Type) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [store_id, newid, meal, price, production, type];
    let connection; // 在方法内部定义连接
    try {
        connection = await this.pool.getConnection(); // Initialize connection
        await connection.query(insertSQL, values); // 将数据写入数据库
        return { success: true, message: 'Data has been successfully added to the database',store_id:store_id };
        

    } catch (error) {
      return { success: false, message: 'Error inserting data into the database: ' + error};

    } finally {
        if (connection) {
            connection.release(); // 释放数据库连接
        }
    }
  }


async checkmeal(store_id) {
    let connection; // 在方法内部定义连接
    try {
        connection = await this.pool.getConnection();
        const query = 'SELECT Meal_id FROM `menu` WHERE Store_id = ?';
        const [rows, fields] = await connection.execute(query, [store_id]);

        if (rows.length === 0) {
            // 如果数据库中没有匹配的ID，则为该商店生成第一个ID
            const newMealId = `${store_id}_0001`;
            return newMealId;
        } else {
            // 如果数据库有匹配的ID，获取最大的编号并递增+1
            
            const newNumber = rows.length+1;
            const paddedNumber = newNumber.toString().padStart(4, '0');
            const newMealId = `${store_id}_${paddedNumber}`;
            return newMealId;
        }
    } catch (error) {
        console.error('Error executing the query: ' + error);
        throw error;
    }
}

async deletemenu(store_id) {
  
  let connection; // 在方法内部定义连接
  
  try {
    connection = await this.pool.getConnection();
    const deleteSQL = 'DELETE FROM menu WHERE Store_id = ?';
    await connection.query(deleteSQL, store_id);
    return { success: true, message: 'Data has been successfully delete to the database'};
  } catch (error) {
    console.error('Error executing the query: ' + error);
    return { success: false, message: 'Data has been successfully delete to the database'};
    throw error;
  }
}

async savemenu(data, store_id) {

  const insertSQL ='INSERT INTO `mydatabase`.`menu` (Store_id, Meal_id, Meal, Price, Production, Type) VALUES (?, ?, ?, ?, ?, ?)';
  let connection; // Define the connection within the method
  try {
    connection = await this.pool.getConnection(); // Initialize connection

    const successResults = [];
    const errorResults = [];

    for (const item of data) {
      const newid = await this.checkmeal(store_id);
      const values = [store_id, newid, item.meal, item.price, item.cookTime, item.type];
      try {
        const result = await connection.query(insertSQL, values); // Insert data into the database
        successResults.push(result);
      } catch (error) {
        console.error('Error inserting data into the database:', error);
        errorResults.push({ error, values });
      }
    }

    if (errorResults.length === 0) {
      return { success: true, message: 'Data has been successfully added to the database', store_id };
    } else {
      return { success: false, message: 'Some data could not be inserted into the database', store_id, errorResults };
    }
  } catch (error) {
    return { success: false, message: 'Error handling data and inserting into the database: ' + error };
  } finally {
    if (connection) {
      connection.release(); // Release the database connection
    }
  }
}



async show_storeinfo(store_id) {

  let connection; // 在方法内部定义连接
  try {
      connection = await this.pool.getConnection(); // Initialize connection
      const [inforow] = await connection.execute('SELECT * FROM `store_info` WHERE Store_id = ?', [store_id]);
      return { success: true, message: 'Data has been successfully added to the database',inforow };
      

  } catch (error) {
    return { success: false, message: 'Error inserting data into the database: ' + error};

  } finally {
      if (connection) {
          connection.release(); // 释放数据库连接
      }
  }
}

async updateinfo(store_id, data) {

  const updateSQL = 'UPDATE `mydatabase`.`store_info` SET Store_name = ?, Store_owner = ?, Store_phone = ?, Store_Location = ? WHERE Store_id = ?';
  const values = [data.name, data.owner, data.phone, data.location, store_id];

  let connection;
  try {
    connection = await this.pool.getConnection();
    const result = await connection.query(updateSQL, values);
    console.log("資訊已更新")
    return result;
  } catch (error) {
    return { success: false, message: 'Error updating data in the database: ' + error };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async checkout(user_id, order_info) {
  const time = new Date().getTime();
  const order_id = order_info[0].storeId.slice(-4) + time.toString() + user_id.slice(-5);
  const date = new Date(time);
  const currenttime = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const insert = 'INSERT INTO order_info (User_id, Order_id, Order_info,Order_time,Store_id) VALUES (?, ?, ?, ?, ?)';

  let connection;
  try {
    connection = await this.pool.getConnection();
    const result = await connection.query(insert, [user_id, order_id, JSON.stringify(order_info),currenttime,order_info[0].storeId]);
    return { success: true, message: 'Data successfully inserted into the database', orderId: order_id };

  } catch (error) {
    return { success: false, message: 'Error updating data in the database: ' + error };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}


async show_orderinfo(order_id) {

  let connection; // 在方法内部定义连接
  try {
    connection = await this.pool.getConnection();
    const [orderRow] = await connection.execute('SELECT * FROM `order_info` WHERE Order_id = ?', [order_id]);
    if (orderRow.length === 0) {//如果沒有餐點
      connection.release();
      return { success: false, message: '目前沒有餐點喔，請點擊下方"新增餐點"進行新增' };
    } else {//如果查詢成功
    
      connection.release();
      return { success: true, message: 'Show menu', orderRow:orderRow};
    }
  } catch (error) {
    console.error('Error:', error);
    if (connection) connection.release(); // 确保在出错时释放连接
    return { success: false, message: 'Failed to retrieve menu' };
  }
}
//顯示每個用戶的所有訂單---------
async showorder(user_id) {
  let connection; // 在方法内部定义连接
  try {
    connection = await this.pool.getConnection();
    const [orderRow] = await connection.execute('SELECT * FROM `order_info` WHERE user_id = ?', [user_id]);
    if (orderRow.length === 0) {//如果沒有餐點
      connection.release();
      return { success: false, message: '目前沒有餐點喔，請點擊下方"新增餐點"進行新增' };
    } else {//如果查詢成功
  
      connection.release();
      return { success: true, message: 'Show menu', orderRow:orderRow};
    }
  } catch (error) {
    console.error('Error:', error);
    if (connection) connection.release(); // 确保在出错时释放连接
    return { success: false, message: 'Failed to retrieve menu' };
  }
}
//商家顯示訂單
async showorderbyorder(Store_id) {
  let connection; // 在方法内部定义连接
  try {
    connection = await this.pool.getConnection();
    const [orderRow] = await connection.execute('SELECT * FROM `order_info` WHERE Store_id = ?', [Store_id]);
    if (orderRow.length === 0) {//如果沒有餐點
      connection.release();
      return { success: false, message: '目前沒有餐點喔，請點擊下方"新增餐點"進行新增' };
    } else {//如果查詢成功
  
      connection.release();
      return { success: true, message: 'Show menu', orderRow:orderRow};
    }
  } catch (error) {
    console.error('Error:', error);
    if (connection) connection.release(); // 确保在出错时释放连接
    return { success: false, message: 'Failed to retrieve menu' };
  }
}


async checkneworder(Store_id){
  console.log(Store_id,'from test=====================')
  let connection;
  try {
    connection = await this.pool.getConnection();
    
    // 根據 Store_id 進行查詢
    const [orderRows] = await connection.execute('SELECT * FROM `order_info` WHERE Store_id = ? ', [Store_id]);

    // // 定義一個字典來追蹤每個店家的未完成訂單數量
    // const unfinishedOrdersByStore = {};

    // // 遍歷查詢結果，更新字典中每個店家的未完成訂單數量
    // orderRows.forEach(order => {
    //   const storeId = order.Store_id;
    //   if (!unfinishedOrdersByStore[storeId]) {
    //     unfinishedOrdersByStore[storeId] = 0;
    //   }
      
    //   if (!order.completed) {
    //     unfinishedOrdersByStore[storeId]++;
    //   }
    // });
    // console.log(orderRows)
    // connection.release();

    return { success: true, message: 'Show menu',orderRow:orderRows };
  } catch (error) {
    console.error('Error:', error);
    if (connection) connection.release();
    return { success: false, message: 'Failed to retrieve menu' };
  }

}

async updatestatu(Order_id){
  console.log(`Updating status for Order_id: ${Order_id}`);
  
  let connection;
  try {
    connection = await this.pool.getConnection();
    await connection.execute('UPDATE order_info SET Order_complete = 1 WHERE Order_id = ?', [Order_id]);
    
    console.log(`Successfully updated status for Order_id: ${Order_id}`);
    
    connection.release();
    return { success: true, message: 'Sucessed to update ' };
  } catch (error) {
    console.error('Error:', error);
    if (connection) connection.release();
    return { success: false, message: 'Failed to update ' };
  }
}


}

module.exports = Data2sql;

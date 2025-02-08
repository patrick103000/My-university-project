const http = require('http')
const qs = require('qs');
const hostname = '172.20.10.6'; // Replace with the desired IP address
const port = '3000';
const server = http.createServer(handler)

function handler(req, res) {
  if(req.url === '/') {
    res.end('helo world.');
  }

  if (req.method === 'POST') {
    let body = '';
    
    // 監聽 'data' 事件，接收 POST 資料
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    // 監聽 'end' 事件，接收完畢後處理資料
    req.on('end', () => {
      const postData = qs.parse(body);
      console.log(postData); // 這裡可以使用接收到的資料做進一步處理
      res.end('Data received'); // 回傳回應給 ESP32
    });
  }
};

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});



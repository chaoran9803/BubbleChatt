const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.get('/', (req,res) => {
    res.send("bubbleChatt server is running");
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>{
    console.log(`Server listenting on port ${PORT}`);
})
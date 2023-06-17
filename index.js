const express = require('express')
const { SerialPort } = require('serialport')
const { Server } = require("socket.io");
const http = require('http');

//Create serial comunication
const serialPort = new SerialPort({
    path: 'COM3',
    baudRate: 9600,
})

//Create configuration of express
const app = express();
const server = http.createServer(app);

//Create socket comunication
const io = new Server(server);

const port = 3000

let minLevel = 10;
let maxLevel = 90;
let sizeContainer = 11;
let capacity = 1;

app.get('/', (req, res) => {
    res.sendFile(__dirname + "\\index.html");
})

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

io.on('connection', (socket) => {
    console.log('Un nuevo usuario se ha conectado');
    socket.on('disconnect', () => {
      console.log('Un usuario se ha desconectado');
    });
    socket.on('update levels', (msg) => {
        minLevel = msg["inf"];
        maxLevel = msg["sup"];
    });
});

serialPort.on('open',function () {
    console.log("Puero de arduino escuchando...");
})

serialPort.on('data', function (data) {
    if(isNaN(Number(data.toString()))){
        return;
    }
    const currentLevel = Number(data.toString());
    const percent = 100 - Number((currentLevel * 100 / sizeContainer).toFixed(2));
    const liters = capacity - Number((currentLevel * capacity / sizeContainer).toFixed(2));
    if(percent > maxLevel && percent > minLevel){
        //Drain
        serialPort.write('2')
    }
    if(percent < minLevel && percent < maxLevel){
        //Fill
        serialPort.write('1')
    }
    if(percent >= minLevel && percent <= maxLevel){
        //Stop
        serialPort.write('0')
    }
    io.emit('update data', {
        "liters" : liters,
        "min" : minLevel,
        "max" : maxLevel,
        "percent" : percent
    });
});


// https://www.valentinog.com/blog/socket-io-node-js-react/
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
// const axios = require("axios");
const uuidByString = require("uuid-by-string");
const kafkaPS = require('kafka-pub-sub');

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);

//TODO: Update these to your kafka endpoint(s)
const kHosts = 'localhost:9092';//'localhost:32815,localhost:32816,localhost:32817';

const server = http.createServer(app);
const io = socketIo(server); // < Interesting!

process.on('unhandledRejection', (reason, p) => {
    // https://stackoverflow.com/a/15699740/3562407
    p.catch(error => {
        const msg = "INDEX: Unhandled Rejection:\n" + error.stack;
        console.error(msg);
    });
});

// https://www.joyent.com/node-js/production/design/errors
// https://strongloop.com/strongblog/robust-node-applications-error-handling/
process.on('uncaughtException', (error) => {
    const msg = 'INDEX: Uncaught Exception:\n' + error.stack;
    console.error(msg);
});


function produceKafkaMessages(user) {
    setInterval(() => {
        console.log('sending....');
        // const topic = uuidByString(users[Math.floor(Math.random() * 2)]); //random message to topic
        const topic = uuidByString(user); //random message to topic
        kafkaPS.ServiceProducer
            .buildAMessageObject({ message: `The DateTime is: ${new Date().toISOString()}` }, topic, 'TEST')
            .then((msg) => {
                kafkaPS.ServiceProducer.send([msg])
                    .catch(err => { });
            })
        // .catch((error) => { console.error('!!!ERROR: ' + error.stack); })
    }, 15 * 1000);
}

function createKafkaListenerFor(consumer, clientId, io) {
    console.log("KL---clientId:" + clientId);
    consumer.listen((message) => {
        // console.log(`Message: ${JSON.stringify(message, null, 2)}`);
        if (message.topic !== clientId) return;
        const value = JSON.parse(message.value);
        const data = value.data;
        io.to(clientId).emit('message', { message: `You are client: ${clientId}\n Here's your message: ${data.message}` });
        // socket.emit('fromBackend', { message: `You are client: ${clientId}\n Here's your message: ${data.message}` });
    }, true);
}

function setupKafka(consumer, clientId, io) {
    consumer.subscribe(clientId)
        .then(() => {
            createKafkaListenerFor(consumer, clientId, io);
        });
}

const users = [
    'jane@doe.com',
    'john@doe.com',
];

let connectedUsersCount = 0;


function rooms(io) {
    // https://stackoverflow.com/a/8540388
    io.sockets.on('connection', function (socket) {
        const email = users[connectedUsersCount];
        const id = uuidByString(email);

        socket.emit("fromBackend", { email, id });

        socket.on('join', function (room) {

            const consumer = new kafkaPS.ServiceConsumerObject(kHosts, room);

            // if (io.sockets.rooms.indexOf(room) >= 0) {
            //     kafkaPS.ServiceConsumer.resumeTopic(room);
            // } else {

            console.log("room:", JSON.stringify(room, null, 2));
            socket.join(room);
            setupKafka(consumer, room, io);

            // socket.broadcast.to(room).emit('message', { message: "hi" });
            // io.to(room).emit('message', { message: "hi" });

            // socket.on('message', function (msg) {
            //     socket.broadcast.to(room).emit('message', msg);
            // });

            produceKafkaMessages(email);

            socket.on('disconnect', function () {
                console.log("KL---client disconnected:" + room);
                consumer.close();
                connectedUsersCount--;
            });

            // socket.on('reconnect', function () {
            //     console.log("KL---client reconnected:" + room);
            //     kafkaPS.ServiceConsumer.resumeTopic(room);
            // });
            // }
        });

        connectedUsersCount++;
        // connectedUsersCount = (connectedUsersCount > 1) ? 0 : connectedUsersCount++;
    });

}

server.listen(port, () => console.log(`Listening on port ${port}`));

//  function initCG() {
//     await kafkaPS.ServiceConsumerGroup.init(uuidByString(users[Math.floor(Math.random() * 2)]), {
//         partitions: 1,
//         replicationFactor: 1
//     }, { kafkaHost: 'localhost:9092', groupId: 'GROUP_TEST' })
// }


// initCG();
// produceKafkaMessages();
rooms(io);
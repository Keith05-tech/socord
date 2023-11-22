const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database('ooo.messages.db');

db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, text TEXT, icon TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    socket.on('setUser', (user) => {
        socket.user = user;
        io.emit('updateOnlineUsers', getOnlineUsers());
    });

    socket.on('sendMessage', (message) => {
        const newMessage = {
            user: socket.user.displayName,
            text: message,
            icon: socket.user.icon,
        };

        saveMessageToDB(newMessage);

        io.emit('receiveMessage', newMessage);
    });

    socket.on('disconnect', () => {
        io.emit('updateOnlineUsers', getOnlineUsers());
    });

    // Load messages from the database and send them to the client
    loadMessagesFromDB()
        .then((messages) => {
            socket.emit('loadMessages', messages);
        })
        .catch((error) => {
            console.error('Error loading messages:', error);
            socket.emit('loadMessages', []);
        });
});

function saveMessageToDB(message) {
    const stmt = db.prepare("INSERT INTO messages (user, text, icon) VALUES (?, ?, ?)");
    stmt.run(message.user, message.text, message.icon);
    stmt.finalize();
}

function loadMessagesFromDB() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM messages", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function getOnlineUsers() {
    const onlineUsers = [];
    io.sockets.sockets.forEach((socket) => {
        if (socket.user) {
            onlineUsers.push({
                displayName: socket.user.displayName,
                icon: socket.user.icon,
            });
        }
    });
    return onlineUsers;
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

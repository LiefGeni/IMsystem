//引用express到项目中，来管理路由响应请求，根据请求的URL返回相应的HTML页面。
var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),//引入socket.io并监听服务器端
  users = { length: 0 },
  pwdArr = [],
  room = { length: 0 };
//use express to specify URL of the html we will use
app.use('/', express.static(__dirname + '/www'));

//bind the server to the 3000 port
server.listen(process.env.PORT || 3000);

// 监听客户端连接，回调函数会传递本次连接的socket
io.sockets.on('connection', function (socket) {
  // new user login
  socket.on('login', function (nickname) {
    if (users.hasOwnProperty(nickname)) {
      socket.emit('nicknameExisted');         // 检查用户名唯一
    } else if (nickname === 'Robot' || nickname.substr(0, 5) === 'Room-' || nickname.indexOf('<') > -1 || nickname.indexOf('>') > -1 || nickname.indexOf('/') > -1) {
      socket.emit('nicknameIllegal');
    } else {
      socket.nickname = nickname;
      users[nickname] = socket.id;            // { nickname: socket.id }
      users.length++;
      socket.emit('loginSuccessfully', socket.nickname);
    }
  });
  //user log out
  socket.on('disconnect', function () {
    if (socket.nickname !== undefined) {
      delete users[socket.nickname];
      users.length--;
    }
  });

  socket.on('search', function (nickname) {
    if (users.hasOwnProperty(nickname)) {
      if (nickname === socket.nickname) {
        socket.emit('self', nickname);
      } else {
        socket.emit('searchSuccessfully', nickname);
      }
    } else {
      socket.emit('searchFailed', nickname);
    }
  });
  socket.on('add', function (toWhom, authentication) {
    // 给好友客户端发送好友请求
    io.sockets.socket(users[toWhom]).emit('addReq', socket.nickname, authentication);
  });
  socket.on('accept', function (returnToWhom) {
    // 给请求客户端发送请求通过
    io.sockets.socket(users[returnToWhom]).emit('reqAccepted', socket.nickname);
  });

  //new message get
  socket.on('postMsg', function (msgType, time, msgInfo, msgData, toWhere) {
    if (toWhere.substr(0, 5) === 'Room-') {
      // 群聊
      var roomMember = room[toWhere];
      for (var i = 0; i < roomMember.length; i++) {
        // 给自己除外的群成员发送消息
        if (roomMember[i] !== socket.nickname) {
          io.sockets.socket(users[roomMember[i]]).emit('newMsg', msgType, socket.nickname, time, msgInfo, msgData, toWhere);
        }
      }
    }
    else if (toWhere === 'Robot') {
      // 机器人聊
      if (msgData.indexOf('手册') > -1 || msgData.indexOf('help') > -1) {
        socket.emit('robot', 'help');
      } else {
        // 查询天气
        const UID = "UD52160A10", KEY = "e09qmjawcefttizv";
        var Api = require('./lib/api.js'),
          argv = require('optimist').default('l', msgData.trim()).argv;
        var api = new Api(UID, KEY);
        api.getWeatherNow(argv.l).then(function (data) {
          socket.emit('robot', data);
        }).catch(function (err) {
          socket.emit('robot', '抱歉，查无结果！');
          console.log(err.error.status);
        });
      }
    } else {
      // 私聊
      io.sockets.socket(users[toWhere]).emit('newMsg', msgType, socket.nickname, time, msgInfo, msgData, socket.nickname);
    }
  });

  // create a room
  socket.on('createRoom', function (duration) {
    var password = createPassword();
    while (pwdArr.indexOf(password) > -1) { password = createPassword(); }
    pwdArr.push(password);
    setTimeout(function () {
      // 在有效期到后删除密码
      var index = pwdArr.indexOf(password);
      pwdArr.splice(index, 1);
    }, duration * 60 * 1000);
    socket.emit('roomCreated', password);
  });
  // join a room
  socket.on('joinRoom', function (password) {
    if (pwdArr.indexOf(password) > -1) {
      var roomName = 'Room-' + password, time = new Date().toTimeString().substr(0, 5);
      // 如果已有此key（群），则直接提取其value（成员数组）直接push进去；否则新建一个key-value
      if (room.hasOwnProperty(roomName)) {
        // 判断用户是否已在这个群里，若是，则提示已在此群，否则进入
        if (room[roomName].indexOf(socket.nickname) === -1) {
          room[roomName].push(socket.nickname);
        } else {
          socket.emit('hadJoined');
          return;     //终止后续的操作
        }
      } else {
        room[roomName] = [socket.nickname];     // {room1:[member1,member2],room2:[member1,member3]}
        room.length++;
      }
      var roomMember = room[roomName];
      socket.emit('roomJoined', roomName);
      for (var i = 0; i < roomMember.length; i++) {
        io.sockets.socket(users[roomMember[i]]).emit('roomBroadcast', socket.nickname, 'joined', roomName, time);
      }
    } else {
      socket.emit('roomNotFound');
    }
  });
});

function createPassword() {
  var elemArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm',
    'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  var pwd = '';
  for (var i = 0; i < 4; i++) {
    pwd += elemArr[Math.ceil(Math.random() * 33)];
  }
  return pwd;
};
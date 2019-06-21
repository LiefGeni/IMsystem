// CA Chat  v0.1.0
// Caijialinxx Mar 13, 2018
// MIT license

window.onload = function () {
  var ca = new CA();
  ca.init();
};

var CA = function () {
  this.socket = null;
};

CA.prototype = {
  init: function () {
    var that = this;
    this.socket = io.connect();

    // BEGIN 监听服务端 —— 判断登录状态
    this.socket.on('connect', function () {
      $('#nicknameInput').focus();
    });
    this.socket.on('nicknameExisted', function () {
      $('#info')[0].children[1].textContent = "Nickname Existed!";
      $('#info').css('visibility', "visible");
      $('#nicknameInput').focus();
    });
    this.socket.on('nicknameIllegal', function () {
      $('#info')[0].children[1].textContent = "Nickname is illegal!";
      $('#info').css('visibility', "visible");
      $('#nicknameInput').focus();
    });
    this.socket.on('loginSuccessfully', function (nickname) {
      document.title = 'CA | ' + $('#nicknameInput')[0].value;
      $('#loginWrapper').css('display', 'none');
      $('#main').css('display', 'flex');
      $('#userName')[0].textContent = nickname;
      $('#searchBox input').focus();
      that._robot('welcome');
      $('li#Robot').addClass('active');
      $('.head')[0].textContent = 'Robot';
    });
    this.socket.on('error', function () {
      alert("ERROR: Maybe socket.io can not work!");
      $('#logo svg use')[0].attributes[0].value = '#icon-error';
    });
    // END 监听服务端 —— 判断登录状态

    // BEGIN robot
    this.socket.on('robot', function (result) {
      that._robot(result);
    })
    // END robot

    // BEGIN 监听服务端 —— 搜索好友
    this.socket.on('searchFailed', function (nickname) {
      // 弹窗错误提示
      that._displayAlert('not found', nickname);
    });
    this.socket.on('searchSuccessfully', function (nickname) {
      // 确认是否添加好友
      that._displayAlert('not friend', nickname);
    });
    this.socket.on('self', function (nickname) {
      that._displayAlert('self', nickname);
    });
    this.socket.on('addReq', function (nickname, authentication) {
      that._displayAlert('addReq', nickname, authentication);
    });
    this.socket.on('reqAccepted', function (nickname) {
      that._displayMsgBox('isNewFriend', nickname);
    });
    // END 监听服务端 —— 搜索好友

    // BEGIN group
    this.socket.on('roomCreated', function (password) {
      $('input#first')[0].value = password.substr(0, 1);
      $('input#second')[0].value = password.substr(1, 1);
      $('input#third')[0].value = password.substr(2, 1);
      $('input#fourth')[0].value = password.substr(3, 1);
      $('.pwdBox .intro')[0].innerHTML = 'Tell your room member the password to join to chat.';
      $('#confirm')[0].textContent = 'Join';
      $('#pwd').css('display', 'block');
      $('input#duration').attr('disabled', 'disabled');
      $('#pwd input').attr('disabled', 'disabled');
      $('input#duration').css('background-color', '#ffffff11');
      $('.pwdBox').animate({ top: '118' }, 0).animate({ left: '250', opacity: 1 }, 200);
    });
    this.socket.on('roomBroadcast', function (nickname, type, roomName, time) {
      var msg = nickname + (type === 'joined' ? ' joined' : ' left');
      that._displayNewMsg('text', 'system', time, '#888', msg);
      that._setSession('text', 'system', time, '#888', msg, roomName);
    });
    this.socket.on('roomJoined', function (roomName) {
      that._displayMsgBox('isNewRoom', roomName);
    });
    this.socket.on('hadJoined', function () {
      $('.pwdBox .intro')[0].textContent = 'You had joined this room.';
      $('.pwdBox').animate({ top: '118' }, 0).animate({ left: '250', opacity: 1 }, 200);
    });
    this.socket.on('roomNotFound', function () {
      $('.pwdBox .intro')[0].textContent = 'Room can not find.';
      $('.pwdBox').animate({ top: '118' }, 0).animate({ left: '250', opacity: 1 }, 200);
    });
    // END group

    // BEGIN newMsg
    this.socket.on('newMsg', function (type, sender, time, color, msg, fromWhere) {
      that._setSession(type, sender, time, color, msg, fromWhere);
      // 如果是在当前聊天对话框，则直接显示，否则用户列表样式
      if ($('.head')[0].textContent === fromWhere) {
        that._displayNewMsg(type, sender, time, color, msg);
      } else {
        if (fromWhere.substr(0, 5) !== 'Room-') { fromWhere = 'User_' + fromWhere; }
        $('li#' + fromWhere).addClass('unread');
      }
    });
    // END newMsg

    // showRobot
    $('.messageBox').click(function (e) {
      if (e.target.textContent === 'CA手册') {
        that._sendMsg('CA手册');
      } else if (e.target.textContent === '查询天气') {
        that._sendMsg('查询天气');
      }
    });

    // BEGIN group
    $('#create').click(function () {
      $('.pwdBox .intro')[0].innerHTML = 'Name your room and set the valid duration of password.<br>( 1 ≤ duration ≤ 999 )';
      $('#confirm')[0].textContent = 'Confirm';
      $('#pwd').css('display', 'none');
      $('.pwdBox .info').css('display', 'block');
      $('input#duration').css('background-color', '#ffffff44');
      $('input#duration').removeAttr('disabled');
      $('input#duration').focus();
      $('input#duration')[0].value = '';
      $('.pwdBox').animate({ top: '118' }, 0).animate({ left: '250', opacity: 1 }, 200);
    });
    $('#join').click(function () {
      $('.pwdBox .intro')[0].textContent = 'Input password to join a room.';
      $('#confirm')[0].textContent = 'Join';
      $('#pwd').css('display', 'block');
      $('.pwdBox .info').css('display', 'none');
      $('#pwd input').removeAttr('disabled');
      for (var i = 0; i < $('#pwd input').length; i++) {
        // 清空
        $('#pwd input')[i].value = '';
      }
      $('input#duration').attr('disabled', 'disabled');
      $('input#first').focus();
      $('.pwdBox').animate({ top: '118' }, 0).animate({ left: '250', opacity: 1 }, 200);
    });
    // 鼠标操作
    $('#confirm').click(function () {
      that._displayPwdBox();
    });
    $('#cancelBtn').click(function () {
      $('.pwdBox').animate({ left: '240', opacity: 0 }, 200).animate({ top: '-999' }, 0);
    });
    // 键盘操作
    $('.pwdBox input').keydown(function (e) {
      if (e.target.value.length === 1 && e.keyCode !== 8 && e.target.nextElementSibling !== null) {
        // 自动跳到下一个
        e.target.nextElementSibling.focus();
      } else if (e.target.value.length === 0 && e.keyCode === 8 && e.target.previousElementSibling !== null) {
        // 退格键事件
        e.target.previousElementSibling.focus();
      }
      if (e.keyCode === 13 && e.target.nextElementSibling === null) {
        that._displayPwdBox();
      }
      if (e.keyCode === 32 || e.keyCode === 9) {
        e.preventDefault();
      }
    });
    // END group

    // BEGIN login event
    $('#loginBtn').click(function () {
      that._checkNickname();
    });
    $('a#giveName').click(function () {
      $.ajax({
        url: '/data.json',  //提交的地址
        type: 'GET',        //提交方式
        async: false,
        dataType: 'json',     //数据的类型,XML、text，注意XML是大写的
        error: function () {   //出现异常时调用回调函数
          alert('无法返回正确的数据');
        },
        success: function (json) {
          var nameArr = json["nickname"], index = Math.ceil(Math.random() * 105);
          $('#nicknameInput')[0].value = nameArr[index];
        }
      });
    });
    $('#nicknameInput').on('keyup', function (e) {
      if (e.keyCode === 13) {
        that._checkNickname();
      }
    });
    // END login event

    // BEGIN search
    $('#searchBox').focusin(function () {
      $('#searchBox').css('background-color', '#ffffff99');
    });
    $('#searchBox').focusout(function () {
      $('#searchBox').css('background-color', '#ffffff22');
    });
    $('#searchBox svg').click(function () {
      if ($('#searchBox input')[0].value !== '') { that._search(); }
    });
    $('#searchBox input').keypress(function (e) {
      if (e.keyCode === 13) {
        e.preventDefault();//阻止回车键的默认事件，使其不会换行。
        if ($('#searchBox input')[0].value !== '') { that._search(); }
      }
    });
    // END search

    // BEGIN add
    $('#alert #closeBtn').click(function () {
      $('#alert').animate({ left: '240', opacity: 0 }, 200).animate({ top: '-999' }, 0);
    });
    $('#alert form').submit(function (e) {
      e.preventDefault();
      if (e.target[1].value === 'Add') {
        that._add();
      } else if (e.target[1].value === 'Accept') {
        var acceptedFriendName = $('#alert .friendName')[0].textContent;
        // 向服务器发送“请求通过”消息，参数为发送请求者的nickname
        that.socket.emit('accept', acceptedFriendName);
        that._displayMsgBox('isNewFriend', acceptedFriendName);
      }
      $('#alert').animate({ left: '240', opacity: 0 }, 200).animate({ top: '-999' }, 0);
    });
    // END add

    $('#usersList').click(function (e) {
      e.target.className = 'active';
      // 获取到点击到的li的父元素label的for属性“User_xxx”
      var id = e.target.parentElement.htmlFor;
      that._displayMsgBox('isOld', id);
    });

    // BEGIN listen to controllers
    $('.controllers').click(function () {
      $('.controllers').css('background-color', '#fff');
      $('.editArea').focus();
      $('.editArea').css('color', $('.changeColor')[0].value);
    });
    $('.controllers').focusout(function () {
      $('.controllers').css('background-color', '#eee');
    });
    // BEGIN emoji
    $('svg.emoji').click(function () {
      $('.emojisBox').css('display', "block");
    });
    $('.emojisBox').mouseleave(function () {
      $('.emojisBox').css('display', "none");
    });
    $('.emojisBox svg').click(function (e) {
      $('.editArea')[0].append('[' + e.currentTarget.children[0].attributes[0].value + ']');
    });
    // END emoji
    // BEGIN msg
    $('.editArea').keypress(function (e) {
      //1. 不使用keyup以便灵敏检测到用户按下了 Shift + Enter 换行，且不必考虑先松开按键的顺序。
      //2. 不使用keydown以免当用户长按按键时，多次触发本事件。
      $('.editArea').css('color', $('.changeColor')[0].value);
      if (e.keyCode === 13 && e.shiftKey === false) {
        e.preventDefault();//阻止回车键的默认事件，使其不会换行。
        that._sendMsg();
      }
    });
    $('.sendBtn').click(function () {
      that._sendMsg();
    });
    // END msg
    // END listen to controllers

    // BEGIN file
    $('.sendFile').change(function () {
      var time = new Date().toTimeString().substr(0, 5);
      var file = $('.sendFile')[0].files[0];
      // 判断是否选中文件
      if (file) {
        var result = confirm('确定要发送【' + file.name + '】文件吗？');
        if (result) {
          var fileInfo = {
            'name': file.name,
            'size': file.size,
            'type': file.type,
            'url': ""
          }
          var dataurl = "";
          // BEGIN readFile
          var reader = new FileReader();
          if (reader) {
            reader.onload = function () {
              $('.sendFile')[0].value = "";
              dataurl = reader.result;
              fileInfo.url = dataurl;
              // 文件发送到服务器
              that.socket.emit('postMsg', 'file', time, fileInfo, dataurl, $('.head')[0].textContent);
              // 显示文件
              that._displayNewMsg('file', 'Me', time, fileInfo, dataurl);
              that._setSession('file', 'Me', time, fileInfo, dataurl, $('.head')[0].textContent);
            };
            reader.readAsDataURL(file);
          }
          else {
            that._displayNewMsg('text', "system", time, "red", "Your browser doesn't support FileReader");
          }
          // END readFile
        }
      }
    });
    // END file
  },
  // END init

  _checkNickname: function () {
    var nickname = $('#nicknameInput')[0].value;
    if (nickname.trim().length !== 0) {
      this.socket.emit('login', nickname);
    }
    else {
      $('#nicknameInput').focus();
      $('#info')[0].children[1].textContent = "Set your Nickname please!";
      $('#info').css('visibility', "visible");
    }
  },

  _robot: function (keyword) {
    $.getJSON('/data.json', function (json) {
      var time = new Date().toTimeString().substr(0, 5);
      var reply = json["Robot"], msg;
      if (keyword === 'welcome') { msg = $('#userName')[0].innerHTML + '，' + reply.welcome; }
      else if (keyword === 'help') { msg = reply.help; }
      else {
        if (typeof keyword === 'object') {
          msg = keyword.results[0].location.name
            + '<br>天气：' + keyword.results[0].now.text
            + '<br>气温：' + keyword.results[0].now.temperature + '℃'
            + '<br>最后更新：' + keyword.results[0].last_update.substr(11, 5)
            + '<br>数据来源：<a href="https://www.seniverse.com/" target="_blank">心知天气</a>';
        } else { msg = keyword; }
      }
      CA.prototype._displayNewMsg('text', 'Robot', time, '#ff6e40', msg);
      CA.prototype._setSession('text', 'Robot', time, '#ff6e40', msg, 'Robot');
    });
  },
  _search: function () {
    var searchContent = $('#searchBox input')[0].value;
    for (i = 0; i < $('#usersList')[0].children.length; i++) {
      if ($('#usersList')[0].children[i].firstElementChild.textContent === searchContent) {
        this._displayAlert('had added', searchContent);
      } else if (i === $('#usersList')[0].children.length - 1) {
        this.socket.emit('search', searchContent);
      }
    }
  },
  _add: function () {
    var friendName = $('#alert .friendName')[0].textContent,
      auth = $('#alert input[type="text"]')[0].value;
    this.socket.emit('add', friendName, auth);
    alert('已向 ' + friendName + ' 发送请求！')
  },
  _displayAlert: function (type, name, authentication) {
    $('#alert').animate({ top: '62' }, 0).animate({ left: '250', opacity: 1 }, 200);
    $('#alert input[type="text"]').focus();
    $('#alert .friendName')[0].textContent = name;
    if (type === 'not found') {
      $('#alert .status')[0].textContent = 'Cannot Found';
      $('#alert .action').css('display', 'none');
      setTimeout(function () {
        $('#alert').animate({ left: '240', opacity: 0 }, 200).animate({ top: '-999' }, 0);
      }, 1500);
      $('#searcbBox input').focus();
    }
    else if (type === 'not friend') {
      $('#alert .status')[0].textContent = "Not your friend";
      $('#alert .action').css('display', 'flex');
      $('#alert input[type="text"]').removeAttr('disabled');
      $('#alert input[type="text"]')[0].value = "I'm " + $('#userName')[0].textContent;
      $('#alert input[type="submit"]')[0].value = 'Add';
    }
    else if (type === 'self') {
      $('#alert .status')[0].textContent = "is ME";
      $('#alert .action').css('display', 'none');
      setTimeout(function () {
        $('#alert').animate({ left: '240', opacity: 0 }, 200).animate({ top: '-999' }, 0);
      }, 1500);
      $('#searcbBox input').focus();
    }
    else if (type === 'addReq') {
      $('#alert .status')[0].textContent = "Friend Request";
      $('#alert .action').css('display', 'flex');
      $('#alert input[type="text"]').attr('disabled', 'disabled');
      $('#alert input[type="text"]')[0].value = authentication;
      $('#alert input[type="submit"]')[0].value = 'Accept';
    }
    else if (type === 'had added') {
      $('#alert .status')[0].textContent = "had added";
      $('#alert .action').css('display', 'none');
      setTimeout(function () {
        $('#alert').animate({ left: '250', opacity: 0 }, 200).animate({ top: '-999' }, 0);
      }, 1500);
      this._displayMsgBox('isOld', 'User_' + name);
    }
  },
  _displayPwdBox: function () {
    // 当此前操作是需要获取密码时
    if ($('#confirm')[0].textContent === 'Confirm') {
      var duration = $('input#duration')[0].value;
      // 如果是合法时间则执行
      if (Number(duration) >= 1 && Number(duration) <= 999) {
        this.socket.emit('createRoom', duration);
      }
      else {
        alert("Please input vaild durantion!");
        $('input#duration')[0].value = '';
        $('input#duration').focus();
        return;
      }
    }
    // 当此前操作是需要输入密码加入群组时
    else {
      var pwd = '';
      for (var i = 0; i < $('#pwd input').length; i++) {
        pwd += $('#pwd input')[i].value;
      }
      this.socket.emit('joinRoom', pwd);
    }
    $('.pwdBox').animate({ left: '240', opacity: 0 }, 200).animate({ top: '-999' }, 0);
  },
  _displayMsgBox: function (type, nameOrId) {
    var name, id;
    // 清空对话框
    $('.messageBox')[0].innerHTML = '';
    $('li').removeClass('active');
    if (type === 'isNewFriend') {
      name = nameOrId;
      id = 'User_' + name;
      for (i = 0; i < $('#usersList')[0].children.length; i++) {
        if ($('#usersList')[0].children[i].firstElementChild.textContent === name) {
          // 用户列表中与重复的名字，选择合并或覆盖
          var result = confirm('您的用户列表中已有此用户的对话记录，是否合并？\n【确认】表示合并，将保存原来的聊天记录\n【取消】表示覆盖，将删除原来的聊天记录');
          if (result) {
            this._getSession(id);
          } else {
            sessionStorage.removeItem(id);
          }
          break;
        } else if (i === $('#usersList')[0].children.length - 1) {
          // 用户列表中无重复，新建
          $('#usersList').append('<label for="' + id + '"><li id="' + id + '">' + name + '</li></label>');
          break;
        }
      }
    }
    else if (type === 'isNewRoom') {
      name = id = nameOrId;
      $('#usersList').append('<label for="' + id + '"><li id="' + id + '">' + name + '</li></label>');
    }
    else if (type === 'isOld') {
      if (nameOrId !== 'Robot' && nameOrId.substr(0, 5) !== 'Room-') {
        name = nameOrId.substring(5);
        id = nameOrId;
      } else {
        name = id = nameOrId;
      }
      this._getSession(id);
    }
    $('li#' + id).addClass('active');
    $('.head')[0].textContent = name;
    $('.editArea').focus();
  },

  _sendMsg: function (automsg) {
    var time = new Date().toTimeString().substr(0, 5);
    var color = $('.changeColor')[0].value;
    var msg = automsg ? automsg : $('.editArea')[0].innerHTML;
    if (msg.trim().length !== 0) {
      if (msg.indexOf('天气') > -1) {
        this.socket.emit('postMsg', 'text', time, color, $('#getIP')[0].textContent, $('.head')[0].textContent);
      }
      else {
        this.socket.emit('postMsg', 'text', time, color, msg, $('.head')[0].textContent);
      }
      $('.editArea')[0].textContent = '';
      this._displayNewMsg('text', 'Me', time, color, msg);
      this._setSession('text', 'Me', time, color, msg, $('.head')[0].textContent);
    }
    else {
      alert("There is no content!");
    }
    $('.editArea')[0].focus();
  },
  _displayNewMsg: function (type, sender, time, msgAttr, msgData) {
    var box;
    if (type === 'text') {
      var color = msgAttr, msgContent = msgData;
      box = makeMsgBox('text', [sender, time, color]);
      box.children[1].innerHTML = this._showEmoji(msgContent);
    }
    else if (type === 'file') {
      var file = msgAttr, fileData = msgData;
      box = makeMsgBox('file', [sender, time, file]);
      box.children[1].download = file.name;
      box.children[1].href = fileData;

      if (file.type.indexOf("image") > -1) {
        box.children[1].innerHTML = '<img src="' + fileData + '" width="100%">';
      }
      // 非图片文件的显示内容及样式
      else {
        box.children[1].children[0].innerHTML = '<svg class="icon" aria-hidden="true"><use xlink:href="#icon-file_' + returnFileType(file.type) + '"></use></svg>';
        box.children[1].children[1].textContent = (file.name.length <= 14) ? file.name : file.name.replace(file.name.substring(14), '...');
        box.children[1].children[2].textContent = returnFileSize(file.size);
      }
    }
    //使得当内容超出容器高度时，滚动条能随着消息更新而下滑。
    box.parentNode.scrollTop = box.parentNode.scrollHeight;
  },
  _getSession: function (userid) {
    var datas = JSON.parse(sessionStorage.getItem(userid));
    if (datas !== null) {
      for (var i = 0; i < datas.length; i++) {
        var data = datas[i];
        this._displayNewMsg(data.type, data.sender, data.time, data.msgAttr, data.msgData);
      }
    }
  },
  _setSession: function (type, sender, time, msgAttr, msgData, toOrFromWhom) {
    var key = toOrFromWhom, data = { "type": type, "sender": sender, "time": time, "msgAttr": msgAttr, "msgData": msgData };
    if (toOrFromWhom !== 'Robot' && toOrFromWhom.substr(0, 5) !== 'Room-') {
      key = "User_" + toOrFromWhom;
    }
    var value = JSON.parse(sessionStorage.getItem(key));
    // 若session中不含此key，则先初始化为数组
    if (value instanceof Array === false) { value = []; }
    // 将data对象push进value数组中
    value.push(data);
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  //BEGIN showEmoji
  _showEmoji: function (msg) {
    var msgStr = msg, svgHTML;
    while (msgStr.indexOf("[#icon-emoji-") > -1) {
      var startIndex = msgStr.indexOf("[#icon-emoji-");
      var emoji = msgStr.substr(startIndex, 16);     //提取[#icon-emoji-$]
      var emojiNum = emoji.substr(-3, 2);            //提取emoji编号$
      //判断尾数是否符合emojis中的代号
      if (Number(emojiNum) > 0 && Number(emojiNum) <= 30) {
        svgHTML = '<svg class="icon" aria-hidden="true"><use xlink:href="#icon-emoji-' + emojiNum + '"></use></svg>';
        msg = msg.replace(emoji, svgHTML);
        msgStr = msgStr.substring(startIndex + 16);
      }
      else {
        msgStr = msgStr.substring(startIndex + 13);
      }
    }
    return msg;
  },
  // END showEmoji
}

function returnFileType(type) {
  if (type.indexOf("video") > -1) {
    return "video";
  } else if (type.indexOf("audio") > -1) {
    return "audio";
  } else if (type.indexOf("word") > -1) {
    return "word";
  } else if (type.indexOf("ppt") > -1 || type.indexOf("powerpoint") > -1 || type.indexOf("presentation") > -1) {
    return "ppt";
  } else if (type.indexOf("xls") > -1 || type.indexOf("excel") > -1 || type.indexOf("sheet") > -1) {
    return "excel";
  } else if (type.indexOf("pdf") > -1) {
    return "pdf";
  } else if (type.indexOf("text") > -1) {
    return "txt";
  } else if (type.indexOf("zip") > -1) {
    return "rar";
  }
  else {
    return "default";
  }
}
function returnFileSize(size) {
  if (size < 1024) {
    return size + 'B';
  } else if (size > 1024 && size < 1048576) {
    return (size / 1024).toFixed(1) + 'K';
  } else if (size > 1048576) {
    return (size / 1048576).toFixed(1) + 'M';
  }
}
function makeMsgBox(msgType, args) {
  var container = $('.messageBox')[0],
    msgToDisplay = document.createElement('div'),
    msgSender = document.createElement('p');

  // 文本消息
  if (msgType === "text") {
    msgContent = document.createElement('pre');
    msgContent.classList.add('msgContent');
    msgToDisplay.classList.add('msgToDisplay');
    msgToDisplay.style.color = args[2] || "#000";
  }
  // 文件消息
  else {
    msgContent = document.createElement('a');
    msgContent.classList.add('fileContent', 'clearfix');
    msgToDisplay.classList.add('fileToDisplay');
    msgContent.setAttribute('href', '');
    msgContent.setAttribute('download', '');
    if (args[2].type.indexOf("image") > -1) {
      msgContent.classList.add('imgFile');
    }
    else {
      msgContent.classList.add('otherFile');
      var fileType = document.createElement('p'),
        fileName = document.createElement('p'),
        fileSize = document.createElement('p');
      fileType.classList.add('fileType');
      fileName.classList.add('fileName');
      fileSize.classList.add('fileSize');
      msgContent.appendChild(fileType);
      msgContent.appendChild(fileName);
      msgContent.appendChild(fileSize);
    }
  }

  if (args[0] === "system") {
    msgToDisplay.style.textAlign = "center";
    msgToDisplay.style.fontSize = "12px";
    msgSender.textContent = args[1];
    msgContent.classList = "";
  }
  else {
    if (args[0] === "Me") {
      msgToDisplay.style.alignItems = "flex-end";
    }
    else {
      msgToDisplay.style.alignItems = "flex-start";
    }
    msgSender.textContent = args[0] + ' ' + args[1];
  }

  msgToDisplay.appendChild(msgSender);
  msgToDisplay.appendChild(msgContent);
  container.appendChild(msgToDisplay);

  return msgToDisplay;
}
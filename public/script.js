document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  const onlineUsersList = document.querySelector('#online-users ul');
  const messageText = document.getElementById('message-text');
  const messageContainer = document.getElementById('content');
  const sendButton = document.getElementById('send-button');
  const fileInput = document.getElementById('file-input');
  const openFileButton = document.getElementById('open-file-button');

    const defaultIcons = [
      "https://media.discordapp.net/attachments/1150435675057959003/1162258996728705104/image.png?ex=653b490a&is=6528d40a&hm=b42a99fb1279fb34cbe18b4f38b4544eb9d67ef95ab65cd34fb1da136c62b201&=&width=347&height=348",
      "https://media.discordapp.net/attachments/1150435675057959003/1162260933507301456/image.png?ex=653b4ad8&is=6528d5d8&hm=21579f5f0c70ee009e9709775b901bf2a806686015be3a04c5746d2133e3e168&=&width=347&height=348",
      "https://media.discordapp.net/attachments/1150435675057959003/1162261219936325713/image.png?ex=653b4b1c&is=6528d61c&hm=3d8988f2dad23f89b4d45b95207b65b38530a0ba72d933a64510a84b92c9e0ab&=&width=347&height=346",
      "https://media.discordapp.net/attachments/1150435675057959003/1162261254040203294/image.png?ex=653b4b24&is=6528d624&hm=ff7c264e63666e19515a87d9787af730285a41ddd5f36483de87703fda4c76cd&=&width=347&height=346",
      "https://media.discordapp.net/attachments/1150435675057959003/1162261338115018872/image.png?ex=653b4b38&is=6528d638&hm=8a83228aa59231447f7555d7e5a49b60afdd47c196eae1cfb1070b73e94b37e7&=&width=347&height=346",
      "https://media.discordapp.net/attachments/1150435675057959003/1162261443866013746/image.png?ex=653b4b51&is=6528d651&hm=b645b27ac08406a97218a47113274c27a866578356355f01910b6acd340355a3&=&width=347&height=346",
      "https://media.discordapp.net/attachments/1150435675057959003/1162261495585972404/image.png?ex=653b4b5e&is=6528d65e&hm=a126d48e2c753160e00227e73f964456e04c953bbc845e1cad4089845046819a&=&width=347&height=346"
  ];

  let user = {
    displayName: "風吹けば名無し",
    icon: defaultIcons[Math.floor(Math.random() * defaultIcons.length)],
  };

  // Prompt for username
  const enteredName = prompt("表示名を入力してください");
  if (enteredName) {
    user.displayName = enteredName;
  }

  // Handle user icon input
  let enteredIcon;
  do {
    enteredIcon = prompt("アイコンのURLを入力してください");
    if (enteredIcon) {
      const image = new Image();
      image.src = enteredIcon;
      image.onload = () => {
        user.icon = enteredIcon;
      };
      image.onerror = () => {
        alert("Invalid image address. Please try again.");
      };
    }
  } while (enteredIcon && !user.icon);

  // Emit 'setUser' event with user information
  socket.emit('setUser', user);

  // Event handler for receiving online users
  socket.on('updateOnlineUsers', (onlineUsers) => {
    onlineUsersList.innerHTML = '';
    onlineUsers.forEach((onlineUser) => {
      const listItem = document.createElement('li');
      const userIcon = onlineUser.icon ? onlineUser.icon : user.icon;
      listItem.innerHTML = `
        <img class="user-icon" src="${userIcon}">
        <span>${onlineUser.displayName}</span>`;
      onlineUsersList.appendChild(listItem);
    });
  });

  // Event handler for receiving messages
  socket.on('receiveMessage', displayMessage);

  // Event handler for loading messages from the server
  socket.on('loadMessages', (messageLog) => {
    messageLog.forEach(displayMessage);
  });

  // Event handler for sending a message
  sendButton.addEventListener('click', () => {
    const message = messageText.value.trim();
    if (message) {
      // Emit 'sendMessage' event with the message
      socket.emit('sendMessage', message);
      messageText.value = '';
    }
  });

  // Function to display a message in the chat
  function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    const urlRegex = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/g;
    const messageTextWithLinks = message.text.replace(urlRegex, (url) => {
      if (url.match(/\.(jpeg|jpg|gif|png)$/) !== null) {
        return `<a href="${url}" target="_blank" style="color: #3498db; text-decoration: underline;"><img src="${url}" style="max-width: 100%; cursor: pointer;" onclick="viewImage('${url}')"></a>`;
      } else {
        return `<a href="${url}" target="_blank" style="color: #3498db; text-decoration: underline;">${url}</a>`;
      }
    });

    messageElement.innerHTML = `
      <div class="user-info-container">
        <img class="user-icon" src="${message.icon}">
        <div class="user-name">${message.user}</div>
      </div>
      <div class="message-content">${messageTextWithLinks}</div>
    `;

    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  // Function to view an image in a new tab
  function viewImage(url) {
    window.open(url, '_blank');
  }

  // Event handler for pressing Enter to send a message
  messageText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });

  // Event handler for opening the file input
  openFileButton.addEventListener('click', () => {
    fileInput.click();
  });

  // Event handler for sending a file
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      socket.emit('sendFile', formData);
    }
  });
});

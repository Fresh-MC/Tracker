const socket = io();
const teamId = 'team1';
const senderEmail = 'user@example.com'; // Replace with real user

socket.emit('joinRoom', teamId);

const chatBox = document.getElementById('chat');
const msgInput = document.getElementById('msg');

// Receive and render new message
socket.on('newMessage', (msg) => {
  const li = document.createElement('li');
  li.textContent = msg.content;

  if (msg.senderEmail === senderEmail) {
    li.classList.add('my-message');
  } else {
    li.classList.add('their-message');
    li.textContent = `${msg.senderEmail}: ${msg.content}`;
  }

  chatBox.appendChild(li);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('onlineUsers', (userEmails) => {
  const userList = document.getElementById('userList');
  userList.innerHTML = '';
  userEmails.forEach(email => {
    const div = document.createElement('div');
    div.className = 'user online';
    div.textContent = email === senderEmail ? `${email} (You)` : email;
    userList.appendChild(div);
  });
});
const li = document.createElement('li');
const avatar = document.createElement('div');
const text = document.createElement('div');

avatar.className = 'avatar';
avatar.textContent = msg.senderEmail[0].toUpperCase();

text.className = 'msg-text';
text.textContent = msg.content;

li.className = msg.senderEmail === senderEmail ? 'my-message' : 'their-message';
li.appendChild(avatar);
li.appendChild(text);

chatBox.appendChild(li);
chatBox.scrollTop = chatBox.scrollHeight;

// Send message on button click
function sendMessage() {
  const content = msgInput.value.trim();
  if (content !== '') {
    socket.emit('sendMessage', { teamId, senderEmail, content });
    msgInput.value = '';
  }
}

// Send message on Enter key
msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
fetch('/users')
  .then(res => res.json())
  .then(users => {
    const userList = document.getElementById('userList');
    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user.name;
      userList.appendChild(li);
    });
  });

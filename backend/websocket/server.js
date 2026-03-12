// backend/websocket/server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const connections = new Map();

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.split('?')[1]);
  const token = params.get('token');
  const consultationId = params.get('consultation');

  // 验证Token逻辑（需对接你的JWT验证）
  verifyToken(token).then(user => {
    connections.set(user.id, ws);
    
    ws.on('message', message => {
      handleMessage(user, consultationId, message);
    });

    ws.on('close', () => {
      connections.delete(user.id);
    });
  });
});

function handleMessage(user, consultationId, content) {
  // 保存到数据库
  saveMessageToDB(consultationId, user.id, content);
  
  // 推送消息给另一方
  const targetUser = getTargetUser(consultationId, user.id);
  const targetWs = connections.get(targetUser.id);
  
  if (targetWs) {
    targetWs.send(JSON.stringify({
      sender_id: user.id,
      content,
      created_at: new Date()
    }));
  }
}
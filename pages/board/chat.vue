<script setup lang="ts">
// 타입 정의
interface Room {
  roomId: string;
  roomName: string;
}

interface WsMessage {
  type: 'ENTER' | 'TALK' | 'CLOSE';
  roomId: string;
  sender: string;
  message: string;
}

interface ChatMessage {
  type: 'ENTER' | 'TALK' | 'CLOSE';
  sender: string;
  message: string;
  timestamp: number;
}

interface CreateRoomResponse {
  message: string;
  roomId: string;
}

const router = useRouter();
const usernameCookie = useCookie('username');

const roomId = ref<string>('00');
const roomName = ref<string>('');
const roomList = ref<Room[]>([]);
const roomStatus = ref<'0' | '1' | '2' | '3'>('0');
const message = ref<string>('');
const messages = ref<ChatMessage[]>([]);

const roomNameRef = ref<HTMLInputElement | null>(null);
const messageRef = ref<HTMLInputElement | null>(null);
const wsRef = ref<WebSocket | null>(null);
const isConnecting = ref<boolean>(false);

const sendToWebSocket = (data: WsMessage): void => {
  if (wsRef.value?.readyState === WebSocket.OPEN) {
    wsRef.value.send(JSON.stringify(data));
  } else {
    alert('서버 연결이 끊어졌습니다.');
  }
};

const createRoom = async (): Promise<void> => {
  if (!roomName.value.trim()) {
    alert('대화방 이름을 입력하세요.');
    roomNameRef.value?.focus();
    return;
  }

  const formData = new FormData();
  formData.append('roomName', roomName.value);

  try {
    const res = await fetch('http://localhost:8080/chat/makeRoom', {
      method: 'POST',
      body: formData,
    });
    const data: CreateRoomResponse = await res.json();

    if (data.message === 'good') {
      roomList.value = [...roomList.value, { roomId: data.roomId, roomName: roomName.value }];
      roomName.value = '';
      alert('대화방이 생성되었습니다.');
    }
  } catch (e) {
    alert('대화방 생성 실패');
  }
};

const enterRoom = (): void => {
  if (roomId.value === '00') {
    alert('대화방을 선택하세요.');
    return;
  }
  if (roomStatus.value === '1') return;

  sendToWebSocket({
    type: 'ENTER',
    roomId: roomId.value,
    sender: usernameCookie.value || 'Anonymous',
    message: `${usernameCookie.value}님이 입장하셨습니다.`,
  });

  roomStatus.value = '1';
};

const exitRoom = (): void => {
  if (roomStatus.value !== '1') return;

  sendToWebSocket({
    type: 'CLOSE',
    roomId: roomId.value,
    sender: usernameCookie.value || 'Anonymous',
    message: `${usernameCookie.value}님이 방을 나가셨습니다.`,
  });

  roomStatus.value = '2';
  messages.value = [];
};

const sendMessage = (): void => {
  if (!message.value.trim()) return;

  sendToWebSocket({
    type: 'TALK',
    roomId: roomId.value,
    sender: usernameCookie.value || 'Anonymous',
    message: message.value,
  });

  message.value = '';
};

const onKeyDown = (e: KeyboardEvent): void => {
  if (e.key === 'Enter') sendMessage();
};

const goHome = (): void => {
  if (wsRef.value) {
    wsRef.value.onerror = null;
    wsRef.value.onclose = null;
    wsRef.value.close();
  }
  navigateTo('/board/list?page=1');
};

onMounted(() => {
  if (isConnecting.value || wsRef.value?.readyState === WebSocket.OPEN) {
    return;
  }

  isConnecting.value = true;
  const ws = new WebSocket('ws://localhost:4000');

  ws.onopen = () => {
    console.log('✅ WebSocket 연결 성공');
    isConnecting.value = false;
  };

  ws.onmessage = (event: MessageEvent) => {
    const data: WsMessage = JSON.parse(event.data);
    const newMessage: ChatMessage = {
      type: data.type,
      sender: data.sender,
      message: data.message,
      timestamp: Date.now(),
    };
    messages.value = [...messages.value, newMessage];
  };

  ws.onerror = (error) => {
    console.error('❌ WebSocket 에러:', error);
    isConnecting.value = false;
  };

  ws.onclose = () => {
    console.log('🔌 WebSocket 연결 종료');
    isConnecting.value = false;
  };

  wsRef.value = ws;

  // 채팅방 목록 가져오기
  fetch('http://localhost:8080/chat/rooms')
    .then(res => res.json())
    .then(data => { roomList.value = data; })
    .catch(err => console.error(err));
});

onUnmounted(() => {
  if (wsRef.value) {
    wsRef.value.onerror = null;
    wsRef.value.onclose = null;
    wsRef.value.close();
    wsRef.value = null;
  }
  isConnecting.value = false;
});
</script>

<template>
  <div class="chatMain">
    <div class="header">
      <label>채팅방</label>
    </div>

    <div class="container">
      <div class="participantRow">
        <input :value="`대화 참여자 : ${usernameCookie}`" disabled />
      </div>

      <div class="createRoomRow">
        <input
          ref="roomNameRef"
          v-model="roomName"
          placeholder="만들 대화방 이름을 입력하세요"
        />
        <button @click="createRoom">대화방 만들기</button>
      </div>

      <div class="enterRoomRow">
        <select v-model="roomId">
          <option value="00">------ 아래의 대화방을 선택하세요 ------</option>
          <option
            v-for="r in roomList"
            :key="r.roomId"
            :value="r.roomId"
          >
            {{ r.roomName }}
          </option>
        </select>
        <button @click="enterRoom">대화방 입장</button>
      </div>

      <div class="messageRow">
        <input
          ref="messageRef"
          v-model="message"
          @keydown="onKeyDown"
          :disabled="roomStatus !== '1'"
          placeholder="메세지를 입력하세요"
        />
      </div>

      <div class="buttonRow">
        <button @click="sendMessage">메세지 전송</button>
        <button @click="exitRoom">대화방 나가기</button>
        <button @click="goHome">홈으로</button>
      </div>
    </div>

    <div class="msgZone">
      <template v-for="(msg, index) in messages" :key="index">
        <div v-if="msg.type === 'ENTER'" style="text-align: left;">
          <b><span class="open">{{ msg.message }}</span></b>
        </div>
        <div
          v-else-if="msg.type === 'TALK'"
          :style="{ textAlign: msg.sender === usernameCookie ? 'right' : 'left' }"
        >
          <b>
            <span :class="msg.sender === usernameCookie ? 'hostChatting' : 'guestChatting'">
              {{ msg.sender }}: {{ msg.message }}
            </span>
          </b>
        </div>
        <div v-else-if="msg.type === 'CLOSE'" style="text-align: left;">
          <b><span class="close">{{ msg.message }}</span></b>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chatMain {
  text-align: center;
  width: 100%;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin: 20px 0;
}

.header label {
  font-size: 32px;
  font-weight: bold;
}

.container {
  width: 60%;
  margin: 0 auto;
  text-align: left;
}

.participantRow {
  margin: 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ccc;
}

.participantRow input {
  border: none;
  background: transparent;
  font-size: 14px;
  width: 100%;
  outline: none;
}

.createRoomRow {
  display: flex;
  gap: 10px;
  margin: 15px 0;
  align-items: center;
}

.createRoomRow input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.createRoomRow button {
  padding: 10px 20px;
  background-color: #17a2b8;
  color: white;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
}

.enterRoomRow {
  display: flex;
  gap: 10px;
  margin: 15px 0;
  align-items: center;
}

.enterRoomRow select {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.enterRoomRow button {
  padding: 10px 20px;
  background-color: #17a2b8;
  color: white;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
}

.messageRow {
  margin: 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ccc;
}

.messageRow input {
  border: none;
  background: transparent;
  font-size: 14px;
  width: 100%;
  outline: none;
}

.buttonRow {
  display: flex;
  gap: 0;
  margin: 20px 0;
}

.buttonRow button {
  flex: 1;
  padding: 15px;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
}

.buttonRow button:nth-child(1) {
  background-color: #dc3545;
}

.buttonRow button:nth-child(2) {
  background-color: #17a2b8;
}

.buttonRow button:nth-child(3) {
  background-color: #45b817;
}

.msgZone {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  background-color: #d3d3d3;
  padding: 20px;
  border: 2px solid #000;
  margin: 30px auto;
  width: 60%;
}

.open {
  color: #2196F3;
  font-style: italic;
}

.hostChatting {
  background-color: #DCF8C6;
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
  max-width: 70%;
}

.guestChatting {
  background-color: #FFFFFF;
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
  max-width: 70%;
  border: 1px solid #ddd;
}

.close {
  color: #f44336;
  font-style: italic;
}
</style>
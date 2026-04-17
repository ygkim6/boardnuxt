<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
// 타입 정의
interface ApiResponse {
  message: string;
}

//nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const IDSearchResultStyle = {
  width: '80%',
  height: 'auto',
  padding: '20px, 20px',
  backgroundColor: '#FFFFFF',
  textAlign: 'center' as const,
  border: '5px',
  borderRadius: '30px',
};

const username = ref<string>('');
const usernameRef = ref<HTMLInputElement | null>(null);
const telno = ref<string>('');
const telnoRef = ref<HTMLInputElement | null>(null);
const IDSearchResult = ref<string>('');
const router = useRouter();

const IDSearchCheck = async (): Promise<void> => {
  if (!usernameRef.value?.value) {
    alert('이름을 입력하세요.');
    usernameRef.value?.focus();
    return;
  }
  if (!telnoRef.value?.value) {
    alert('전화번호를 입력하세요.');
    telnoRef.value?.focus();
    return;
  }

  const formData = new FormData();
  formData.append('username', usernameRef.value.value);
  formData.append('telno', telnoRef.value.value);

  try {
    const response = await fetch(`${apiUrl}/member/searchID`, {
      method: 'POST',
      body: formData,
    });
    const data: ApiResponse = await response.json();
    
    if (data.message !== 'ID_NOT_FOUND') {
      IDSearchResult.value = '<br/><br/><h1>아이디 : ' + data.message + '</h1>';
    } else {
      alert('해당 조건에 맞는 아이디가 존재하지 않습니다.');
    }
  } catch (error) {
    console.log(error);
  }
};

const press = (e: KeyboardEvent): void => {
  if (e.keyCode === 13) {
    IDSearchCheck();
  }
};

const goHome = (): void => {
  router.back();
};
</script>

<template>
  <div class="main">
    <div class="ModifyForm">
      <br />
      <h1>아이디 찾기</h1>
      <br />
      <div class="IDSearchFormDivision">
        <input
          type="text"
          class="input_field"
          v-model="username"
          ref="usernameRef"
          placeholder="이름을 입력하세요."
        />
        <input
          type="text"
          class="input_field"
          v-model="telno"
          ref="telnoRef"
          @keydown="press"
          placeholder="전화번호를 입력하세요."
        />
        <input
          type="button"
          class="btn_write"
          value="아이디 찾기"
          @click="IDSearchCheck"
        />
        <input
          type="button"
          class="btn_cancel"
          value="홈으로"
          @click="goHome"
        />
      </div>
      <br /><br />
    </div>
    <div v-html="IDSearchResult" :style="IDSearchResultStyle"></div>
  </div>
</template>
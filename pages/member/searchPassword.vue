<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
// 타입 정의
interface ApiResponse {
  status: string;
  password?: string;
}

//nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const temporalPasswordStyle = {
  width: '70%',
  height: 'auto',
  padding: '20px, 20px',
  backgroundColor: '#FFFFFF',
  textAlign: 'center' as const,
  border: '5px',
  borderRadius: '30px',
};

const email = ref<string>('');
const emailRef = ref<HTMLInputElement | null>(null);
const telno = ref<string>('');
const telnoRef = ref<HTMLInputElement | null>(null);
const temporalPassword = ref<string>('');
const router = useRouter();

const pwSearchCheck = async (): Promise<void> => {
  if (!emailRef.value?.value) {
    alert('아이디를 입력하세요.');
    emailRef.value?.focus();
    return;
  }
  if (!telnoRef.value?.value) {
    alert('전화번호를 입력하세요.');
    telnoRef.value?.focus();
    return;
  }

  const formData = new FormData();
  formData.append('email', emailRef.value.value);
  formData.append('telno', telnoRef.value.value);

  try {
    const response = await fetch(`${apiUrl}/member/searchPassword`, {
      method: 'POST',
      body: formData,
    });
    const data: ApiResponse = await response.json();
    
    if (data.status === 'good') {
      temporalPassword.value = '<br><br><h1>임시패스워드 : ' + data.password + '</h1>';
    } else if (data.status === 'ID_NOT_FOUND') {
      alert('해당 아이디를 가진 사용자가 없습니다.');
    } else if (data.status === 'TELNO_NOT_FOUND') {
      alert('전화번호 입력이 잘못 되었습니다.');
    }
  } catch (error) {
    console.log(error);
  }
};

const press = (e: KeyboardEvent): void => {
  if (e.keyCode === 13) {
    pwSearchCheck();
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
      <h1>임시 패스워드 발급</h1>
      <br />
      <div>
        <input
          type="text"
          class="input_field"
          v-model="email"
          ref="emailRef"
          placeholder="아이디를 입력하세요."
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
          value="임시 패스워드 발급"
          @click="pwSearchCheck"
        />
        <input
          type="button"
          class="btn_cancel"
          value="홈으로"
          @click="goHome"
        />
      </div>
      <div v-html="temporalPassword" :style="temporalPasswordStyle"></div>
    </div>
  </div>
</template>
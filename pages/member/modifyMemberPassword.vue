<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
interface ApiResponse {
  message: string;
}

//nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const emailCookie = useCookie('email');
const old_password = ref<string>('');
const new_password = ref<string>('');
const new_password1 = ref<string>('');
const old_passwordRef = ref<HTMLInputElement | null>(null);
const new_passwordRef = ref<HTMLInputElement | null>(null);
const new_password1Ref = ref<HTMLInputElement | null>(null);
const msg = ref<string>('');
const router = useRouter();

const passwordUpdate = async (): Promise<void> => {
  if (!old_passwordRef.value?.value) {
    alert('기존 패스워드를 입력하세요.');
    old_passwordRef.value?.focus();
    return;
  }
  
  const Pass = new_passwordRef.value?.value || '';
  const Pass1 = new_password1Ref.value?.value || '';
  
  if (Pass === '') {
    alert('신규 패스워드를 입력하세요.');
    new_passwordRef.value?.focus();
    return;
  }
  if (Pass1 === '') {
    alert('신규 패스워드를 입력하세요.');
    new_password1Ref.value?.focus();
    return;
  }
  if (Pass !== Pass1) {
    alert('입력된 신규패스워드를 확인하세요');
    new_password1Ref.value?.focus();
    return;
  }

  // 패스워드 조건 검사
  const num = Pass.search(/[0-9]/g);
  const eng = Pass.search(/[a-z]/gi);
  const spe = Pass.search(/[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi);
  
  if (Pass.length < 8 || Pass.length > 20) {
    alert('암호는 8자리 ~ 20자리 이내로 입력해주세요.');
    return;
  } else if (Pass.search(/\s/) !== -1) {
    alert('암호는 공백 없이 입력해주세요.');
    return;
  } else if (num < 0 || eng < 0 || spe < 0) {
    alert('암호는 영문,숫자,특수문자를 혼합하여 입력해주세요.');
    return;
  }

  const formData = new FormData();
  formData.append('email', emailCookie.value || '');
  formData.append('old_password', old_passwordRef.value?.value || '');
  formData.append('new_password', new_passwordRef.value?.value || '');

  try {
    const response = await fetch(`${apiUrl}/member/modifyMemberPassword`, {
      method: 'POST',
      body: formData,
    });
    const data: ApiResponse = await response.json();
    
    if (data.message === 'good') {
      alert('패스워드가 변경되었습니다.');
      logout();
    } else if (data.message === 'PASSWORD_NOT_FOUND') {
      msg.value = '잘못된 패스워드를 입력했습니다.';
    } else {
      alert('시스템 장애로 패스워드 변경이 실패 했습니다.');
    }
  } catch (error) {
    console.log(error);
  }
};

const logout = (): void => {
  const authkey = useCookie('authkey');
  const userid = useCookie('userid');
  const password = useCookie('password');
  
  if (authkey.value !== undefined) {
    authkey.value = null;
  }
  if (userid.value !== undefined) {
    userid.value = null;
  }
  if (password.value !== undefined) {
    password.value = null;
  }
  
  navigateTo('/');
};

const goBack = (): void => {
  router.back();
};
</script>

<template>
  <div class="main">
    <br /><br />
    <div class="ModifyForm">
      <br />
      <h1>패스워드 변경</h1>
      <input
        type="password"
        v-model="old_password"
        ref="old_passwordRef"
        class="input_field"
        placeholder="기존 패스워드를 입력하세요"
      />
      <br />
      <p style="color: red; text-align: center;">{{ msg }}</p>
      <br />
      <input
        type="password"
        v-model="new_password"
        ref="new_passwordRef"
        class="input_field"
        placeholder="신규 패스워드를 입력하세요"
      />
      <p style="color: red; text-align: center;">
        ※ 8~20이내의 영문자, 숫자, 특수문자 조합으로 암호를 만들어 주세요.
      </p>
      <br />
      <input
        type="password"
        v-model="new_password1"
        ref="new_password1Ref"
        class="input_field"
        placeholder="신규 패스워드를 한번 더 입력하세요"
      />
      <br />
      <input
        type="button"
        class="btn_write"
        value="패스워드 변경"
        @click="passwordUpdate"
      />
      <input
        type="button"
        class="btn_cancel"
        value="취소"
        @click="goBack"
      />
    </div>
  </div>
</template>
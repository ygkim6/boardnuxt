<template>
  <ClientOnly>
    <br/><br/><br/>
    <img
          class="topBanner"
          width="500"
          src="/React_Next_JWT.png"
          alt="JWT"
        />

    <br />
    <div class="main">
      <div class="LoginForm">
        <br />       

        <input
          type="text"
          ref="emailRef"
          v-model="email"
          class="input_field"
          placeholder="이메일을 입력하세요."
        />

        <input
          type="password"
          ref="passwordRef"
          v-model="password"
          class="input_field"
          placeholder="비밀번호를 입력하세요."
          @keydown.enter="loginCheck"
        />

        <p style="color:red; text-align:center">{{ message }}</p>

        <br />

        <input type="checkbox" ref="rememberEmailRef" @change="checkRememberEmail" />
        이메일 기억 &nbsp;&nbsp;

        <input type="checkbox" ref="rememberPasswordRef" @change="checkRememberPassword" />
        패스워드 기억 &nbsp;&nbsp;

        <input type="checkbox" ref="rememberMeRef" @change="checkRememberMe" />
        자동 로그인 &nbsp;&nbsp;

        | 타계정 로그인 [
        <a href="http://localhost:8080/oauth2/authorization/google">구글</a> |
        <a href="http://127.0.0.1:8080/oauth2/authorization/naver">네이버</a>
        ]

        <br /><br />

        <input
          type="button"
          class="btn_login"
          value="로그인"
          @click="loginCheck"
        />

        <div className="bottomText">
          사용자가 아니면 ▶
          <NuxtLink to="/member/signup">여기</NuxtLink>
          <br /><br />
          [
          <NuxtLink to="/member/searchID">아이디</NuxtLink> |
          <NuxtLink to="/member/searchPassword">패스워드</NuxtLink> 찾기
          ]
          <br /><br />
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from 'nuxt/app';

const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

/* CryptoJS는 client에서만 import */
let CryptoJS: any = null

interface LoginResponse {
  message: string
  username?: string
  role?: string
  authkey?: string
  accessToken?: string
  refreshToken?: string
}

const router = useRouter()

const email = ref('')
const password = ref('')
const message = ref('')

const emailRef = ref<HTMLInputElement | null>(null)
const passwordRef = ref<HTMLInputElement | null>(null)
const rememberEmailRef = ref<HTMLInputElement | null>(null)
const rememberPasswordRef = ref<HTMLInputElement | null>(null)
const rememberMeRef = ref<HTMLInputElement | null>(null)

const secretKey = 'secretKey'

// cookie 조작 함수 만듬

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=Tue, 31 Dec 2030 23:59:59 GMT`
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0`
}

// 초기화

onMounted(async () => {
  CryptoJS = (await import('crypto-js')).default
  await checkBoxConfirm()
})

//체크박스 클릭했을때 

const checkBoxConfirm = async () => {
  const emailCookie = getCookie('email')
  const passwordCookie = getCookie('password')
  const authkeyCookie = getCookie('authkey')

  if (emailCookie) {
    email.value = emailCookie
    rememberEmailRef.value!.checked = true
  }

  if (passwordCookie && CryptoJS) {
    const bytes = CryptoJS.AES.decrypt(passwordCookie, secretKey)
    password.value = bytes.toString(CryptoJS.enc.Utf8)
    rememberPasswordRef.value!.checked = true
  }

  if (authkeyCookie) {
    const formData = new FormData()
    formData.append('authkey', authkeyCookie)
    formData.append('autoLogin', 'PASS')

    const data = await fetch(`${apiUrl}/member/loginCheck`, {
      method: 'POST',
      body: formData
    }).then(r => r.json())

    if (data.message === 'good') {
      router.push('/board/list?page=1')
    }
  }
}

/* ---------------- checkbox control ---------------- */

const checkRememberEmail = (e: Event) => {
  if ((e.target as HTMLInputElement).checked) {
    rememberMeRef.value!.checked = false
  }
}

const checkRememberPassword = (e: Event) => {
  if ((e.target as HTMLInputElement).checked) {
    rememberMeRef.value!.checked = false
  }
}

const checkRememberMe = (e: Event) => {
  if ((e.target as HTMLInputElement).checked) {
    rememberEmailRef.value!.checked = false
    rememberPasswordRef.value!.checked = false
  }
}

/* ---------------- cookie save ---------------- */

const cookieManage = (
  username: string,
  role: string,
  authkey: string,
  accessToken: string,
  refreshToken: string
) => {
  if (rememberPasswordRef.value?.checked && CryptoJS) {
    const encrypted = CryptoJS.AES.encrypt(password.value, secretKey).toString()
    setCookie('password', encrypted)
  } else {
    deleteCookie('password')
  }

  if (rememberMeRef.value?.checked) {
    setCookie('authkey', authkey)
    setCookie('email', email.value)
  } else {
    deleteCookie('authkey')
  }

  setCookie('accessToken', accessToken)
  setCookie('refreshToken', refreshToken)
  setCookie('email', email.value)
  setCookie('username', decodeURIComponent(username))
  setCookie('role', role)
  setCookie('FromSocial', 'N')
}

/* ---------------- login ---------------- */

const loginCheck = async () => {
  if (!email.value || !password.value) {
    alert('아이디와 패스워드를 입력하세요.')
    return
  }

  const formData = new FormData()
  formData.append('email', email.value)
  formData.append('password', password.value)
  formData.append('autoLogin', 'NEW')

  console.log(`apiUrl = ${apiUrl}`)
  const data: LoginResponse = await fetch(
    `${apiUrl}/member/loginCheck`,
    { method: 'POST', body: formData }
  ).then(response => response.json())

  if (
    data.message === 'good' &&
    data.username &&
    data.authkey &&
    data.accessToken &&
    data.refreshToken
  ) {
    cookieManage(
      data.username,
      data.role || 'USER',
      data.authkey,
      data.accessToken,
      data.refreshToken
    )
    router.push('/board/list?page=1')
  } else if (data.message === 'ID_NOT_FOUND') {
    message.value = '존재하지 않는 이메일입니다.'
  } else if (data.message === 'PASSWORD_NOT_FOUND') {
    message.value = '잘못된 패스워드입니다.'
  }
}
</script>

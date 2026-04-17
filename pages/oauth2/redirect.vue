<script setup lang="ts">
import { useCookie } from 'nuxt/app'
import { onMounted } from 'vue'

const router = useRouter()
const route = useRoute()

onMounted(() => {
  const accessToken = route.query.accessToken as string | undefined
  const refreshToken = route.query.refreshToken as string | undefined
  const email = route.query.email as string | undefined
  const username = route.query.username as string | undefined
  const role = route.query.role as string | undefined
  const FromSocial = route.query.FromSocial as string | undefined

  if (accessToken && refreshToken && email) {
    // 쿠키 저장
    //document.cookie = `accessToken=${accessToken}; path=/; expires=Tue, 31 Dec 2030 23:59:59 GMT`
    useCookie('accessToken', { expires: new Date('2030-12-31') }).value = accessToken
    document.cookie = `refreshToken=${refreshToken}; path=/; expires=Tue, 31 Dec 2030 23:59:59 GMT`
    document.cookie = `email=${email}; path=/; expires=Tue, 31 Dec 2030 23:59:59 GMT`
    document.cookie = `username=${decodeURIComponent(username ?? '')}; path=/; expires=Tue, 31 Dec 2030 23:59:59 GMT`
    document.cookie = `role=${role ?? ''}; path=/; expires=Tue, 31 Dec 2030 23:59:59 GMT`
    document.cookie = `FromSocial=${FromSocial ?? ''}; path=/; expires=Tue, 31 Dec 2030 23:59:59 GMT`

    console.log('OAuth2 쿠키 저장 완료:', { email, role, FromSocial })

    // 깔끔한 URL로 이동
    router.replace('/board/list?page=1')
  } else {
    alert('OAuth2 로그인 정보가 올바르지 않습니다.')
    router.replace('/')
  }
})
</script>

<template>
  <div style="text-align: center; margin-top: 100px;">
    <h3>소셜 로그인 처리 중...</h3>
    <p>잠시만 기다려주세요.</p>
  </div>
</template>

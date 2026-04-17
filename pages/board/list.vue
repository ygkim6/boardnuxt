<template>
  <div class="tableDiv">
    <h1>게시물 목록 보기 (Nuxt 3)</h1>
    <br />

    <input
      style="width:40%; height:30px; border:2px solid #168; font-size:16px"
      type="text"
      v-model="keyword"
      @keydown.enter="search"
      placeholder="검색할 제목, 작성자이름 및 내용을 입력해 주세요"
    />
    <input
      style="width:5%; height:30px; background:#158; color:white; font-weight:bold; cursor:pointer"
      type="button"
      value="검색"
      @click="search"
    />

    <br /><br />

    <table class="InfoTable">
      <thead>
        <tr>
          <th>번호</th>
          <th>제목</th>
          <th>작성자</th>
          <th>작성일</th>
          <th>조회수</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in list" :key="item.seqno">
          <td>{{ getRowNumber(index) }}</td>
          <td>
            <NuxtLink
              :to="`/board/view?seqno=${item.seqno}&page=${page}&keyword=${keyword}`"
              style="text-decoration:none; cursor:pointer"
            >
              {{ item.title }}
            </NuxtLink>
          </td>
          <td>{{ item.writer }}</td>
          <td>{{ formatDate(item.regdate) }}</td>
          <td>{{ item.hitno }}</td>
        </tr>
      </tbody>
    </table>

    <br />

    <!-- 페이지네이션 -->
    <div class="pagination">
      <button class="page-btn" :disabled="page === 1" @click="goToPage(1)">&#171;</button>
      <button class="page-btn" :disabled="page === 1" @click="goToPage(page - 1)">&#8249;</button>

      <button
        v-for="p in visiblePages"
        :key="p"
        class="page-btn"
        :class="{ active: p === page }"
        @click="goToPage(p)"
      >
        {{ p }}
      </button>

      <button class="page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)">&#8250;</button>
      <button class="page-btn" :disabled="page === totalPages" @click="goToPage(totalPages)">&#187;</button>

      <span class="page-info">{{ page }} / {{ totalPages }} 페이지 &nbsp; (총 {{ totalCount }}건)</span>
    </div>

    <br />

    <div class="bottom_menu">
      <NuxtLink :to="{ path: '/board/list', query: { page: 1 } }">처음으로</NuxtLink>&nbsp;&nbsp;
      <NuxtLink to="/board/write">글쓰기</NuxtLink>&nbsp;&nbsp;
      <NuxtLink to="/board/chat">채팅 하기</NuxtLink>&nbsp;&nbsp;
      <NuxtLink v-if="cookies.FromSocial === 'Y'" to="/member/oauth2Signup">사용자관리</NuxtLink>
      <NuxtLink v-if="cookies.FromSocial === 'N'" to="/member/viewMemberInfo">사용자관리</NuxtLink>
      &nbsp;&nbsp;
      <NuxtLink v-if="cookies.role === 'MASTER'" to="/master/sysmanage">시스템관리</NuxtLink>
      &nbsp;&nbsp;
      <a href="#" @click.prevent="logout">로그아웃</a>
    </div>
    <br /><br />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  key: route => route.fullPath
})

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCookie, useRuntimeConfig } from 'nuxt/app'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const route = useRoute()
const router = useRouter()

const list = ref<any[]>([])
const totalCount = ref<number>(0)
const postNum = ref<number>(0)
const page = ref<number>(Number(route.query.page) || 1)
const keyword = ref<string>(String(route.query.keyword || ''))

const emailCookie = useCookie<string | null>('email')
const usernameCookie = useCookie<string | null>('username')
const roleCookie = useCookie<string | null>('role')
const fromSocialCookie = useCookie<string | null>('FromSocial')
const accessTokenCookie = useCookie<string | null>('accessToken')

const cookies = reactive({
  email: emailCookie.value || '',
  username: usernameCookie.value || '',
  role: roleCookie.value || '',
  FromSocial: fromSocialCookie.value || '',
  accessToken: accessTokenCookie.value || ''
})

const totalPages = computed(() => {
  if (!totalCount.value || !postNum.value) return 1
  return Math.ceil(totalCount.value / postNum.value)
})

const visiblePages = computed(() => {
  const groupSize = 5
  const currentGroup = Math.ceil(page.value / groupSize)
  const start = (currentGroup - 1) * groupSize + 1
  const end = Math.min(start + groupSize - 1, totalPages.value)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const getRowNumber = (index: number): string | number => {
  if (!totalCount.value || !postNum.value) return ''
  return totalCount.value - (page.value - 1) * postNum.value - index
}

const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getList = async (): Promise<void> => {
  if (!cookies.accessToken) return
  try {
    const response = await $fetch(
      `${apiUrl}/board/list?page=${page.value}&keyword=${keyword.value}`,
      { method: 'GET', headers: { Authorization: `Bearer ${cookies.accessToken}` } }
    )
    let data = response
    if (typeof response === 'string') data = JSON.parse(response)
    list.value = (data as any).content || []
  } catch (error) {
    console.error(error)
  }
}

const getPageList = async (): Promise<void> => {
  if (!cookies.accessToken) return
  try {
    const response: any = await $fetch(
      `${apiUrl}/board/pagelist?page=${page.value}&keyword=${keyword.value}`,
      { method: 'GET', headers: { Authorization: `Bearer ${cookies.accessToken}` } }
    )
    let data = response
    if (typeof response === 'string') data = JSON.parse(response)
    totalCount.value = Number(data.totalCount) || 0
    postNum.value = Number(data.postNum) || 0
  } catch (error) {
    console.error(error)
  }
}

// URL 변경 --> definePageMeta가 감지 --> 컴포넌트 재마운트 --> onMounted 실행
const search = (): void => {
  router.push({ path: '/board/list', query: { page: 1, keyword: keyword.value } })
}

const goToPage = (p: number): void => {
  if (p < 1 || p > totalPages.value || p === page.value) return
  router.push({ path: '/board/list', query: { page: p, keyword: keyword.value } })
}

const logout = async (): Promise<void> => {
  try {
    await $fetch(`${apiUrl}/member/logout?email=${cookies.email}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cookies.accessToken}` }
    })
    alert('로그아웃합니다.')
    emailCookie.value = null
    usernameCookie.value = null
    roleCookie.value = null
    fromSocialCookie.value = null
    accessTokenCookie.value = null
    useCookie('authkey').value = null
    useCookie('password').value = null
    useCookie('refreshToken').value = null
    router.push('/')
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  dayjs.locale('ko')
  if (cookies.accessToken) {
    await getPageList()
    await getList()
  }
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #ccc;
  background: #fff;
  color: #333;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #168;
  color: #fff;
  border-color: #168;
}

.page-btn.active {
  background: #168;
  color: #fff;
  border-color: #168;
  font-weight: bold;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.page-info {
  margin-left: 12px;
  font-size: 13px;
  color: #666;
}
</style>
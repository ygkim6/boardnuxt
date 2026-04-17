<template>
  <div>
    <div class="main">
      <h1>게시물 내용 보기</h1>
      <br />
      <div class="boardView">
        <div class="field">이름 : {{ writer }}</div>
        <div class="field">제목 : {{ title }}</div>
        <div class="field">날짜 : {{ formatDate(regdate) }}</div>
        <div class="content">
          <pre>{{ content }}</pre>
        </div>
        <div class="likeForm" style="width:30%; height:auto; margin:auto; cursor:pointer">
          <span>{{ likeCnt || 0 }}</span>&nbsp;
          <span @click="likeView" class="likeClick" :style="likeStyle">좋아요</span>
          <span @click="disLikeView" class="dislikeClick" :style="dislikeStyle">싫어요</span>&nbsp;
          <span>{{ dislikeCnt || 0 }}</span><br />
          <span style="text-align:center; color:red">{{ myChoice }}</span>
        </div>
        <div v-if="fileView && fileView.length > 0">
          <div v-for="f in fileView" :key="f.fileseqno" class="field">
            파일명 : {{ f.org_filename }} ({{ f.filesize }}) Bytes
            <input type="button" value="다운로드" @click="fileDownload(f.fileseqno)" />
          </div>
        </div>
        <div v-else class="field">업로드된 파일이 없습니다.</div>
        <br /><br /><br />
      </div>
      <br />
      <div class="bottom_menu">
        <NuxtLink v-if="pre_seqno !== '0'" 
          :to="{ path: '/board/view', query: { seqno: pre_seqno, page: page, keyword: keyword } }" >
          이전글▼
        </NuxtLink>
        &nbsp;&nbsp;
        <NuxtLink :to="`/board/list?page=${page}&keyword=${keyword}`">목록보기</NuxtLink>
        &nbsp;&nbsp;
        <NuxtLink v-if="next_seqno !== '0'"
          :to="{ path: '/board/view', query: { seqno: next_seqno, page: page, keyword: keyword } }">
          다음글▲
        </NuxtLink>
        &nbsp;&nbsp;
        <NuxtLink to="/board/write">글 작성</NuxtLink>
        &nbsp;&nbsp;
        <NuxtLink v-if="cookies.email === email" :to="`/board/modify?seqno=${seqno}&page=${page}&keyword=${keyword}`">글 수정</NuxtLink>
        &nbsp;&nbsp;
        <NuxtLink v-if="cookies.email === email" :to="`/board/delete?seqno=${seqno}`">글 삭제</NuxtLink>
      </div>
      <br />
      <div class="replyDiv" style="width:60%; height:300px; margin:auto; text-align:left">
        <p id="replyNotice">댓글을 작성해 주세요</p>
        <form id="replyForm" name="replyForm" method="POST">
          작성자 : <input type="text" :value="replywriter" readonly /><br />
          <textarea
            ref="replyContentRef"
            v-model="replycontentRegister"
            cols="80"
            rows="5"
            maxlength="150"
            placeholder="글자수:150자 이내"
          /><br />
        </form>
        <input type="button" id="btn_reply" value="댓글등록" @click="replyRegister" />
        <input type="button" id="btn_cancel" value="취소" @click="replyCancel" />
        <br /><br /><hr /><br />
        <div v-for="reply in replyListView" :key="reply.replyseqno">
          <div v-if="replyseqno !== reply.replyseqno" :style="replyListStyle">
            작성자: {{ reply.replywriter }} {{ formatDate(reply.replyregdate) }}
            <span v-if="reply.email === cookies.email">
              [
              <span @click="replyModifyClick(reply.replyseqno)" style="text-decoration:underline; cursor:pointer">수정</span> |
              <span @click="replyDelete(reply.replyseqno)" style="text-decoration:underline; cursor:pointer">삭제</span>
              ]
            </span>
            <div style="width:90%; height:auto; border-top:1px solid gray; overflow:auto">
              <pre>{{ reply.replycontent }}</pre>
            </div>
            <br />
          </div>
          <div v-if="replyseqno === reply.replyseqno" :style="replyModifyStyle">
            작성자 : {{ cookies.username }}
            <input type="button" value="수정" @click="replyModify(reply.replyseqno)" />
            <input type="button" value="취소" @click="replyModifyCancel" />
            <br />
            <textarea 
              cols="80" 
              rows="5" 
              maxlength="150" 
              placeholder="글자수:150자 이내" 
              :value="reply.replycontent"
              @input="handleContent"
            />
            <br />
          </div>
        </div>
        <br /><br />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
//Nuxt 3가 페이지 컴포넌트에 부여하는 고유 식별자
//기본적으로 Nuxt는 같은 페이지(/board/view)로 이동할 때 컴포넌트를 재사용. 
//query가 바뀌어도 같은 컴포넌트라고 판단하기 때문에 onMounted가 다시 실행되지 않음.
//key: route => route.fullPath 를 주면:
//  /board/view?seqno=1  →  key = "/board/view?seqno=1"
//  /board/view?seqno=2  →  key = "/board/view?seqno=2"  ← 다른 key = 새 컴포넌트
//URL이 바뀔 때마다 다른 컴포넌트로 인식해서 완전히 새로 마운트함. 
//결과적으로 onMounted가 자동으로 다시 실행
definePageMeta({
  key: route => route.fullPath
})

import { useRuntimeConfig } from 'nuxt/app';
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCookie } from 'nuxt/app'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

// 타입 정의
interface BoardViewData {
  email: {
    email: string
  }
  writer: string
  title: string
  regdate: string
  content: string
  likecnt: number
  dislikecnt: number
}

interface Reply {
  replyseqno: number
  email: string
  replywriter: string
  replycontent: string
  replyregdate: string
}

interface FileItem {
  fileseqno: number
  org_filename: string
  filesize: number
}

interface LikeCheckData {
  myLikeCheck: string
  myDislikeCheck: string
}

interface LikeResponse {
  likeCnt: number
  dislikeCnt: number
}

dayjs.locale('ko')

const route = useRoute()

//nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

// 쿠키
const emailCookie = useCookie<string | null>('email')
const usernameCookie = useCookie<string | null>('username')
const accessTokenCookie = useCookie<string | null>('accessToken')

const cookies = reactive({
  email: emailCookie.value || '',
  username: usernameCookie.value || '',
  accessToken: accessTokenCookie.value || ''
})

// URL 파라미터
const seqno = String(route.query.seqno || '')
const page = String(route.query.page || '1')
const keyword = String(route.query.keyword || '')

// 상태
const email = ref<string>('')
const emailRef = ref<string>('')
const writer = ref<string>('')
const title = ref<string>('')
const regdate = ref<string>('')
const content = ref<string>('')

const replyListView = ref<Reply[]>([])
const replyseqno = ref<number>(0)
const replywriter = ref<string>(cookies.username)
const replycontentRegister = ref<string>('')
const replycontent = ref<string>('')
const replyContentRef = ref<HTMLTextAreaElement | null>(null)
const replyListStyle = ref({ fontSize: '0.8em', display: 'block' })
const replyModifyStyle = ref({ fontSize: '0.8em', display: 'none' })

const likeCnt = ref<number>(0)
const dislikeCnt = ref<number>(0)
const myLikeCheckRef = ref<string>('N')
const myDislikeCheckRef = ref<string>('N')
const checkCnt = ref<string>('')
const likeStyle = ref({})
const dislikeStyle = ref({})
const myChoice = ref<string>('')

const pre_seqno = ref<string>('0')
const next_seqno = ref<string>('0')
const fileView = ref<FileItem[]>([])

const hitnoIncreased = ref<boolean>(false)

// 날짜 포맷
const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 좋아요/싫어요 서버 전송
const sendDataToServer = async (): Promise<void> => {
  const formData = new FormData()
  formData.append('seqno', seqno)
  formData.append('email', cookies.email)
  formData.append('myLikecheck', myLikeCheckRef.value)
  formData.append('myDislikecheck', myDislikeCheckRef.value)
  formData.append('checkCnt', checkCnt.value)

  try {
    const response = await fetch(`${apiUrl}/board/likeCheck`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cookies.accessToken}` },
      body: formData
    })
    const data: LikeResponse = await response.json()
    likeCnt.value = data.likeCnt
    dislikeCnt.value = data.dislikeCnt
  } catch (error) {
    console.error(error)
  }
}

// 좋아요
const likeView = (): void => {
  if (myLikeCheckRef.value === 'Y' && myDislikeCheckRef.value === 'N') {
    alert('좋아요를 취소합니다.')
    checkCnt.value = '1'
    myLikeCheckRef.value = 'N'
    sendDataToServer()
    likeStyle.value = { backgroundColor: '#d2d2d2' }
  } else if (myLikeCheckRef.value === 'N' && myDislikeCheckRef.value === 'Y') {
    alert('싫어요가 취소되고 좋아요가 등록됩니다.')
    checkCnt.value = '2'
    myLikeCheckRef.value = 'Y'
    myDislikeCheckRef.value = 'N'
    sendDataToServer()
    likeStyle.value = { backgroundColor: '#00B9FF' }
    dislikeStyle.value = { backgroundColor: '#d2d2d2' }
  } else if (myLikeCheckRef.value === 'N' && myDislikeCheckRef.value === 'N') {
    alert('좋아요를 선택 했습니다.')
    checkCnt.value = '3'
    myLikeCheckRef.value = 'Y'
    sendDataToServer()
    likeStyle.value = { backgroundColor: '#00B9FF' }
  }

  if (myLikeCheckRef.value === 'Y') myChoice.value = `${cookies.username}님의 선택은 좋아요입니다.`
  else if (myDislikeCheckRef.value === 'Y') myChoice.value = `${cookies.username}님의 선택은 싫어요입니다.`
  else myChoice.value = `${cookies.username}님은 아직 선택을 안 했네요`
}

// 싫어요
const disLikeView = (): void => {
  if (myDislikeCheckRef.value === 'Y' && myLikeCheckRef.value === 'N') {
    alert('싫어요를 취소합니다.')
    checkCnt.value = '4'
    myDislikeCheckRef.value = 'N'
    sendDataToServer()
    dislikeStyle.value = { backgroundColor: '#d2d2d2' }
  } else if (myDislikeCheckRef.value === 'N' && myLikeCheckRef.value === 'Y') {
    alert('좋아요가 취소되고 싫어요가 등록됩니다.')
    checkCnt.value = '5'
    myLikeCheckRef.value = 'N'
    myDislikeCheckRef.value = 'Y'
    sendDataToServer()
    likeStyle.value = { backgroundColor: '#d2d2d2' }
    dislikeStyle.value = { backgroundColor: '#00B9FF' }
  } else if (myDislikeCheckRef.value === 'N' && myLikeCheckRef.value === 'N') {
    alert('싫어요를 선택했습니다.')
    checkCnt.value = '6'
    myDislikeCheckRef.value = 'Y'
    sendDataToServer()
    dislikeStyle.value = { backgroundColor: '#00B9FF' }
  }

  if (myLikeCheckRef.value === 'Y') myChoice.value = `${cookies.username}님의 선택은 좋아요입니다.`
  else if (myDislikeCheckRef.value === 'Y') myChoice.value = `${cookies.username}님의 선택은 싫어요입니다.`
  else myChoice.value = `${cookies.username}님은 아직 선택을 안 했네요`
}

// 댓글 목록
const replyStartPage = async (): Promise<void> => {
  const formData = new FormData()
  formData.append('seqno', seqno)

  try {
    const response = await fetch(`${apiUrl}/board/reply?option=L`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cookies.accessToken}` },
      body: formData
    })
    const data: Reply[] = await response.json()
    replyListView.value = data
  } catch (error) {
    console.error('error = ', error)
    alert('시스템 장애로 댓글 가져 오기가 실패했습니다.')
  }
}

// 댓글 등록
const replyRegister = async (): Promise<void> => {
  if (!replyContentRef.value?.value) {
    alert('댓글을 입력하세요.')
    replyContentRef.value?.focus()
    return
  }

  const formData = new FormData()
  formData.append('seqno', seqno)
  formData.append('email', cookies.email)
  formData.append('replywriter', replywriter.value)
  formData.append('replycontent', replycontentRegister.value)

  try {
    const response = await fetch(`${apiUrl}/board/reply?option=I`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cookies.accessToken}` },
      body: formData
    })
    const data: Reply[] = await response.json()
    replyListView.value = data
    replycontentRegister.value = ''
  } catch (error) {
    console.error('error = ', error)
    alert('시스템 장애로 댓글 등록이 실패했습니다.')
  }
}

// 댓글 취소
const replyCancel = (): void => {
  if (window.confirm('정말로 취소 하시겠습니까?')) {
    if (replyContentRef.value) {
      replyContentRef.value.value = ''
      replyContentRef.value.focus()
    }
    replycontentRegister.value = ''
  }
}

// 댓글 삭제
const replyDelete = async (replyseqnoParam: number): Promise<void> => {
  if (window.confirm('정말로 삭제하시겠습니까?')) {
    replyListView.value = replyListView.value.filter((reply) => reply.replyseqno !== replyseqnoParam)

    const formData = new FormData()
    formData.append('replyseqno', String(replyseqnoParam))
    try {
      await fetch(`${apiUrl}/board/reply?option=D`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cookies.accessToken}` },
        body: formData
      })
    } catch (error) {
      console.error('error = ', error)
      alert('시스템 장애로 댓글 삭제가 실패했습니다.')
    }
  }
}

// 댓글 수정 클릭
const replyModifyClick = (replyseqnoParam: number): void => {
  replyseqno.value = replyseqnoParam
  replyListStyle.value = { fontSize: '0.8em', display: 'block' }
  replyModifyStyle.value = { fontSize: '0.8em', display: 'block' }
}

// 댓글 내용 변경
const handleContent = (e: Event): void => {
  const target = e.target as HTMLTextAreaElement
  replycontent.value = target.value
}

// 댓글 수정
const replyModify = async (replyseqnoParam: number): Promise<void> => {
  const formData = new FormData()
  formData.append('replyseqno', String(replyseqnoParam))
  formData.append('replywriter', cookies.username)
  formData.append('replycontent', replycontent.value)

  try {
    await fetch(`${apiUrl}/board/reply?option=U`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cookies.accessToken}` },
      body: formData
    })
    replyseqno.value = 0
    replyListStyle.value = { fontSize: '0.8em', display: 'block' }
    replyModifyStyle.value = { fontSize: '0.8em', display: 'none' }
    replyStartPage()
  } catch (error) {
    console.error('error = ', error)
    alert('시스템 장애로 댓글 수정이 실패했습니다.')
  }
}

// 댓글 수정 취소
const replyModifyCancel = (): void => {
  replyseqno.value = 0
  replyListStyle.value = { fontSize: '0.8em', display: 'block' }
  replyModifyStyle.value = { fontSize: '0.8em', display: 'none' }
}

// 파일 다운로드
const fileDownload = (fileseqno: number): void => {
  window.location.href = `${apiUrl}/member/filedownload?fileseqno=` + fileseqno
}

// 초기 데이터 로드
onMounted(async () => {
  if (hitnoIncreased.value) return
  
  try {
    const boardResponse = await fetch(
      `${apiUrl}/board/view?seqno=${seqno}&email=${cookies.email}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cookies.accessToken}` }
      }
    )
    const boardData: BoardViewData = await boardResponse.json()
    email.value = boardData.email.email
    emailRef.value = boardData.email.email
    writer.value = boardData.writer
    title.value = boardData.title
    regdate.value = boardData.regdate
    content.value = boardData.content
    likeCnt.value = boardData.likecnt
    dislikeCnt.value = boardData.dislikecnt

    const preResponse = await fetch(
      `${apiUrl}/board/preseqno?seqno=${seqno}&keyword=${keyword}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cookies.accessToken}` }
      }
    )
    const preData = await preResponse.text()
    pre_seqno.value = preData

    const nextResponse = await fetch(
      `${apiUrl}/board/nextseqno?seqno=${seqno}&keyword=${keyword}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cookies.accessToken}` }
      }
    )
    const nextData = await nextResponse.text()
    next_seqno.value = nextData

    const fileResponse = await fetch(
      `${apiUrl}/board/fileView?seqno=${seqno}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cookies.accessToken}` }
      }
    )
    const fileData: FileItem[] = await fileResponse.json()
    fileView.value = fileData

    const likeResponse = await fetch(
      `${apiUrl}/board/likeCheckView?seqno=${seqno}&email=${cookies.email}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cookies.accessToken}` }
      }
    )
    const likeData: LikeCheckData = await likeResponse.json()
    myLikeCheckRef.value = likeData.myLikeCheck || 'N'
    myDislikeCheckRef.value = likeData.myDislikeCheck || 'N'

    if (myLikeCheckRef.value === 'Y') likeStyle.value = { backgroundColor: '#00B9FF' }
    if (myDislikeCheckRef.value === 'Y') dislikeStyle.value = { backgroundColor: '#00B9FF' }

    if (myLikeCheckRef.value === 'Y') myChoice.value = `${cookies.username}님의 선택은 좋아요입니다.`
    else if (myDislikeCheckRef.value === 'Y') myChoice.value = `${cookies.username}님의 선택은 싫어요입니다.`
    else myChoice.value = `${cookies.username}님은 아직 선택을 안 했네요`

    // 조회수 증가
    if (cookies.email !== boardData.email.email && !hitnoIncreased.value) {
      hitnoIncreased.value = true
      await fetch(`${apiUrl}/board/hitnoPlus?seqno=${seqno}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${cookies.accessToken}` }
      })
    }
  } catch (error) {
    console.error('데이터 로딩 에러:', error)
  }

  if (seqno && cookies.accessToken) {
    replyStartPage()
  }
})
</script>

<style scoped>
</style>
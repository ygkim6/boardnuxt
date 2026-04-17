<template>
  <div class="main">
    <div class="WriteForm">
      <br />
      <h1>게시물 등록</h1>
      <br />
      <input
        type="text"
        class="input_field"
        :value="cookies.username"
        readonly
      />
      <input
        type="text"
        class="input_field"
        v-model="title"
        ref="titleRef"
        placeholder="여기에 제목을 입력하세요"
      />
      <textarea
        class="content"
        v-model="content"
        ref="contentRef"
        cols="100"
        rows="500"
        name="content"
        placeholder="여기에 내용을 입력하세요"
      />

      <div class="fileuploadForm">
        <input
          type="file"
          ref="fileEventRef"
          style="display: none"
          @change="fileEventChange"
          multiple
        />
        <div
          class="fileZone"
          ref="fileZoneRef"
          :style="fileZoneStyle"
          @click="fileZoneClick"
          @dragenter="fileZoneDragEnter"
          @dragover="fileZoneDragOver"
          @drop="fileZoneDrop"
        >
          파일 첨부를 하기 위해서는 클릭하거나 여기로 파일을 드래그 하세요.
          <br />
          첨부파일은 최대 5개까지 등록이 가능합니다.
        </div>
        <div class="fileUploadList">
          <div
            v-for="statusbar in statusbarState"
            :key="statusbar.filenum"
            :class="statusbar.row"
            v-show="statusbar.filename"
          >
            <div class="filename">{{ statusbar.filename }}</div>
            <div class="filesize">{{ statusbar.filesize }}</div>
            <div
              class="b_delete"
              @click="fileDelete(statusbar.filenum!)"
            >
              삭제
            </div>
          </div>
        </div>
      </div>
      <input
        type="button"
        class="btn_write"
        value="등록"
        @click="handleRegister"
      />
      <input
        type="button"
        class="btn_cancel"
        value="취소"
        @click="goBack"
      />
      <input type="hidden" value="I" ref="kindRef" />
    </div>
    <br />
    <br />
    <br />
  </div>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCookie } from 'nuxt/app'

// 타입 정의
interface FileStatus {
  filenum?: number
  filename?: string
  filesize?: string
  row?: string
}

interface CustomFile extends File {
  is_delete?: boolean
}

const router = useRouter()

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

// 상태
const title = ref<string>('')
const content = ref<string>('')
const statusbarState = ref<FileStatus[]>([{}])
const fileZoneStyle = ref<any>({})

// Ref
const titleRef = ref<HTMLInputElement | null>(null)
const contentRef = ref<HTMLTextAreaElement | null>(null)
const kindRef = ref<HTMLInputElement | null>(null)
const fileEventRef = ref<HTMLInputElement | null>(null)
const fileZoneRef = ref<HTMLDivElement | null>(null)

// 파일 업로드 관련 Ref
const fileCount = ref<number>(0)
const uploadCountLimit = ref<number>(5)
const rowCount = ref<number>(0)
const fileNum = ref<number>(0)
const content_files = ref<CustomFile[]>([])

// 파일존 클릭
const fileZoneClick = (e: MouseEvent): void => {
  fileEventRef.value?.click()
}

// 드래그 엔터
const fileZoneDragEnter = (e: DragEvent): void => {
  e.stopPropagation()
  e.preventDefault()
  fileZoneStyle.value = { border: '2px solid #0B85A1' }
}

// 드래그 오버
const fileZoneDragOver = (e: DragEvent): void => {
  e.stopPropagation()
  e.preventDefault()
}

// 드롭
const fileZoneDrop = (e: DragEvent): void => {
  e.stopPropagation()
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files) {
    fileEvent(files)
  }
}

// 파일 선택
const fileEventChange = (e: Event): void => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files) {
    fileEvent(files)
  }
}

// 파일 처리
const fileEvent = (files: FileList): void => {
  const filesArr: File[] = Array.from(files)

  // 파일 개수 확인
  if (fileCount.value + filesArr.length > uploadCountLimit.value) {
    alert(`파일은 최대 ${uploadCountLimit.value}개까지 업로드 할 수 있습니다.`)
    return
  } else {
    fileCount.value = fileCount.value + filesArr.length
  }

  const statusbar: FileStatus[] = [{}]

  filesArr.forEach((file) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    content_files.value.push(file as CustomFile)

    // 파일 사이즈 제한
    if (file.size > 1073741824) {
      alert('파일 사이즈는 1GB를 초과할수 없습니다.')
      return
    }

    // 홀수/짝수 행
    rowCount.value = rowCount.value + 1
    let row = 'odd'
    if (rowCount.value % 2 === 0) row = 'even'

    const filename = file.name

    // 파일 사이즈 계산
    let sizeStr = ''
    const sizeKB = file.size / 1024
    if (parseInt(String(sizeKB)) > 1024) {
      const sizeMB = sizeKB / 1024
      sizeStr = sizeMB.toFixed(2) + ' MB'
    } else {
      sizeStr = sizeKB.toFixed(2) + ' KB'
    }
    const filesize = sizeStr

    statusbar.push({
      filenum: fileNum.value,
      filename,
      filesize,
      row: 'statusbar ' + row
    })

    fileNum.value = fileNum.value + 1
  })

  // 파일 정보 누적
  const nextStatusbar = statusbarState.value.concat(statusbar)
  statusbarState.value = nextStatusbar

  // 파일 이벤트 초기화
  if (fileEventRef.value) {
    fileEventRef.value.value = ''
  }
}

// 파일 삭제
const fileDelete = (fileNumParam: number): void => {
  if (content_files.value[fileNumParam]) {
    content_files.value[fileNumParam].is_delete = true
  }

  const deleteStatusbar = statusbarState.value.filter(
    (statusbar) => statusbar.filenum !== fileNumParam
  )
  statusbarState.value = deleteStatusbar
  fileCount.value--
}

// 등록
const handleRegister = async (): Promise<void> => {
  if (!titleRef.value?.value) {
    alert('제목을 입력하세요!!!')
    titleRef.value?.focus()
    return
  }
  if (!contentRef.value?.value) {
    alert('내용을 입력하세요!!!')
    contentRef.value?.focus()
    return
  }

  const formData = new FormData()
  formData.append('email', cookies.email)
  formData.append('writer', cookies.username)
  formData.append('title', titleRef.value.value)
  formData.append('content', contentRef.value.value)
  formData.append('kind', kindRef.value?.value || 'I')

  for (let i = 0; i < content_files.value.length; i++) {
    if (!content_files.value[i].is_delete) {
      formData.append('sendToFileList', content_files.value[i])
    }
  }

  try {
    await fetch(`${apiUrl}/board/write`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cookies.accessToken}` },
      body: formData
    })
    alert('게시물이 등록되었습니다.')
    router.push('/board/list?page=1')
  } catch (error) {
    alert('시스템 장애로 게시물 등록이 실패했습니다.')
    console.log('error = ', error)
  }
}

// 취소
const goBack = (): void => {
  router.back()
}
</script>

<style scoped>
</style>
<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
// 타입 정의
interface FileStatus {
  filenum?: number;
  filename?: string;
  filesize?: string;
  row?: string;
}

interface CustomFile extends File {
  is_delete?: boolean;
}

interface FileViewItem {
  fileseqno: number;
  org_filename: string;
  filesize: number;
}

interface BoardData {
  title: string;
  content: string;
}
//nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

// 쿠키 설정
const emailCookie = useCookie('email');
const usernameCookie = useCookie('username');
const accessTokenCookie = useCookie('accessToken');

// state 및 ref 설정
const title = ref<string>('');
const content = ref<string>('');
const statusbarState = ref<FileStatus[]>([{}]);
const fileZoneStyle = ref<Record<string, string>>({});
const fileView = ref<FileViewItem[]>([]);
const deleteFileList = ref<number[]>([]);

const titleRef = ref<HTMLInputElement | null>(null);
const contentRef = ref<HTMLTextAreaElement | null>(null);
const fileEventRef = ref<HTMLInputElement | null>(null);
const fileZoneRef = ref<HTMLDivElement | null>(null);

// 파일 업로드에 필요한 Ref
const fileCount = ref<number>(0);
const uploadCountLimit = ref<number>(5);
const rowCount = ref<number>(0);
const fileNum = ref<number>(0);
const content_files = ref<CustomFile[]>([]);

// 인자로 전달 받은 값들
const route = useRoute();
const router = useRouter();

const page = computed(() => (route.query.page as string) || '1');
const seqno = computed(() => (route.query.seqno as string) || '');
const keyword = computed(() => (route.query.keyword as string) || '');

// 파일 추가 등록
const fileZoneClick = (e: MouseEvent): void => {
  fileEventRef.value?.click();
};

const fileZoneDragEnter = (e: DragEvent): void => {
  e.stopPropagation();
  e.preventDefault();
  fileZoneStyle.value = { border: '2px solid #0B85A1' };
};

const fileZoneDragOver = (e: DragEvent): void => {
  e.stopPropagation();
  e.preventDefault();
};

const fileZoneDrop = (e: DragEvent): void => {
  e.stopPropagation();
  e.preventDefault();
  const files = (e as DragEvent).dataTransfer?.files;
  if (files) {
    fileEvent(files);
  }
};

const fileEventChange = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files) {
    fileEvent(files);
  }
};

const fileEvent = (files: FileList): void => {
  // 스트링으로 입력된 Raw 형태의 파일들을 배열로 변환
  const filesArr: File[] = Array.from(files);

  // 파일 개수 확인 및 제한
  if (fileCount.value + filesArr.length > uploadCountLimit.value) {
    alert(`파일은 최대 ${uploadCountLimit.value}개까지 업로드 할 수 있습니다.`);
    return;
  } else {
    fileCount.value = fileCount.value + filesArr.length;
  }

  // 파일 정보 보관용 객체
  const statusbar: FileStatus[] = [{}];

  // Raw 형태의 파일 배열을 읽어서 파일 형태로 변환 후 파일 정보를 추출하여 저장
  filesArr.forEach((file) => {
    const reader = new FileReader();

    // 파일 읽기
    reader.readAsDataURL(file);
    // 최종 파일리스트가 저장
    content_files.value.push(file as CustomFile);

    // 파일 사이즈 제한
    if (file.size > 1073741824) {
      alert('파일 사이즈는 1GB를 초과할수 없습니다.');
      return;
    }

    // 파일 리스트 출력시 홀수행 색깔 지정
    rowCount.value = rowCount.value + 1;
    let row = 'odd';
    if (rowCount.value % 2 === 0) row = 'even';

    // 파일명
    const filename = file.name;

    // 파일 사이즈
    let sizeStr = '';
    const sizeKB = file.size / 1024;
    if (parseInt(String(sizeKB)) > 1024) {
      const sizeMB = sizeKB / 1024;
      sizeStr = sizeMB.toFixed(2) + ' MB';
    } else {
      sizeStr = sizeKB.toFixed(2) + ' KB';
    }
    const filesize = sizeStr;

    // 파일 정보를 파일 보관용 객체에 추가
    statusbar.push({
      filenum: fileNum.value,
      filename,
      filesize,
      row: 'statusbar ' + row,
    });

    // 파일 정보 목록 키값 증가
    fileNum.value = fileNum.value + 1;
  });

  // statusbarState에 파일 정보 누적
  const nextStatusbar = statusbarState.value.concat(statusbar);
  statusbarState.value = nextStatusbar;

  // 파일 이벤트 초기화
  if (fileEventRef.value) {
    fileEventRef.value.value = '';
  }
};

// 파일 목록에서 삭제 버튼 클릭시 파일 목록 삭제
const fileDelete = (fileNumValue: number): void => {
  // 자바스크립트 배열의 속성인 is_delete에 true 입력
  if (content_files.value[fileNumValue]) {
    content_files.value[fileNumValue].is_delete = true;
  }

  // 인자로 받은 파일 리스트 키값과 저장된 파일 리스트 키값을 비교해서 같지 않은 파일 목록만 추출
  const deleteStatusbar = statusbarState.value.filter(
    (statusbar) => statusbar.filenum !== fileNumValue
  );
  // 추출한 파일 목록을 다시 저장
  statusbarState.value = deleteStatusbar;
  fileCount.value--;
};

// 제목 저장
const handleTitle = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  title.value = target.value;
};

// 내용 저장
const handleContent = (e: Event): void => {
  const target = e.target as HTMLTextAreaElement;
  content.value = target.value;
};

// 파일 삭제 리스트 관리
const handleFileList = (isChecked: boolean, fileseqno: number): void => {
  if (isChecked) {
    deleteFileList.value = [...deleteFileList.value, fileseqno];
  } else {
    deleteFileList.value = deleteFileList.value.filter((e) => e !== fileseqno);
  }
};

// 게시물 수정
const handleModify = async (): Promise<void> => {
  if (!titleRef.value?.value) {
    alert('제목을 입력하세요!!!');
    titleRef.value?.focus();
    return;
  }
  if (!contentRef.value?.value) {
    alert('내용을 입력하세요!!!');
    contentRef.value?.focus();
    return;
  }

  const formData = new FormData();
  for (let x = 0; x < content_files.value.length; x++) {
    if (!content_files.value[x].is_delete) {
      formData.append('sendToFileList', content_files.value[x]);
    }
  }

  formData.append('seqno', seqno.value);
  formData.append('email', emailCookie.value || '');
  formData.append('writer', usernameCookie.value || '');
  formData.append('title', title.value);
  formData.append('content', content.value);
  formData.append('page', page.value);
  formData.append('keyword', keyword.value);
  formData.append('kind', 'U');
  formData.append('deleteFileList', deleteFileList.value.join(','));

  try {
    await fetch(`${apiUrl}/board/write`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessTokenCookie.value}` },
      body: formData,
    });
    alert('게시물이 수정되었습니다.');
    await navigateTo(`/board/view?seqno=${seqno.value}&page=${page.value}&keyword=${keyword.value}`);
  } catch (error) {
    alert('시스템 장애로 게시물 수정이 실패했습니다.');
    console.error('error = ', error);
  }
};

// 수정 취소
const goBack = (): void => {
  router.back();
};

// 첫번째 렌더링 시 게시물 정보 가져 오기
onMounted(async () => {
  // 권한 체크
  if (!emailCookie.value) {
    await navigateTo('/');
    return;
  }

  if (!seqno.value || !accessTokenCookie.value) return;

  try {
    // 게시물 상세 가져오기
    const boardResponse = await fetch(
      `${apiUrl}/board/view?seqno=${seqno.value}&email=${emailCookie.value}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessTokenCookie.value}` },
      }
    );
    const boardData: BoardData = await boardResponse.json();
    title.value = boardData.title;
    content.value = boardData.content;

    // 업로드된 파일 목록 보기
    const fileResponse = await fetch(
      `${apiUrl}/board/fileView?seqno=${seqno.value}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessTokenCookie.value}` },
      }
    );
    const fileData: FileViewItem[] = await fileResponse.json();
    fileView.value = fileData;
  } catch (error) {
    console.error('데이터 로딩 에러:', error);
  }
});
</script>

<template>
  <div>
    <div class="main">
      <h1>게시물 수정</h1>
      <div class="FormDiv">
        <form class="ModifyForm" method="POST">
          <br />
          <input
            type="text"
            class="input_field"
            :value="usernameCookie || ''"
            readonly
          />
          <input
            type="text"
            class="input_field"
            ref="titleRef"
            :value="title"
            @input="handleTitle"
          />
          <textarea
            class="content"
            :cols="100"
            :rows="500"
            ref="contentRef"
            :value="content"
            @input="handleContent"
          />
          <div
            v-for="file in fileView"
            :key="file.fileseqno"
          >
            <p style="text-align: left;">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 삭제 :
              <input
                type="checkbox"
                :value="file.fileseqno"
                @change="(e) => handleFileList((e.target as HTMLInputElement).checked, file.fileseqno)"
              />
              {{ file.org_filename }}( {{ file.filesize }} Byte)
              <br />
            </p>
          </div>
          <div class="fileuploadForm">
            <input
              type="file"
              ref="fileEventRef"
              style="display: none;"
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
              >
                <template v-if="statusbar.filename">
                  <div class="filename">{{ statusbar.filename }}</div>
                  <div class="filesize">{{ statusbar.filesize }}</div>
                  <div
                    class="b_delete"
                    @click="() => fileDelete(statusbar.filenum!)"
                  >
                    삭제
                  </div>
                </template>
              </div>
            </div>
          </div>
          <input
            type="button"
            class="btn_write"
            value="수정"
            @click="handleModify"
          />
          <input
            type="button"
            class="btn_cancel"
            value="취소"
            @click="goBack"
          />
        </form>
      </div>
    </div>
    <br />
    <br />
    <br />
  </div>
</template>
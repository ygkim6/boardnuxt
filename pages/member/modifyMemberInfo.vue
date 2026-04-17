<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';

// 타입 정의
interface MemberData {
  username: string;
  gender: string;
  hobby: string;
  job: string;
  zipcode: string;
  address: string;
  telno: string;
  nickname: string;
  description: string;
  org_filename: string;
  stored_filename: string;
  filesize: number;
}

interface AddressMessage {
  zipcode: string;
  addr1: string;
}

interface ApiResponse {
  status: string;
}

//nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

// 스타일 정의
const imageZone = {
  border: '2px solid #92AAB0',
  width: '70%',
  height: 'auto',
  color: '#92AAB0',
  textAlign: 'center' as const,
  verticalAlign: 'middle' as const,
  margin: 'auto',
  padding: '10px 10px',
  fontSize: '200%',
};

const addrSearchStyle = {
  width: '80%',
  border: 'none',
  borderBottom: '2px solid #adadad',
  margin: '5px',
  padding: '10px 10px',
  outline: 'none',
  color: '#636e72',
  fontSize: '16px',
  height: '25px',
  background: 'none',
};

// 쿠키 가져오기
const emailCookie = useCookie('email');
const accessTokenCookie = useCookie('accessToken');

// 사용자 정보
const username = ref<string>('');
const gender = ref<string>('');
const zipcode = ref<string>('');
const addr1 = ref<string>('');
const addr2 = ref<string>('');
const checkItems = ref<string[]>([]);
const job = ref<string>('');
const telno = ref<string>('');
const nickname = ref<string>('');
const description = ref<string>('');
const org_filename = ref<string>('');
const stored_filename = ref<string>('');
const filesize = ref<number>(0);

// Refs
const zipcodeRef = ref<HTMLInputElement | null>(null);
const addr1Ref = ref<HTMLInputElement | null>(null);
const addr2Ref = ref<HTMLInputElement | null>(null);
const addrSearchRef = ref<HTMLInputElement | null>(null);
const jobRef = ref<HTMLSelectElement | null>(null);
const telnoRef = ref<HTMLInputElement | null>(null);
const nicknameRef = ref<HTMLInputElement | null>(null);
const descriptionRef = ref<HTMLTextAreaElement | null>(null);
const imgZoneRef = ref<HTMLDivElement | null>(null);
const fileEventRef = ref<HTMLInputElement | null>(null);

const router = useRouter();

// 이미지 저장용 state
const imgProfile = ref<File | null>(null);

// 이미지 미리 보기
const imgFile = ref<string>('');

// 프로필 이미지 URL
const profileImageUrl = computed(() => 
  emailCookie.value 
    ? `${apiUrl}/member/viewProfile/${emailCookie.value}` 
    : ''
);

const imgZoneClick = (e: MouseEvent): void => {
  fileEventRef.value?.click();
};

const fileEventChange = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files && files[0]) {
    showImage(files[0]);
    imgProfile.value = files[0];
  }
};

const showImage = (file: File): void => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    imgFile.value = reader.result as string;
  };
};

// 주소 검색 및 등록
const searchAddr = (): void => {
  if (!addrSearchRef.value?.value) {
    alert('검색할 주소를 입력하세요.');
    addrSearchRef.value?.focus();
    return;
  }

  window.open(
    '/member/searchAddress?page=1&addrSearch=' + addrSearchRef.value.value,
    '주소검색',
    'width=900, height=540, top=50, left=50'
  );
};

// 체크박스 선택
const handleSingleCheck = (checked: boolean, title: string): void => {
  if (checked) {
    checkItems.value = [...checkItems.value, title];
  } else {
    checkItems.value = checkItems.value.filter((el) => el !== title);
  }
};

const handleZipcode = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  zipcode.value = target.value;
};

const handleAddr1 = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  addr1.value = target.value;
};

const handleAddr2 = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  addr2.value = target.value;
};

const handleTelno = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  telno.value = target.value;
};

const handleNickname = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  nickname.value = target.value;
};

const handleDescription = (e: Event): void => {
  const target = e.target as HTMLTextAreaElement;
  description.value = target.value;
};

const goBack = (): void => {
  router.back();
};

const handleModification = async (): Promise<void> => {
  if (!gender.value) {
    alert('성별을 선택하세요.');
    return;
  }
  if (checkItems.value.length === 0) {
    alert('취미를 선택하세요.');
    return;
  }
  if (jobRef.value?.value === 'description') {
    alert('직업을 선택하세요.');
    return;
  }

  if (!telnoRef.value?.value) {
    alert('전화번호를 입력하세요.');
    telnoRef.value?.focus();
    return;
  }
  const beforeTelno = telnoRef.value.value;
  const afterTelno = beforeTelno.replace(/-/gi, '').replace(/ /gi, '').trim();
  if (telnoRef.value) {
    telnoRef.value.value = afterTelno;
  }

  if (!nicknameRef.value?.value) {
    alert('별명을 입력하세요.');
    nicknameRef.value?.focus();
    return;
  }
  if (!descriptionRef.value?.value) {
    alert('자기소개를 입력하세요.');
    descriptionRef.value?.focus();
    return;
  }

  const formData = new FormData();
  formData.append('email', emailCookie.value || '');
  formData.append('username', username.value);
  formData.append('gender', gender.value);
  formData.append('hobby', checkItems.value.toString());
  formData.append('job', jobRef.value?.value || '');
  formData.append('zipcode', zipcodeRef.value?.value || '');
  formData.append(
    'address',
    (addr1Ref.value?.value || '') + ' ' + (addr2Ref.value?.value || '')
  );
  formData.append('telno', telnoRef.value?.value || '');
  formData.append('description', descriptionRef.value?.value || '');
  formData.append('nickname', nicknameRef.value?.value || '');
  if (imgProfile.value) {
    formData.append('imgProfile', imgProfile.value);
  }
  formData.append('org_filename', org_filename.value);
  formData.append('stored_filename', stored_filename.value);
  formData.append('filesize', String(filesize.value));
  formData.append('FromSocial', 'N');
  formData.append('kind', 'U');

  try {
    const response = await fetch(`${apiUrl}/member/signup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessTokenCookie.value}` },
      body: formData,
    });
    const data: ApiResponse = await response.json();
    if (data.status === 'good') {
      alert('회원 정보가 수정되었습니다.');
      await navigateTo('/member/viewMemberInfo');
    } else {
      alert('서버 장애로 회원 정보 수정에 실패했습니다.');
    }
  } catch (error) {
    console.error('회원정보 수정 에러:', error);
    alert('서버 장애로 회원 정보 수정에 실패했습니다.');
  }
};

onMounted(async () => {
  if (!emailCookie.value || !accessTokenCookie.value) return;

  try {
    const response = await fetch(
      `${apiUrl}/board/memberInfo?&email=${emailCookie.value}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessTokenCookie.value}` },
      }
    );
    const data: MemberData = await response.json();
    username.value = data.username;
    gender.value = data.gender;
    checkItems.value = data.hobby.split(',');
    job.value = data.job;
    zipcode.value = data.zipcode;
    addr1.value = data.address;
    telno.value = data.telno;
    nickname.value = data.nickname;
    description.value = data.description;
    org_filename.value = data.org_filename;
    stored_filename.value = data.stored_filename;
    filesize.value = data.filesize;
  } catch (error) {
    console.error(error);
  }

  // 주소 검색 팝업으로부터 메시지 수신
  const handleMessage = (e: MessageEvent<AddressMessage>) => {
    if (e.data.zipcode && e.data.addr1) {
      zipcode.value = e.data.zipcode;
      addr1.value = e.data.addr1;
    }
  };

  window.addEventListener('message', handleMessage);

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
  });
});
</script>

<template>
  <div>
    <div class="main">
      <h1>회원 기본 정보 수정</h1>
      <br />

      <div class="WriteForm">
        <br />
        <br />
        <input
          type="file"
          ref="fileEventRef"
          @change="fileEventChange"
          style="display: none;"
        />
        <span>이미지 수정을 원하시면 화면을 클릭해 주세요.</span>
        <div
          class="imageZone"
          :style="imageZone"
          ref="imgZoneRef"
          @click="imgZoneClick"
        >
          <img
            v-if="imgFile"
            :src="imgFile"
            alt="회원 프로파일"
            style="width: 350px; height: auto;"
          />
          <img
            v-else-if="emailCookie"
            :src="profileImageUrl"
            alt="회원 프로파일"
            style="width: 350px; height: auto;"
          />
        </div>
        <input type="text" class="input_field" :value="username" readonly />
        <div
          style="width: 90%; text-align: left; position: relative; left: 35px; border-bottom: 2px solid #adadad; margin: 10px; padding: 10px;"
        >
          성별 : &nbsp;
          <label>
            <input
              type="radio"
              name="gender"
              value="남성"
              :checked="gender === '남성'"
              @change="(e) => gender = (e.target as HTMLInputElement).value"
            />
            남성
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="여성"
              :checked="gender === '여성'"
              @change="(e) => gender = (e.target as HTMLInputElement).value"
            />
            여성
          </label>
          <br />
          취미 : &nbsp;
          <input
            type="checkbox"
            value="음악감상"
            :checked="checkItems.includes('음악감상')"
            @change="(e) => handleSingleCheck((e.target as HTMLInputElement).checked, '음악감상')"
          />
          <label>음악감상</label>
          <input
            type="checkbox"
            value="영화보기"
            :checked="checkItems.includes('영화보기')"
            @change="(e) => handleSingleCheck((e.target as HTMLInputElement).checked, '영화보기')"
          />
          <label>영화보기</label>
          <input
            type="checkbox"
            value="스포츠"
            :checked="checkItems.includes('스포츠')"
            @change="(e) => handleSingleCheck((e.target as HTMLInputElement).checked, '스포츠')"
          />
          <label>스포츠</label>
          <br />
          직업 : &nbsp;
          <select @change="(e) => job = (e.target as HTMLSelectElement).value" :value="job" ref="jobRef">
            <option value="회사원">회사원</option>
            <option value="공무원">공무원</option>
            <option value="자영업">자영업</option>
          </select>
          <br />
        </div>
        <input
          type="text"
          ref="addrSearchRef"
          class="addrSearch"
          :style="addrSearchStyle"
          placeholder="변경할 주소를 검색합니다."
        />
        <input type="button" class="btn_addrSearch" value="주소검색" @click="searchAddr" />
        <br />
        <input
          type="text"
          class="input_field"
          ref="zipcodeRef"
          :value="zipcode"
          @input="handleZipcode"
          readonly
        />
        <input
          type="text"
          class="input_field"
          ref="addr1Ref"
          :value="addr1"
          @input="handleAddr1"
          readonly
        />
        <input
          type="text"
          class="input_field"
          ref="addr2Ref"
          :value="addr2"
          @input="handleAddr2"
          placeholder="상세 주소를 입력하세요"
        />
        <input
          type="text"
          class="input_field"
          ref="telnoRef"
          :value="telno"
          @input="handleTelno"
        />
        <input
          type="text"
          class="input_field"
          ref="nicknameRef"
          :value="nickname"
          @input="handleNickname"
        />

        <br />
        <textarea
          class="input_content"
          :cols="100"
          :rows="500"
          ref="descriptionRef"
          :value="description"
          @input="handleDescription"
        />
        <br />
        <input
          type="button"
          class="btn_modify"
          value="수정"
          @click="handleModification"
        />
        <input type="button" class="btn_cancel" value="취소" @click="goBack" />
      </div>
    </div>
  </div>
</template>
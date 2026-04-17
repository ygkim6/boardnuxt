<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
// 타입 정의
interface HobbyData {
  id: number;
  title: string;
}

interface AddressMessage {
  zipcode: string;
  addr1: string;
}

interface ApiResponse {
  status: string;
  username?: string;
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

const email = ref<string>('');
const emailRef = ref<HTMLInputElement | null>(null);
const message = ref<string>('');

const emailChange = async (e: Event): Promise<void> => {
  const target = e.target as HTMLInputElement;
  email.value = target.value;
  
  const formData = new FormData();
  formData.append('email', emailRef.value?.value || '');

  try {
    const response = await fetch('http://localhost:8080/member/idCheck', {
      method: 'POST',
      body: formData,
    });
    const data: ApiResponse = await response.json();
    if (data.status === 'good') message.value = '사용 가능한 이메일입니다.';
    else message.value = '이미 사용중인 이메일입니다.';
  } catch (error) {
    console.error('error = ', error);
  }
};

const username = ref<string>('');
const usernameRef = ref<HTMLInputElement | null>(null);
const password = ref<string>('');
const password1 = ref<string>('');
const passwordRef = ref<HTMLInputElement | null>(null);
const password1Ref = ref<HTMLInputElement | null>(null);
const gender = ref<string>('');
const zipcode = ref<string>('');
const zipcodeRef = ref<HTMLInputElement | null>(null);
const addr1 = ref<string>('');
const addr2 = ref<string>('');
const addr1Ref = ref<HTMLInputElement | null>(null);
const addr2Ref = ref<HTMLInputElement | null>(null);
const addrSearchRef = ref<HTMLInputElement | null>(null);
const address = ref<string>('');
const addressRef = ref<HTMLInputElement | null>(null);
const router = useRouter();

const data: HobbyData[] = [
  { id: 0, title: '음악감상' },
  { id: 1, title: '영화보기' },
  { id: 2, title: '스포츠' },
];

const checkItems = ref<string[]>([]);

const handleSingleCheck = (checked: boolean, title: string): void => {
  if (checked) {
    checkItems.value = [...checkItems.value, title];
  } else {
    checkItems.value = checkItems.value.filter((el) => el !== title);
  }
};

const handleAllCheck = (checked: boolean): void => {
  if (checked) {
    const idArray: string[] = [];
    data.forEach((el) => idArray.push(el.title));
    checkItems.value = idArray;
  } else {
    checkItems.value = [];
  }
};

// job 초기값을 'description'으로 설정
const job = ref<string>('description');
const jobRef = ref<HTMLSelectElement | null>(null);
const telno = ref<string>('');
const telnoRef = ref<HTMLInputElement | null>(null);
const nickname = ref<string>('');
const nicknameRef = ref<HTMLInputElement | null>(null);
const FromSocial = 'N';
const description = ref<string>('');
const descriptionRef = ref<HTMLTextAreaElement | null>(null);

const imgProfile = ref<File | null>(null);
const imgCheck = ref<string>('N');
const imgFile = ref<string>('');
const imgZoneRef = ref<HTMLDivElement | null>(null);
const fileEventRef = ref<HTMLInputElement | null>(null);

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
  imgCheck.value = 'Y';
};

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

const handleRegister = async (): Promise<void> => {
  if (imgCheck.value === 'N') {
    alert('프로필 이미지를 등록하세요');
    return;
  }
  if (!emailRef.value?.value) {
    alert('이메일을 입력하세요.');
    emailRef.value?.focus();
    return;
  }
  if (!usernameRef.value?.value) {
    alert('이름을 입력하세요.');
    usernameRef.value?.focus();
    return;
  }

  const Pass = passwordRef.value?.value || '';
  const Pass1 = password1Ref.value?.value || '';
  if (!Pass) {
    alert('암호를 입력하세요.');
    passwordRef.value?.focus();
    return;
  }
  if (!Pass1) {
    alert('암호를 입력하세요.');
    password1Ref.value?.focus();
    return;
  }
  if (Pass !== Pass1) {
    alert('입력된 비밀번호를 확인하세요');
    password1Ref.value?.focus();
    return;
  }

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

  if (!addrSearchRef.value?.value) {
    alert('검색할 주소를 입력하세요.');
    return;
  }
  if (!addr2Ref.value?.value) {
    alert('상세 주소를 입력하세요.');
    return;
  }
  if (addressRef.value) {
    addressRef.value.value = (addr1Ref.value?.value || '') + ' ' + (addr2Ref.value?.value || '');
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
  formData.append('email', emailRef.value?.value || '');
  formData.append('username', usernameRef.value?.value || '');
  formData.append('password', passwordRef.value?.value || '');
  formData.append('gender', gender.value);
  formData.append('hobby', checkItems.value.toString());
  formData.append('job', jobRef.value?.value || '');
  formData.append('zipcode', zipcodeRef.value?.value || '');
  formData.append('address', addressRef.value?.value || '');
  formData.append('telno', telnoRef.value?.value || '');
  formData.append('description', descriptionRef.value?.value || '');
  formData.append('nickname', nicknameRef.value?.value || '');
  formData.append('FromSocial', FromSocial);
  if (imgProfile.value) {
    formData.append('imgProfile', imgProfile.value);
  }
  formData.append('kind', 'I');

  try {
    const response = await fetch('http://localhost:8080/member/signup', {
      method: 'POST',
      body: formData,
    });
    const data: ApiResponse = await response.json();
    if (data.status === 'good') {
      alert(decodeURIComponent(data.username || '') + '님, 회원 가입을 축하 드립니다.');
      await navigateTo('/');
    } else {
      alert('서버 장애로 회원 가입에 실패했습니다.');
    }
  } catch (error) {
    console.error('회원가입 에러:', error);
    alert('서버 장애로 회원 가입에 실패했습니다.');
  }
};

onMounted(() => {
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
    <form class="WriteForm">
      <br />
      <h1>회원 등록</h1>
      <div>
        <br />
        <br />
        <input
          type="file"
          name="fileUpload"
          ref="fileEventRef"
          @change="fileEventChange"
          style="display: none;"
        />
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
          <template v-else>
            클릭 후 탐색창에서 사진을 선택해 주세요.
          </template>
        </div>
        <br />
        <input
          type="text"
          class="input_field"
          ref="emailRef"
          :value="email"
          @input="emailChange"
          placeholder="여기에 이메일을 입력해 주세요."
        />
        <br />
        <span style="color: red;">{{ message }}</span>
        <input
          type="text"
          class="input_field"
          ref="usernameRef"
          v-model="username"
          placeholder="여기에 이름을 입력해 주세요."
        />
        <input
          type="password"
          class="input_field"
          ref="passwordRef"
          v-model="password"
          placeholder="여기에 패스워드를 입력해 주세요."
        />
        <input
          type="password"
          class="input_field"
          ref="password1Ref"
          v-model="password1"
          placeholder="여기에 패스워드를 한번 더 입력해 주세요."
        />
        <div
          style="width: 90%; text-align: left; position: relative; left: 35px; border-bottom: 2px solid #adadad; margin: 10px; padding: 10px;"
        >
          성별 : &nbsp;
          <input
            type="radio"
            name="gender"
            value="남성"
            v-model="gender"
          />
          <label for="male">남성</label>
          <input
            type="radio"
            name="gender"
            value="여성"
            v-model="gender"
          />
          <label for="female">여성</label>
          <br />
          취미 : &nbsp;
          <input
            type="checkbox"
            @change="(e) => handleAllCheck((e.target as HTMLInputElement).checked)"
            :checked="checkItems.length === data.length"
          />
          <label for="all">전체선택</label>
          <span v-for="item in data" :key="item.id">
            <input
              type="checkbox"
              @change="(e) => handleSingleCheck((e.target as HTMLInputElement).checked, item.title)"
              :checked="checkItems.includes(item.title)"
            />
            <label :for="`${item.id}`">{{ item.title }}</label>
          </span>
          <br />
          직업 : &nbsp;
          <select v-model="job" ref="jobRef">
            <option value="description">-- 아래의 내용 중에서 선택 --</option>
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
          placeholder="주소를 검색합니다."
        />
        <input
          type="button"
          class="btn_addrSearch"
          value="주소검색"
          @click="searchAddr"
        />
        <br />
        <input
          type="text"
          class="input_field"
          ref="zipcodeRef"
          v-model="zipcode"
          placeholder="우편번호가 검색되어 입력됩니다."
          readonly
        />
        <input
          type="text"
          class="input_field"
          ref="addr1Ref"
          v-model="addr1"
          placeholder="주소가 검색되어 입력됩니다."
          readonly
        />
        <input
          type="text"
          class="input_field"
          ref="addr2Ref"
          v-model="addr2"
          placeholder="상세 주소를 입력하세요"
        />
        <input type="hidden" ref="addressRef" v-model="address" />
        <input
          type="text"
          v-model="telno"
          ref="telnoRef"
          class="input_field"
          placeholder="전화번호를 입력하세요."
        />
        <input
          type="text"
          v-model="nickname"
          ref="nicknameRef"
          class="input_field"
          placeholder="별명을 입력하세요."
        />
        <p style="color: red;">일반 사용자 권한으로 등록됩니다.</p>
        <br />
        <textarea
          class="input_content"
          v-model="description"
          ref="descriptionRef"
          :cols="100"
          :rows="500"
          name="description"
          placeholder="자기소개를 입력해 주세요."
        />
        <br />
        <input
          type="button"
          class="btn_write"
          @click="handleRegister"
          value="여기를 클릭하세요!!!"
        />
      </div>
    </form>
    <br />
    <br />
  </div>
</template>
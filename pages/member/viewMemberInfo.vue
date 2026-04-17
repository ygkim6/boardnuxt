<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

// 타입 정의
interface MemberInfo {
  email: string;
  username: string;
  gender: string;
  zipcode: string;
  address: string;
  job: string;
  hobby: string;
  telno: string;
  nickname: string;
  regdate: string;
  lastlogindate: string;
  lastlogoutdate: string;
  lastpwdate: string;
  description: string;
}

dayjs.locale('ko');

//nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

// 쿠키 가져 오기
const emailCookie = useCookie('email');
const accessTokenCookie = useCookie('accessToken');

// 사용자 정보
const member = ref<MemberInfo>({
  email: '',
  username: '',
  gender: '',
  zipcode: '',
  address: '',
  job: '',
  hobby: '',
  telno: '',
  nickname: '',
  regdate: '',
  lastlogindate: '',
  lastlogoutdate: '',
  lastpwdate: '',
  description: '',
});

// 프로필 이미지 URL
const profileImageUrl = computed(() => 
  emailCookie.value 
    ? `${apiUrl}/member/viewProfile/${emailCookie.value}` 
    : ''
);

onMounted(async () => {
  if (!emailCookie.value || !accessTokenCookie.value) return;

  try {
    const url = `${apiUrl}/board/memberInfo?email=${emailCookie.value}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessTokenCookie.value}`,
      },
    });
    const data: MemberInfo = await response.json();
    member.value = data;
  } catch (error) {
    console.error('회원 정보 로딩 에러:', error);
  }
});
</script>

<template>
  <div>
    <div class="main">
      <h1>회원 정보 보기</h1>
      <br />
      <div class="boardView">
        <div
          class="imgView"
          style="width: 80%; height: auto; margin: auto; padding: 20px; border: none;"
        >
          <img
            v-if="emailCookie"
            :src="profileImageUrl"
            alt="사용자 프로필"
            style="display: block; width: 500px; height: auto; margin: auto;"
          />
        </div>
        <div class="field">이메일(아이디) : {{ member.email }}</div>
        <div class="field">이름 : {{ member.username }}</div>
        <div class="field">성별 : {{ member.gender }}</div>
        <div class="field">
          주소 : ({{ member.zipcode }}) {{ member.address }}
        </div>
        <div class="field">직업 : {{ member.job }}</div>
        <div class="field">취미 : {{ member.hobby }}</div>
        <div class="field">전화번호 : {{ member.telno }}</div>
        <div class="field">별명 : {{ member.nickname }}</div>
        <div class="field">
          가입일자 : {{ member.regdate ? dayjs(member.regdate).format('YYYY-MM-DD HH:mm:ss') : '' }}
        </div>
        <div class="field">
          마지막 로그인 날짜 :
          {{ member.lastlogindate ? dayjs(member.lastlogindate).format('YYYY-MM-DD HH:mm:ss') : '' }}
        </div>
        <div class="field">
          마지막 로그아웃 날짜 :
          {{ member.lastlogoutdate ? dayjs(member.lastlogoutdate).format('YYYY-MM-DD HH:mm:ss') : '' }}
        </div>
        <div class="field">
          마지막 패스워드 변경일 :
          {{ member.lastpwdate ? dayjs(member.lastpwdate).format('YYYY-MM-DD HH:mm:ss') : '' }}
        </div>
        <div class="content">
          <pre>{{ member.description }}</pre>
        </div>
      </div>

      <br />
      <div class="bottom_menu" style="text-align: center;">
        &nbsp;&nbsp;
        <NuxtLink to="/board/list?page=1">처음으로</NuxtLink> &nbsp;&nbsp;
        <NuxtLink to="/member/modifyMemberInfo">기본정보 변경</NuxtLink> &nbsp;&nbsp;
        <NuxtLink to="/member/modifyMemberPassword">패스워드 변경</NuxtLink> &nbsp;&nbsp;
        <NuxtLink to="#">회원탈퇴</NuxtLink> &nbsp;&nbsp;
      </div>
      <br />
      <br />
    </div>
  </div>
</template>
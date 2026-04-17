<script setup lang="ts">
// nuxt.config.ts에서 값 가져오기 위해 필요한 함수 임포트
import { useRuntimeConfig } from 'nuxt/app';

const route = useRoute();
const hasRun = ref<boolean>(false);
const isDeleting = ref<boolean>(false);

const seqno = computed(() => route.query.seqno as string);
const page = computed(() => (route.query.page as string) || '1');
const keyword = computed(() => (route.query.keyword as string) || '');

const accessToken = useCookie('accessToken');

// nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl;

const handleDelete = async (): Promise<void> => {
  if (!seqno.value) {
    alert('잘못된 접근입니다.');
    await navigateTo('/board/list?page=1');
    return;
  }

  if (!accessToken.value) {
    alert('로그인이 필요합니다.');
    await navigateTo('/');
    return;
  }

  // 먼저 확인 받기
  const confirmed = window.confirm('정말로 삭제 하시겠습니까?');

  // 취소 버튼 클릭 시: 원래 보던 상세 페이지로 복귀
  if (!confirmed) {
    await navigateTo(`/board/view?seqno=${seqno.value}&page=${page.value}&keyword=${keyword.value}`);
    return;
  }

  // 확인 버튼 클릭 시: 삭제 진행
  isDeleting.value = true;

  try {
    await $fetch(`${apiUrl}/board/delete?seqno=${seqno.value}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
    });

    alert('삭제되었습니다.');
    await navigateTo(`/board/list?page=${page.value}&keyword=${keyword.value}`);
  } catch (error: any) {
    if (error.response?.status === 401) {
      alert('인증이 만료되었습니다. 다시 로그인해주세요.');
      await navigateTo('/');
      return;
    }

    console.error('삭제 에러:', error);
    alert('삭제 중 오류가 발생했습니다.');
    await navigateTo(`/board/list?page=${page.value}&keyword=${keyword.value}`);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  if (hasRun.value) return;
  hasRun.value = true;
  handleDelete();
});
</script>

<template>
  <div style="text-align: center; margin-top: 100px;">
    <template v-if="isDeleting">
      <h3>삭제 중...</h3>
      <p>잠시만 기다려주세요.</p>
    </template>
    <template v-else>
      <h3>처리 중...</h3>
    </template>
  </div>
</template>
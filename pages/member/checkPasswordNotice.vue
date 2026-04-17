<script setup lang="ts">
const router = useRouter();

const modifyMemberPassword = (): void => {
  navigateTo('/member/modifyMemberPassword');
};

const modifyPasswordAfter30 = (): void => {
  navigateTo('/member/modifyPasswordAfter30');
};
</script>

<template>
  <div>
    <div class="ModifyForm">
      <h1>패스워드를 변경해 주세요.</h1><br />
      <input
        type="button"
        class="btn_write"
        value="30일 후에 변경"
        @click="modifyPasswordAfter30"
      />
      <input
        type="button"
        class="btn_cancel"
        value="지금 변경"
        @click="modifyMemberPassword"
      />
    </div>
  </div>
</template>
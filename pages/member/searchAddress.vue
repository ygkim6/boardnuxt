<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
// 타입 정의
interface AddressItem {
  zipcode: string;
  province: string;
  road: string;
  building: string;
  oldaddr: string;
}

interface AddressResponse {
  content: AddressItem[];
}

interface PageListResponse {
  addressPagelist: string;
}

//nuxt.config.ts에서 값 가져오기
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl

const route = useRoute();
const list = ref<AddressItem[]>([]);
const addressPageList = ref<string>('');
const page = computed(() => (route.query.page as string) || '1');
const addrSearch = computed(() => (route.query.addrSearch as string) || '');

const getAddressList = async (): Promise<void> => {
  try {
    const response = await fetch(
      `${apiUrl}/member/searchAddress?page=${page.value}&addrSearch=${addrSearch.value}`,
      { method: 'GET' }
    );
    const data: AddressResponse = await response.json();
    list.value = data.content;
  } catch (error) {
    console.log(error);
  }
};

const getAddressPageList = async (): Promise<void> => {
  try {
    const response = await fetch(
      `${apiUrl}/member/addressPagelist?page=${page.value}&addrSearch=${addrSearch.value}`,
      { method: 'GET' }
    );
    const data: PageListResponse = await response.json();
    addressPageList.value = data.addressPagelist;
  } catch (error) {
    console.log(error);
  }
};

const addrCheck = (zipcode: string, province: string, road: string, building: string): void => {
  window.opener.postMessage(
    {
      zipcode: zipcode,
      addr1: province + road + building,
    },
    '*'
  );
  window.close();
};

onMounted(() => {
  getAddressList();
  getAddressPageList();
});
</script>

<template>
  <div class="main">
    <h1>주소 검색</h1>
    <table class="InfoTable">
      <thead>
        <tr>
          <th>우편번호</th>
          <th>주소</th>
          <th>선택</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in list" :key="index">
          <td>{{ item.zipcode }}</td>
          <td style="text-align: left;">
            {{ item.province }}{{ item.road }}{{ item.building }}<br />{{ item.oldaddr }}
          </td>
          <td>
            <input
              type="button"
              value="선택"
              @click="() => addrCheck(item.zipcode, item.province, item.road, item.building)"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-html="addressPageList"></div>
  </div>
</template>
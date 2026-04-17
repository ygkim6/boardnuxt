export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/globals.css'],
  ssr: true,
  //ssr: false,
  runtimeConfig: {
    public: {
      apiUrl: ''
    }
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      ignore: ['/board', '/member'],
    }
  }
})

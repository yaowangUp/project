<script setup>
import { ref, onMounted } from 'vue'

const currentTime = ref('')

onMounted(() => {
  setInterval(() => {
    currentTime.value = new Date().toLocaleString()
  }, 10)
})
</script>


<template>
  <div style="padding-top: 70px;">
    <h1>当前时间：{{ currentTime }}</h1>
  </div>
</template>

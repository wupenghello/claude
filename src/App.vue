<template>
  <LoginView v-if="!isAuthenticated" @login-success="handleLoginSuccess" />
  <div v-else class="app">
    <QAInterface />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginView from './components/LoginView.vue'
import QAInterface from './components/QAInterface.vue'
import Cookies from 'js-cookie'

const isAuthenticated = ref(false)

onMounted(() => {
  const auth = Cookies.get('auth')
  if (auth === 'true') {
    isAuthenticated.value = true
  }
})

const handleLoginSuccess = (): void => {
  isAuthenticated.value = true
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #000;
}

.app {
  min-height: 100vh;
}
</style> 
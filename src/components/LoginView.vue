<template>
  <div class="login-container">
    <div class="login-background">
      <div class="background-image"></div>
      <div class="background-overlay"></div>
    </div>
    <div class="login-card">
      <h1>Claude AI</h1>
      <div class="input-group">
        <input 
          type="text" 
          v-model="username" 
          placeholder="用户名"
          :class="{ 'error': showError }"
          @focus="showError = false"
        >
        <input 
          type="password" 
          v-model="password" 
          placeholder="密码"
          :class="{ 'error': showError }"
          @focus="showError = false"
          @keyup.enter="handleLogin"
        >
        <div class="error-message" v-if="showError">
          用户名或密码错误
        </div>
      </div>
      <button 
        class="login-button"
        @click="handleLogin"
        :disabled="!username || !password"
      >
        登录
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Cookies from 'js-cookie'
import { API_CONFIG } from '../config/api'

const username = ref('')
const password = ref('')
const showError = ref(false)

const emit = defineEmits<{
  (e: 'login-success'): void
}>()

const handleLogin = (): void => {
  if (username.value === API_CONFIG.LOGIN_USERNAME && 
      password.value === API_CONFIG.LOGIN_PASSWORD) {
    Cookies.set('auth', 'true', { expires: 7 })
    emit('login-success')
  } else {
    showError.value = true
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('https://images.unsplash.com/photo-1634655377962-e6e7b446e7e9');
  background-size: cover;
  background-position: center;
  filter: blur(0px);
  transform: scale(1.1);
  transition: all 0.3s ease;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.7),
    rgba(255, 255, 255, 0.5)
  );
  backdrop-filter: blur(10px);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  text-align: center;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

h1 {
  font-size: 28px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 32px;
  letter-spacing: -0.5px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

input {
  height: 44px;
  padding: 0 16px;
  border: 1px solid #d2d2d7;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

input:focus {
  outline: none;
  border-color: #0071e3;
  background: #ffffff;
}

input.error {
  border-color: #ff3b30;
}

.error-message {
  color: #ff3b30;
  font-size: 14px;
  text-align: left;
  margin-top: -8px;
}

.login-button {
  width: 100%;
  height: 44px;
  background: #0071e3;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-button:hover:not(:disabled) {
  background: #0077ED;
}

.login-button:disabled {
  background: #999;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 30px;
  }
}
</style> 
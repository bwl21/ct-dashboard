<template>
  <div class="cts">
    <!-- Development Navbar -->
    <nav class="ct-navbar" v-if="isDevelopment">
      <div class="ct-navbar-brand">
        <span class="ct-navbar-title">ChurchTools Development</span>
      </div>
      <div class="ct-navbar-nav">
        <span class="ct-navbar-text">{{ userDisplayName }}</span>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="ct-main">
      <Start />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Start from './components/Start.vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { Person } from './ct-types';

const userDisplayName = ref<string>('');
const isDevelopment = ref<boolean>(false);

onMounted(async () => {
  isDevelopment.value = import.meta.env.MODE === 'development';
  
  try {
    const user = await churchtoolsClient.get<Person>('/whoami');
    userDisplayName.value = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Benutzer';
  } catch (error) {
    console.error('Fehler beim Laden der Benutzerdaten:', error);
    userDisplayName.value = 'Benutzer';
  }
});
</script>

<style scoped>
.ct-navbar {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ct-navbar-brand {
  font-weight: 600;
  font-size: 1.2rem;
}

.ct-navbar-text {
  font-size: 0.9rem;
  opacity: 0.9;
}

.ct-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .ct-main {
    padding: 1rem;
  }
  
  .ct-navbar {
    padding: 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
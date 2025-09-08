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
      <div v-if="currentView === 'dashboard'">
        <Start @navigate-to-admin="currentView = 'automatic-groups'" />
      </div>
      <div v-else-if="currentView === 'automatic-groups'">
        <div class="admin-header">
          <button @click="currentView = 'dashboard'" class="ct-btn ct-btn-outline back-btn">
            ← Zurück zum Dashboard
          </button>
        </div>
        <AutomaticGroupsAdmin />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Start from './components/Start.vue';
import AutomaticGroupsAdmin from './components/AutomaticGroupsAdmin.vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { Person } from './ct-types';

const userDisplayName = ref<string>('');
const isDevelopment = ref<boolean>(false);
const currentView = ref<'dashboard' | 'automatic-groups'>('dashboard');

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
  width: 100%;
  margin: 0;
}

@media (min-width: 1400px) {
  .ct-main {
    padding: 3rem;
  }
}

@media (min-width: 992px) and (max-width: 1399px) {
  .ct-main {
    padding: 2.5rem;
  }
}

@media (min-width: 769px) and (max-width: 991px) {
  .ct-main {
    padding: 1.5rem;
  }
}

.admin-header {
  margin-bottom: 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #007bff;
  background: transparent;
  color: #007bff;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background-color: #007bff;
  color: white;
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
  
  .back-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
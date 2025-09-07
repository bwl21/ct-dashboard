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
      <div class="navigation-tabs">
        <button 
          @click="activeTab = 'dashboard'" 
          :class="['tab-button', { active: activeTab === 'dashboard' }]"
        >
          Dashboard
        </button>
        <button 
          @click="activeTab = 'automatic-groups'" 
          :class="['tab-button', { active: activeTab === 'automatic-groups' }]"
        >
          Automatische Gruppen
        </button>
      </div>
      
      <Start v-if="activeTab === 'dashboard'" />
      <AutomaticGroupsAdmin v-if="activeTab === 'automatic-groups'" />
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
const activeTab = ref<'dashboard' | 'automatic-groups'>('dashboard');

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

.navigation-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  color: #6c757d;
  cursor: pointer;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.tab-button.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background-color: #f8f9fa;
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
  
  .navigation-tabs {
    flex-direction: column;
    gap: 0;
  }
  
  .tab-button {
    text-align: left;
    border-bottom: 1px solid #e9ecef;
    border-radius: 0;
  }
  
  .tab-button.active {
    border-bottom-color: #007bff;
  }
}
</style>
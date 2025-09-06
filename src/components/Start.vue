<template>
  <div class="dashboard-container">
    <!-- Header Card -->
    <div class="ct-card header-card">
      <div class="ct-card-header">
        <h1 class="ct-card-title">Churchtools Dashboard</h1>
      </div>
      <div class="ct-card-body">
        <p class="description">Dieses Modul hilft, das ChurchTools System zu überwachen</p>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="features-grid">
      <div class="ct-card feature-card" v-for="feature in features" :key="feature.id">
        <div class="ct-card-header">
          <h3 class="ct-card-title">{{ feature.title }}</h3>
        </div>
        <div class="ct-card-body">
          <div class="feature-icon">{{ feature.icon }}</div>
          <p class="feature-description">{{ feature.description }}</p>
          <div class="feature-value">{{ feature.value }}</div>
        </div>
      </div>
    </div>

    <!-- Interactive Test Section -->
    <div class="ct-card test-card">
      <div class="ct-card-header">
        <h3 class="ct-card-title">System Test</h3>
      </div>
      <div class="ct-card-body">
        <p>Teste die Dashboard-Funktionalität:</p>
        <button 
          class="ct-btn ct-btn-primary test-button" 
          @click="incrementCounter"
        >
          Test ausführen ({{ testCounter }})
        </button>
        <div v-if="testCounter > 0" class="test-result">
          ✅ Test erfolgreich ausgeführt {{ testCounter }} Mal
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

const testCounter = ref<number>(0);

const features = reactive([
  {
    id: 1,
    title: 'Anzahl User',
    icon: '👥',
    description: 'Überwachung der registrierten Benutzer im System',
    value: '1,234 Benutzer'
  },
  {
    id: 2,
    title: 'Hauptaktivitäten',
    icon: '📊',
    description: 'Monitoring der wichtigsten Systemaktivitäten',
    value: '89 Aktivitäten heute'
  },
  {
    id: 3,
    title: 'Fehler',
    icon: '⚠️',
    description: 'Überwachung von Systemfehlern und Problemen',
    value: '2 offene Fehler'
  },
  {
    id: 4,
    title: 'System Status',
    icon: '🟢',
    description: 'Allgemeiner Gesundheitsstatus des Systems',
    value: 'Alle Systeme online'
  }
]);

const incrementCounter = () => {
  testCounter.value++;
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: none;
}

.header-card {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-card .ct-card-title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.description {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: none;
}

.feature-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.feature-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.feature-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.feature-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
}

.test-card {
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
}

.test-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.test-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.3);
}

.test-result {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  color: #155724;
  font-weight: 500;
}

/* ChurchTools Design System Classes */
.ct-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.ct-card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.ct-card-body {
  padding: 1.5rem;
}

.ct-card-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.ct-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
}

.ct-btn-primary {
  background-color: #007bff;
  color: white;
}

.ct-btn-primary:hover {
  background-color: #0056b3;
}

/* Responsive Design */
@media (min-width: 1400px) {
  .features-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 2.5rem;
  }
}

@media (min-width: 992px) and (max-width: 1399px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

@media (min-width: 769px) and (max-width: 991px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .ct-main {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .header-card .ct-card-title {
    font-size: 2rem;
  }
  
  .description {
    font-size: 1rem;
  }
  
  .feature-icon {
    font-size: 2.5rem;
  }
  
  .feature-value {
    font-size: 1.2rem;
  }
  
  .dashboard-container {
    gap: 1.5rem;
  }
}
</style>
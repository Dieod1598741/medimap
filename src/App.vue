<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, MapPin, Plus, LogIn, Database, LogOut, PackagePlus } from 'lucide-vue-next'
import { useMedicineStore } from './store/medicine'
import mapImageUrl from './assets/map.jpeg'

const store = useMedicineStore()
const searchQuery = ref('')
const isAdmin = ref(false)
const showAddModal = ref(false)
const showLoginModal = ref(false)
const adminPassword = ref('')

const newMedicine = ref({
  name: '',
  location: '',
  is_in_stock: true
})

const showSuggestions = ref(false)

const suggestions = computed(() => {
  if (!searchQuery.value) return []
  return store.medicines
    .filter(m => m.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    .map(m => m.name)
    .filter((name, index, self) => self.indexOf(name) === index) // Unique names
    .slice(0, 5) // Limit to 5 suggestions
})

const selectSuggestion = (name: string) => {
  searchQuery.value = name
  showSuggestions.value = false
}

const handleBlur = () => {
  // Delay to allow click event on suggestion item to fire first
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

onMounted(() => {
  store.fetchMedicines()
})

const filteredMedicines = computed(() => {
  if (!searchQuery.value) return store.medicines
  return store.medicines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const toggleAdmin = () => {
  if (isAdmin.value) {
    isAdmin.value = false
  } else {
    showLoginModal.value = true
    adminPassword.value = ''
  }
}

const handleLogin = () => {
  if (adminPassword.value === '1234') {
    isAdmin.value = true
    showLoginModal.value = false
    adminPassword.value = ''
  } else {
    alert('비밀번호가 올바르지 않습니다.')
  }
}

const handleAddMedicine = async () => {
  if (!newMedicine.value.name || !newMedicine.value.location) return
  
  try {
    await store.addMedicine(newMedicine.value)
    newMedicine.value = { name: '', location: '', is_in_stock: true }
    showAddModal.value = false
  } catch (e) {
    alert('저장 실패: ' + (e as any).message)
  }
}
</script>

<template>
  <div class="app-container">
    <header class="main-header glass">
      <div class="logo">
        <Database :size="24" />
        <span>Medimap <small>Yongsan</small></span>
      </div>
      <nav>
        <button v-if="!isAdmin" @click="toggleAdmin" class="btn-icon">
          <LogIn :size="20" />
          <span>관리자</span>
        </button>
        <div v-else class="admin-nav">
          <button @click="showAddModal = true" class="btn-primary-sm">
            <PackagePlus :size="18" />
            <span>등록</span>
          </button>
          <button @click="toggleAdmin" class="btn-icon">
            <LogOut :size="20" />
          </button>
        </div>
      </nav>
    </header>

    <main class="content">
      <!-- Login Modal -->
      <section v-if="showLoginModal" class="login-modal glass">
        <h2>관리자 로그인</h2>
        <div class="form-group">
          <label>비밀번호</label>
          <input 
            v-model="adminPassword" 
            type="password" 
            class="input-field" 
            placeholder="비밀번호 4자리를 입력하세요"
            @keyup.enter="handleLogin"
          >
        </div>
        <div class="form-actions">
          <button @click="showLoginModal = false" class="btn-secondary">취소</button>
          <button @click="handleLogin" class="btn-primary">로그인</button>
        </div>
      </section>

      <section v-if="!showAddModal && !showLoginModal" class="hero">
        <div class="map-container glass">
          <img :src="mapImageUrl" alt="Pharmacy Map" class="pharmacy-map" />
        </div>
        <h1>어떤 약을 찾으시나요?</h1>
        <p>메디킹덤 용산점의 모든 약품 위치를 한 번에 확인하세요.</p>
        
        <div class="search-container">
          <div class="search-wrapper glass">
            <Search class="search-icon" :size="20" />
            <input 
              type="text" 
              v-model="searchQuery" 
              @focus="showSuggestions = true"
              @blur="handleBlur"
              placeholder="약품 이름을 입력하세요..." 
              class="search-input"
            />
          </div>
          <transition name="fade">
            <ul v-if="showSuggestions && suggestions.length > 0" class="suggestions-list glass">
              <li 
                v-for="suggestion in suggestions" 
                :key="suggestion" 
                @click="selectSuggestion(suggestion)"
                class="suggestion-item"
              >
                {{ suggestion }}
              </li>
            </ul>
          </transition>
        </div>
      </section>

      <section v-if="showAddModal" class="add-section glass">
        <h2>새 약품 등록</h2>
        <div class="form-group">
          <label>약품 이름</label>
          <input v-model="newMedicine.name" type="text" class="input-field" placeholder="예: 타이레놀">
        </div>
        <div class="form-group">
          <label>위치</label>
          <input v-model="newMedicine.location" type="text" class="input-field" placeholder="예: A-1 선반">
        </div>
        <div class="form-group-row">
          <label>재고 상태</label>
          <button 
            @click="newMedicine.is_in_stock = !newMedicine.is_in_stock"
            :class="['toggle-btn', newMedicine.is_in_stock ? 'in-stock' : 'out-of-stock']"
          >
            {{ newMedicine.is_in_stock ? '재고 있음' : '재고 없음' }}
          </button>
        </div>
        <div class="form-actions">
          <button @click="showAddModal = false" class="btn-secondary">취소</button>
          <button @click="handleAddMedicine" class="btn-primary">저장하기</button>
        </div>
      </section>

      <section v-if="!showAddModal" class="results">
        <div v-if="store.loading" class="loading-state">데이터를 불러오는 중...</div>
        <div v-else-if="filteredMedicines.length === 0" class="empty-state">
          결과가 없습니다.
        </div>
        <div v-for="med in filteredMedicines" :key="med.id" class="med-card glass">
          <div class="med-info">
            <h3>{{ med.name }}</h3>
            <span :class="['stock-badge', med.is_in_stock ? 'in-stock' : 'out-of-stock']">
              {{ med.is_in_stock ? '재고 있음' : '재고 없음' }}
            </span>
          </div>
          <div class="med-location">
            <MapPin :size="16" />
            <span>{{ med.location }}</span>
          </div>
        </div>
      </section>
    </main>

    <footer class="main-footer">
      <p>&copy; 2026 Medimap Medikingdom Yongsan. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  position: sticky;
  top: 20px;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1.2rem;
}

.logo small {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: var(--radius);
  transition: background 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.content {
  margin-top: 60px;
}

.hero {
  text-align: center;
  margin-bottom: 40px;
}

.map-container {
  margin-bottom: 30px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.pharmacy-map {
  max-width: 100%;
  height: auto;
  border-radius: calc(var(--radius) - 4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero p {
  color: var(--text-muted);
}

.search-container {
  position: relative;
  z-index: 50;
  max-width: 500px;
  margin: 30px auto 0;
}

.search-wrapper {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  gap: 15px;
}

.suggestions-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 8px 0;
  list-style: none;
  overflow: hidden;
}

.suggestion-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
}

.suggestion-item:hover {
  background: rgba(79, 70, 229, 0.1);
  color: var(--primary);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.search-icon {
  color: var(--primary);
}

.search-input {
  background: transparent;
  border: none;
  width: 100%;
  font-size: 1.1rem;
  color: inherit;
}

.search-input:focus {
  outline: none;
}

.results {
  display: grid;
  gap: 16px;
}

.med-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  transition: transform 0.2s ease;
}

.med-card:hover {
  transform: translateY(-4px);
}

.med-info h3 {
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.stock-badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.stock-badge.in-stock {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.stock-badge.out-of-stock {
  background: rgba(239, 44, 44, 0.1);
  color: #ef4444;
}

.med-location {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-light);
  color: var(--primary);
  padding: 8px 16px;
  border-radius: 100px;
  font-weight: 700;
  font-size: 0.9rem;
}

.main-footer {
  text-align: center;
  margin-top: 60px;
  padding-bottom: 20px;
  color: var(--text-muted);
  font-size: 0.8rem;
}
.admin-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-primary-sm {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.add-section, .login-modal {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.toggle-btn {
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.in-stock {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.toggle-btn.out-of-stock {
  background: rgba(239, 44, 44, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 44, 44, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  padding: 10px 20px;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
}

.loading-state, .empty-state {
  color: var(--text-muted);
}

/* Mobile Responsiveness */
@media (max-width: 480px) {
  .app-container {
    padding: 10px;
  }

  .main-header {
    padding: 12px 15px;
    top: 10px;
  }

  .content {
    margin-top: 40px;
  }

  .hero h1 {
    font-size: 1.8rem;
    white-space: nowrap;
  }

  .hero p {
    font-size: 0.9rem;
    word-break: keep-all;
  }

  .logo span {
    font-size: 1rem;
  }

  .search-wrapper {
    padding: 8px 15px;
  }

  .search-input {
    font-size: 1rem;
  }

  .med-card {
    padding: 15px;
  }

  .med-info h3 {
    font-size: 1.1rem;
  }

  .med-location {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}
</style>

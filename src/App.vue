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
const isMapZoomed = ref(false)

const newMedicine = ref({
  name: '',
  location: '',
  stock_quantity: 0,
  expiry_date: null as string | null,
  category: '',
  internal_notes: '',
  image_url: '',
  is_in_stock: true
})

const showEditModal = ref(false)
const editingMedicine = ref<any>(null)
const editForm = ref({
  name: '',
  location: '',
  stock_quantity: 0,
  expiry_date: null as string | null,
  category: '',
  internal_notes: '',
  image_url: '',
  is_in_stock: true
})

const showSuggestions = ref(false)

const getChoseung = (str: string) => {
  const choseung = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ]
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032
    if (code > -1 && code < 11172) {
      result += choseung[Math.floor(code / 588)]
    } else {
      result += str.charAt(i)
    }
  }
  return result
}

const suggestions = computed(() => {
  if (!searchQuery.value) return []
  const originalQuery = searchQuery.value.trim()
  const query = originalQuery.toLowerCase().replace(/\s/g, '')
  const queryChoseung = getChoseung(query)
  const isChoseungQuery = /^[ㄱ-ㅎ]+$/.test(query)
  
  return store.medicines
    .filter(m => {
      const name = m.name.toLowerCase().replace(/\s/g, '')
      const nameChoseung = getChoseung(name)
      if (isChoseungQuery) {
        return nameChoseung.includes(query)
      } else {
        return name.includes(query)
      }
    })
    .map(m => m.name)
    .filter((name, index, self) => self.indexOf(name) === index)
    .sort((a, b) => {
      // Prioritize names that START with the query
      const aStarts = a.toLowerCase().startsWith(originalQuery.toLowerCase())
      const bStarts = b.toLowerCase().startsWith(originalQuery.toLowerCase())
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.localeCompare(b, 'ko')
    })
    .slice(0, 20)
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
  const query = searchQuery.value.toLowerCase().replace(/\s/g, '')
  const isChoseungQuery = /^[ㄱ-ㅎ]+$/.test(query)
  
  return store.medicines.filter(m => {
    const name = m.name.toLowerCase().replace(/\s/g, '')
    const ingredients = (m.ingredients || '').toLowerCase().replace(/\s/g, '')
    if (isChoseungQuery) {
      return getChoseung(name).includes(query) || getChoseung(ingredients).includes(query)
    } else {
      return name.includes(query) || ingredients.includes(query)
    }
  })
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

const toggleMapZoom = () => {
  isMapZoomed.value = !isMapZoomed.value
}

const handleAddMedicine = async () => {
  if (!newMedicine.value.name || !newMedicine.value.location) return
  
  try {
    await store.addMedicine(newMedicine.value)
    newMedicine.value = { 
      name: '', 
      location: '', 
      stock_quantity: 0,
      expiry_date: null,
      category: '',
      internal_notes: '',
      image_url: '',
      is_in_stock: true 
    }
    showAddModal.value = false
  } catch (e) {
    alert('저장 실패: ' + (e as any).message)
  }
}

const startEdit = (med: any) => {
  editingMedicine.value = med
  editForm.value = { 
    name: med.name,
    location: med.location,
    stock_quantity: med.stock_quantity || 0,
    expiry_date: med.expiry_date || null,
    category: med.category || '',
    internal_notes: med.internal_notes || '',
    image_url: med.image_url || '',
    is_in_stock: med.is_in_stock 
  }
  showEditModal.value = true
}

const handleUpdateMedicine = async () => {
  if (!editingMedicine.value) return
  try {
    await store.updateMedicine(editingMedicine.value.id, editForm.value)
    showEditModal.value = false
    editingMedicine.value = null
  } catch (e) {
    alert('수정 실패: ' + (e as any).message)
  }
}
const searchImage = (name: string) => {
  const query = encodeURIComponent(name)
  window.open(`https://www.google.com/search?q=${query}&tbm=isch`, '_blank')
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
        <div class="map-container glass" @click="toggleMapZoom">
          <img :src="mapImageUrl" alt="Pharmacy Map" class="pharmacy-map" />
          <div class="map-overlay">
            <Search :size="24" />
            <span>크게 보기</span>
          </div>
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
          <label>카테고리</label>
          <input v-model="newMedicine.category" type="text" class="input-field" placeholder="예: 해열제, 영양제">
        </div>
        <div class="form-group-grid">
          <div class="form-group">
            <label>위치</label>
            <input v-model="newMedicine.location" type="text" class="input-field" placeholder="예: A-1 선반">
          </div>
          <div class="form-group">
            <label>재고 수량</label>
            <input v-model.number="newMedicine.stock_quantity" type="number" class="input-field" placeholder="0">
          </div>
        </div>
        <div class="form-group">
          <label>직원용 메모</label>
          <textarea v-model="newMedicine.internal_notes" class="input-field textarea" placeholder="진열 위치 팁이나 주의사항을 적어주세요"></textarea>
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
        <div v-for="med in filteredMedicines" :key="med.id" class="med-card glass" :class="{ 'stock-warn': med.stock_quantity === 0 }">
          <div v-if="med.image_url" class="med-image-container">
            <img :src="med.image_url" :alt="med.name" class="med-image" />
          </div>
          <div class="med-main-info">
            <div class="med-info">
              <div class="med-header">
                <h3>{{ med.name }}</h3>
                <span v-if="med.category" class="category-badge">{{ med.category }}</span>
              </div>
              <div v-if="med.ingredients" class="med-ingredients">
                <span class="ingredient-label">성분:</span> {{ med.ingredients }}
              </div>
              <div class="med-status-row">
                <span :class="['stock-badge', med.is_in_stock ? 'in-stock' : 'out-of-stock']">
                  {{ med.is_in_stock ? '재고 있음' : '재고 없음' }}
                </span>
                <span v-if="med.stock_quantity !== undefined" class="quantity-text" :class="{ 'warning-text-simple': med.stock_quantity === 0 }">
                  (수량: {{ med.stock_quantity }})
                </span>
                <button class="btn-image-search" @click.stop="searchImage(med.name)">
                  <Plus :size="12" /> 사진 찾기
                </button>
              </div>
            </div>
            <div class="med-location">
              <MapPin :size="16" />
              <span>{{ med.location }}</span>
              <button v-if="isAdmin" class="btn-edit-small" @click.stop="startEdit(med)">
                수정
              </button>
            </div>
          </div>
          
          <div v-if="med.internal_notes" class="med-extra-info">
            <div class="notes-info">
              <Plus :size="14" :style="{ transform: 'rotate(45deg)' }" />
              <p>{{ med.internal_notes }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="main-footer">
      <p>&copy; 2026 Medimap Medikingdom Yongsan. All rights reserved.</p>
      <p class="count-indicator" v-if="store.medicines.length > 0">
        전체 약품 데이터: {{ store.medicines.length.toLocaleString() }}개 로드됨
      </p>
    </footer>

    <!-- Map Zoom Modal -->
    <transition name="fade">
      <div v-if="isMapZoomed" class="map-zoom-overlay" @click="toggleMapZoom">
        <div class="zoom-content glass" @click.stop>
          <img :src="mapImageUrl" alt="Enlarged Pharmacy Map" class="zoomed-image" />
          <button class="close-zoom" @click="toggleMapZoom">
            <Plus :style="{ transform: 'rotate(45deg)' }" :size="32" />
          </button>
        </div>
      </div>
    </transition>
    <!-- Edit Medicine Modal -->
    <transition name="fade">
      <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
        <div class="add-section glass" @click.stop>
          <div class="modal-header">
            <h2>기존 약품 정보 수정</h2>
            <button class="close-btn" @click="showEditModal = false">
              <Plus :style="{ transform: 'rotate(45deg)' }" :size="24" />
            </button>
          </div>
          <div class="form-group">
            <label>약품 이름</label>
            <input v-model="editForm.name" type="text" class="input-field" placeholder="예: 타이레놀">
          </div>
          <div class="form-group">
            <label>카테고리</label>
            <input v-model="editForm.category" type="text" class="input-field" placeholder="예: 해열제, 영양제">
          </div>
          <div class="form-group-grid">
            <div class="form-group">
              <label>위치</label>
              <input v-model="editForm.location" type="text" class="input-field" placeholder="예: A-1 선반">
            </div>
            <div class="form-group">
              <label>재고 수량</label>
              <input v-model.number="editForm.stock_quantity" type="number" class="input-field" placeholder="0">
            </div>
          </div>
          <div class="form-group">
            <label>약품 이미지 URL</label>
            <div class="image-input-row">
              <input v-model="editForm.image_url" type="text" class="input-field" placeholder="https://...">
              <button class="btn-image-search" @click.stop="searchImage(editForm.name)">
                사진 찾기
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>직원용 메모</label>
            <textarea v-model="editForm.internal_notes" class="input-field textarea" placeholder="진열 위치 팁이나 주의사항을 적어주세요"></textarea>
          </div>
          <div class="form-group-row">
            <label>재고 상태</label>
            <button 
              @click="editForm.is_in_stock = !editForm.is_in_stock"
              :class="['toggle-btn', editForm.is_in_stock ? 'in-stock' : 'out-of-stock']"
            >
              {{ editForm.is_in_stock ? '재고 있음' : '재고 없음' }}
            </button>
          </div>
          <div class="form-actions">
            <button @click="showEditModal = false" class="btn-secondary">취소</button>
            <button @click="handleUpdateMedicine" class="btn-primary">수정 완료</button>
          </div>
        </div>
      </div>
    </transition>
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
  position: relative;
  cursor: pointer;
}

.map-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.map-container:hover .map-overlay {
  opacity: 1;
}

.pharmacy-map {
  max-width: 100%;
  height: auto;
  border-radius: calc(var(--radius) - 4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.map-zoom-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.zoom-content {
  position: relative;
  max-width: 95vw;
  max-height: 90vh;
  padding: 10px;
  border-radius: var(--radius);
  overflow: auto;
}

.zoomed-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: calc(var(--radius) - 4px);
}

.close-zoom {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  color: var(--text-main);
  z-index: 100;
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
  overflow-y: auto;
  max-height: 250px;
  z-index: 1000;
}

/* Scrollbar styling for suggestions */
.suggestions-list::-webkit-scrollbar {
  width: 6px;
}

.suggestions-list::-webkit-scrollbar-track {
  background: transparent;
}

.suggestions-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.suggestions-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
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

.form-group-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.input-field.textarea {
  resize: vertical;
  min-height: 80px;
}

.category-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 4px;
  font-weight: 500;
}

.med-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.med-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.quantity-text {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.med-main-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.med-ingredients {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ingredient-label {
  font-weight: 700;
  color: var(--primary);
  font-size: 0.75rem;
}

.med-extra-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expiry-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.warning-text {
  color: #ef4444;
  font-weight: 700;
  font-size: 0.75rem;
  background: rgba(239, 44, 44, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.notes-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 8px;
}

.btn-image-search {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-image-search:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary);
}

.med-card.stock-warn {
  border: 1px solid rgba(239, 44, 44, 0.2);
}

.med-image-container {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
  border: 1px solid var(--glass-border);
}

.med-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-input-row {
  display: flex;
  gap: 10px;
}

.med-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

.warning-text-simple {
  color: #ef4444;
  font-weight: 700;
}

.add-section, .login-modal {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 500px;
  border-radius: var(--radius);
  animation: modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
  max-height: 90vh;
}

.btn-edit-small {
  margin-left: 10px;
  padding: 2px 8px;
  font-size: 0.75rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit-small:hover {
  background: var(--primary-dark);
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

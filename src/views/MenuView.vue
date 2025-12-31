<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDishStore } from '@/stores/dishStore'
import { storeToRefs } from 'pinia'
import { showToast, showDialog } from 'vant'

const router = useRouter()
const store = useDishStore()
const { dishesByCategory, totalCartCount, dishes, loading } = storeToRefs(store)

const activeTab = ref(0)
const searchText = ref('')

onMounted(() => {
  store.init()
})

// 过滤后的菜品列表
const filteredDishesByCategory = computed(() => {
  if (!searchText.value) return dishesByCategory.value
  
  const result = {}
  const keyword = searchText.value.toLowerCase()
  
  Object.keys(dishesByCategory.value).forEach(cat => {
    const filtered = dishesByCategory.value[cat].filter(dish => 
      dish.name.toLowerCase().includes(keyword) || 
      dish.description.toLowerCase().includes(keyword) ||
      dish.tags.some(t => t.toLowerCase().includes(keyword))
    )
    if (filtered.length > 0) {
      result[cat] = filtered
    }
  })
  return result
})

const categories = computed(() => Object.keys(filteredDishesByCategory.value))

const goToCart = () => {
  router.push('/cart')
}

const getCount = (dishId) => store.getCartCount(dishId)
const add = (dishId) => store.updateCart(dishId, 1)
const minus = (dishId) => store.updateCart(dishId, -1)

// Omakase 随机点菜
const handleOmakase = () => {
  const availableDishes = dishes.value.filter(d => d.available)
  if (availableDishes.length === 0) {
    showToast('暂无可用菜品')
    return
  }
  
  const randomDish = availableDishes[Math.floor(Math.random() * availableDishes.length)]
  showDialog({
    title: '👨‍🍳 主厨推荐',
    message: `今天不如试试：\n【${randomDish.name}】？`,
    showCancelButton: true,
    confirmButtonText: '加入点餐',
    cancelButtonText: '换一个',
    closeOnClickOverlay: true,
  }).then(() => {
    add(randomDish.id)
    showToast('已加入')
  }).catch((action) => {
    if (action === 'cancel') {
      handleOmakase() // 只有点击“换一个”才递归
    }
  })
}

// 管理端入口保护：长按标题或特殊操作
let clickTimer = null
const handleAdminEntry = () => {
    // 简单的连击保护，防止误点
    clearTimeout(clickTimer)
    clickTimer = setTimeout(() => {
        // 正常点击逻辑
    }, 300)
}

const onLongPressAdmin = () => {
    router.push('/admin')
}

</script>

<template>
  <div class="menu-page">
    <van-nav-bar fixed placeholder>
        <template #title>
            <span @touchstart="handleAdminEntry" @contextmenu.prevent="onLongPressAdmin">私房小厨</span>
        </template>
        <template #right>
            <van-icon name="setting-o" size="18" @click="router.push('/admin')" />
        </template>
    </van-nav-bar>

    <!-- 搜索与随机 -->
    <div class="header-actions">
        <van-search 
            v-model="searchText" 
            placeholder="想吃什么？" 
            class="search-bar"
            background="transparent"
        />
        <van-button 
            icon="dice-0" 
            type="primary" 
            plain 
            round 
            size="small" 
            class="omakase-btn"
            @click="handleOmakase"
        >帮我选</van-button>
    </div>

    <!-- 加载状态 -->
    <van-loading v-if="loading" vertical class="mt-20">加载菜单中...</van-loading>

    <!-- 菜单内容 -->
    <div class="menu-content" v-else>
      <van-tabs v-model:active="activeTab" sticky offset-top="46">
        <van-tab v-for="category in categories" :key="category" :title="category">
          <div class="dish-list">
            <div 
              v-for="dish in filteredDishesByCategory[category]" 
              :key="dish.id" 
              class="dish-item"
              :class="{ 'disabled': !dish.available }"
            >
            <van-image 
              width="85" 
              height="85" 
              radius="8" 
              :src="dish.image" 
              fit="cover"
              class="dish-img"
            >
                <template v-if="!dish.available" #error>
                    <div class="sold-out-mask">今日估清</div>
                </template>
            </van-image>
            
            <div class="dish-info">
              <div class="dish-header">
                <h3 class="dish-name">{{ dish.name }}</h3>
                <div v-if="!dish.available" class="tag-sold-out">估清</div>
              </div>
              
              <div class="dish-desc van-multi-ellipsis--l2">{{ dish.description }}</div>
              
              <div class="dish-tags">
                <van-tag 
                    v-for="tag in dish.tags" 
                    :key="tag" 
                    plain 
                    type="primary" 
                    size="mini"
                    class="mr-4"
                >{{ tag }}</van-tag>
                <van-tag v-if="dish.spicy > 0" color="#ffe1e1" text-color="#ad0000" size="mini">
                    {{ '🌶️'.repeat(dish.spicy) }}
                </van-tag>
              </div>

              <div class="dish-action">
                <span class="price"></span> 
                
                <div v-if="dish.available" class="stepper">
                    <transition name="van-fade">
                        <van-button 
                            v-if="getCount(dish.id) > 0"
                            icon="minus" 
                            size="mini" 
                            round 
                            plain
                            type="primary"
                            @click="minus(dish.id)"
                        />
                    </transition>
                    <span v-if="getCount(dish.id) > 0" class="count">{{ getCount(dish.id) }}</span>
                    <van-button 
                        icon="plus" 
                        size="mini" 
                        round 
                        type="primary"
                        @click="add(dish.id)"
                    />
                </div>
                <div v-else class="text-disabled">暂不可点</div>
              </div>
            </div>
          </div>
        </div>
      </van-tab>
      </van-tabs>
    </div>

    <van-empty v-if="!loading && categories.length === 0" description="没有找到相关菜品" />

    <!-- 底部悬浮条 -->
    <div class="bottom-cart-bar" v-if="totalCartCount > 0" @click="goToCart">
      <div class="cart-icon-wrapper">
        <van-icon name="shopping-cart" size="24" color="#fff" />
        <div class="badge">{{ totalCartCount }}</div>
      </div>
      <div class="cart-info">
        已选 {{ totalCartCount }} 道菜
      </div>
      <div class="go-btn">
        去选好了
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-page {
  padding-bottom: 80px;
}

.header-actions {
    display: flex;
    align-items: center;
    padding: 0 12px;
    background: #fff;
}

.search-bar {
    flex: 1;
    padding-left: 0;
}

.omakase-btn {
    flex-shrink: 0;
    margin-left: 8px;
    border-style: dashed;
}

.mt-20 {
    margin-top: 80px;
}

.dish-list {
  padding: 12px;
}

.dish-item {
  display: flex;
  margin-bottom: 16px;
  background: #fff;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.dish-img {
  flex-shrink: 0;
  margin-right: 12px;
  position: relative;
}

.sold-out-mask {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
}

.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dish-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.dish-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dish-desc {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
  line-height: 1.4;
}

.dish-tags {
    margin-bottom: 8px;
}
.mr-4 { margin-right: 4px; }

.dish-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stepper {
    display: flex;
    align-items: center;
}

.count {
    margin: 0 8px;
    font-size: 14px;
    font-weight: 500;
    min-width: 16px;
    text-align: center;
}

.text-disabled {
    font-size: 12px;
    color: #ccc;
}

.tag-sold-out {
    font-size: 10px;
    color: #999;
    border: 1px solid #eee;
    padding: 1px 4px;
    border-radius: 4px;
}

/* 底部购物车条 */
.bottom-cart-bar {
  position: fixed;
  bottom: 20px;
  left: 16px;
  right: 16px;
  height: 50px;
  background: #333;
  border-radius: 25px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.cart-icon-wrapper {
  width: 40px;
  height: 40px;
  background: #555;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-right: 12px;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ee0a24;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 14px;
  text-align: center;
}

.cart-info {
  flex: 1;
  color: #fff;
  font-size: 14px;
}

.go-btn {
  background: #1989fa;
  color: #fff;
  padding: 0 20px;
  height: 38px;
  line-height: 38px;
  border-radius: 19px;
  font-size: 14px;
  font-weight: 600;
}
</style>

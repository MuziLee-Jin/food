import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { api } from '@/data/api'

export const useDishStore = defineStore('dish', () => {
  // --- State ---
  const dishes = ref([])
  const loading = ref(false)
  
  // 购物车仍然可以保留在本地存储，因为它是用户个人的
  const cart = useStorage('foodorder-cart', [])

  // --- Actions ---
  
  // 初始化加载数据
  const init = async () => {
    loading.value = true
    try {
      dishes.value = await api.fetchDishes()
    } finally {
      loading.value = false
    }
  }

  // 这里的持久化逻辑在“纯前端”模式下需要监听 dishes 变化
  watch(dishes, (newVal) => {
    api.saveDishes(newVal)
  }, { deep: true })

  // --- Getters ---
  const getCartCount = (dishId) => {
    const item = cart.value.find(i => i.dishId === dishId)
    return item ? item.count : 0
  }

  const totalCartCount = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.count, 0)
  })

  const cartDetailList = computed(() => {
    return cart.value.map(item => {
      const dish = dishes.value.find(d => d.id === item.dishId)
      return {
        ...item,
        dish: dish || { name: '未知菜品', image: '', category: '未知' }
      }
    }).filter(item => item.count > 0)
  })

  const dishesByCategory = computed(() => {
    const groups = {}
    dishes.value.forEach(dish => {
      if (!groups[dish.category]) {
        groups[dish.category] = []
      }
      groups[dish.category].push(dish)
    })
    return groups
  })

  // --- Actions ---
  const updateCart = (dishId, delta) => {
    const index = cart.value.findIndex(i => i.dishId === dishId)
    if (index > -1) {
      cart.value[index].count += delta
      if (cart.value[index].count <= 0) {
        cart.value.splice(index, 1)
      }
    } else if (delta > 0) {
      cart.value.push({ dishId, count: delta, notes: '' })
    }
  }

  const clearCart = () => {
    cart.value = []
  }

  const updateNote = (dishId, note) => {
    const item = cart.value.find(i => i.dishId === dishId)
    if (item) {
      item.notes = note
    }
  }

  const addDish = (newDish) => {
    const maxId = dishes.value.length > 0 ? Math.max(...dishes.value.map(d => d.id)) : 0
    dishes.value.push({
      ...newDish,
      id: maxId + 1,
      available: true
    })
  }

  const toggleAvailable = (dishId) => {
    const dish = dishes.value.find(d => d.id === dishId)
    if (dish) {
      dish.available = !dish.available
    }
  }

  const deleteDish = (dishId) => {
    const index = dishes.value.findIndex(d => d.id === dishId)
    if (index > -1) {
      dishes.value.splice(index, 1)
    }
    const cartIndex = cart.value.findIndex(c => c.dishId === dishId)
    if (cartIndex > -1) {
      cart.value.splice(cartIndex, 1)
    }
  }

  return {
    dishes,
    loading,
    cart,
    init,
    getCartCount,
    totalCartCount,
    cartDetailList,
    dishesByCategory,
    updateCart,
    clearCart,
    updateNote,
    addDish,
    toggleAvailable,
    deleteDish
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

  // 移除旧的整体监听保存逻辑，改为在 action 中单独调用 api
  // watch(dishes, (newVal) => {
  //   api.saveDishes(newVal)
  // }, { deep: true })

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

  const addDish = async (newDish) => {
    // 乐观更新或等待返回
    loading.value = true
    try {
        const added = await api.addDish({
            ...newDish,
            available: true
        })
        dishes.value.push(added)
    } finally {
        loading.value = false
    }
  }

  const toggleAvailable = async (dishId) => {
    const dish = dishes.value.find(d => d.id === dishId)
    if (dish) {
      // 乐观更新 UI
      const originalStatus = dish.available
      dish.available = !dish.available
      
      try {
          await api.updateDish(dishId, { available: dish.available })
      } catch (e) {
          // 失败回滚
          dish.available = originalStatus
          console.error(e)
      }
    }
  }
  
  const deleteDish = async (dishId) => {
    const index = dishes.value.findIndex(d => d.id === dishId)
    if (index > -1) {
        // 乐观删除
        const deletedDish = dishes.value[index]
        dishes.value.splice(index, 1)
        
        // 购物车联动
        const cartIndex = cart.value.findIndex(c => c.dishId === dishId)
        if (cartIndex > -1) {
            cart.value.splice(cartIndex, 1)
        }

        try {
            await api.deleteDish(dishId)
        } catch (e) {
            // 失败恢复
            dishes.value.splice(index, 0, deletedDish)
        }
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

// 模拟 API 请求层，方便后续替换为真实的 axios/fetch 调用
import { initialDishes } from './mock'

const STORAGE_KEY = 'foodorder-dishes'

export const api = {
  // 获取所有菜品
  fetchDishes: async () => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : initialDishes
  },

  // 保存所有菜品 (当前用于 LocalStorage 模式)
  saveDishes: async (dishes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes))
    return true
  },

  // 后续可以增加：
  // createDish: (dish) => axios.post('/api/dishes', dish),
  // updateDish: (id, dish) => axios.put(`/api/dishes/${id}`, dish),
  // deleteDish: (id) => axios.delete(`/api/dishes/${id}`),
}

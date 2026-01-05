const API_BASE_URL = '/api'

export const api = {
  fetchDishes: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dishes`)
      if (!response.ok) throw new Error('Network response was not ok')
      return await response.json()
    } catch (error) {
      console.error('Fetch dishes failed:', error)
      return []
    }
  },

  saveDishes: async (dishes) => {
    return true
  },

  addDish: async (dish) => {
    const response = await fetch(`${API_BASE_URL}/dishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dish)
    })
    return await response.json()
  },

  updateDish: async (id, updates) => {
    const response = await fetch(`${API_BASE_URL}/dishes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return await response.json()
  },

  deleteDish: async (id) => {
    await fetch(`${API_BASE_URL}/dishes/${id}`, {
      method: 'DELETE'
    })
    return true
  },

  uploadImage: async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Upload failed')
    }

    const data = await response.json()
    return data.url
  },

  submitOrder: async (items) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Submit failed')
    }

    return await response.json()
  }
}

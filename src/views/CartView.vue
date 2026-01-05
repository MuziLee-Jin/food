<script setup>
import { computed, ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDishStore } from '@/stores/dishStore'
import { showDialog, showToast, showImagePreview, showLoadingToast } from 'vant'
import html2canvas from 'html2canvas'
import { api } from '@/data/api'

const store = useDishStore()
const router = useRouter()

const cartList = computed(() => store.cartDetailList)
const posterRef = ref(null) // 海报 DOM 引用
const submitting = ref(false)

onMounted(() => {
    if (store.dishes.length === 0) {
        store.init()
    }
})

const onCountChange = (dishId, value) => {
    const currentCount = store.getCartCount(dishId)
    const diff = value - currentCount
    if (diff !== 0) {
        store.updateCart(dishId, diff)
    }
}

// 备注绑定也需要特殊处理
const onNoteChange = (dishId, value) => {
    store.updateNote(dishId, value)
}

const confirmClear = () => {
    showDialog({
        title: '提示',
        message: '确定要清空购物车吗？',
        showCancelButton: true
    }).then(() => {
        store.clearCart()
    }).catch(() => {})
}

const generatePoster = async () => {
    if (cartList.value.length === 0) return

    try {
        await showDialog({
            title: '确认点餐',
            message: '将记录本次点餐次数，并生成海报用于发送。',
            showCancelButton: true
        })
    } catch (_) {
        return
    }

    if (submitting.value) return
    submitting.value = true

    const submitToast = showLoadingToast({
        message: '提交中...',
        forbidClick: true,
        duration: 0
    })

    let orderId = null
    try {
        const result = await api.submitOrder(cartList.value.map(i => ({
            dishId: i.dishId,
            quantity: i.count,
            note: i.notes || ''
        })))
        orderId = result?.orderId
        await store.init()
        submitToast.close()
    } catch (e) {
        console.error(e)
        submitToast.close()
        submitting.value = false
        showToast('提交失败，请重试')
        return
    }

    const loading = showLoadingToast({
        message: '海报生成中...',
        forbidClick: true,
        duration: 0
    })

    try {
        await nextTick()
        
        const canvas = await html2canvas(posterRef.value, {
            useCORS: true, 
            backgroundColor: '#ffffff',
            scale: 2 
        })
        
        const imgUrl = canvas.toDataURL('image/png')
        loading.close()

        if (orderId) {
            showToast(`已记录点餐 #${orderId}`)
        } else {
            showToast('已记录点餐')
        }
        
        // 自动触发下载 (PC端友好，H5端主要靠长按)
        const link = document.createElement('a')
        link.href = imgUrl
        link.download = `点餐单_${new Date().getTime()}.png`
        link.click()

        showImagePreview({
            images: [imgUrl],
            closeable: true,
            showIndex: false,
            onClose: () => {
                showToast('已保存到相册(若支持)或请长按图片手动保存')
            }
        })

        try {
            await showDialog({
                title: '完成',
                message: '是否清空购物车？',
                showCancelButton: true,
                confirmButtonText: '清空',
                cancelButtonText: '保留'
            })
            store.clearCart()
        } catch (_) {}
        
    } catch (e) {
        console.error(e)
        loading.close()
        showToast('生成失败，请重试')
    } finally {
        submitting.value = false
    }
}
</script>

<template>
  <div class="cart-page">
     <van-nav-bar title="确认点餐" left-arrow @click-left="router.back()" fixed placeholder />
     
     <div v-if="cartList.length === 0" class="empty-state">
        <van-empty description="还没点菜呢" />
        <van-button type="primary" size="small" round @click="router.back()">去看看菜单</van-button>
     </div>
     
     <div v-else class="cart-content">
        <div class="cart-list">
           <div v-for="item in cartList" :key="item.dishId" class="cart-item">
              <van-image :src="item.dish.image" width="60" height="60" radius="4" fit="cover" class="dish-img" />
              <div class="item-info">
                 <div class="item-header">
                    <span class="name">{{ item.dish.name }}</span>
                    <van-stepper 
                        :model-value="item.count" 
                        min="0" 
                        max="20" 
                        integer
                        button-size="22"
                        @change="(val) => onCountChange(item.dishId, val)"
                    />
                 </div>
                 <van-field 
                    :model-value="item.notes"
                    @update:model-value="(val) => onNoteChange(item.dishId, val)"
                    placeholder="口味备注：如微辣、少油..." 
                    class="note-input"
                    border
                 />
              </div>
           </div>
        </div>
        
        <div class="cart-footer-spacer"></div>
        <div class="cart-footer">
            <div class="footer-info">
                共 <span class="highlight">{{ store.totalCartCount }}</span> 道菜
            </div>
            <div class="footer-actions">
                <van-button plain type="danger" size="normal" round @click="confirmClear" class="mr-2">清空</van-button>
                <van-button type="primary" size="normal" round class="submit-btn" icon="photo-o" :loading="submitting" :disabled="submitting" @click="generatePoster">
                    提交并生成海报
                </van-button>
            </div>
        </div>
     </div>

    <!-- 隐藏的海报生成区域 -->
    <div class="poster-container" ref="posterRef">
        <div class="poster-bg-pattern"></div>
        <div class="poster-content-layer">
            <div class="poster-header">
                <div class="poster-title">今日菜单</div>
                <div class="poster-date">{{ new Date().toLocaleDateString() }}</div>
            </div>
            <div class="poster-divider"></div>
            <div class="poster-list">
                <div v-for="(item, index) in cartList" :key="item.dishId" class="poster-item">
                    <div class="poster-item-row">
                        <span class="poster-name">{{ index + 1 }}. {{ item.dish.name }}</span>
                        <span class="poster-count">x{{ item.count }}</span>
                    </div>
                    <div v-if="item.notes" class="poster-note">({{ item.notes }})</div>
                </div>
            </div>
            <div class="poster-divider"></div>
            <div class="poster-footer">
                <div class="poster-total">共 {{ store.totalCartCount }} 道菜</div>
                <div class="poster-sign">
                    <span class="sign-icon">👨‍🍳</span> 幻光小厨 · 诚意出品
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* 海报样式 (移出屏幕不可见) */
.poster-container {
    position: fixed;
    top: 0;
    left: -9999px;
    width: 375px;
    /* 基础背景色 */
    background: linear-gradient(135deg, #fffcf5 0%, #fff7e6 100%);
    padding: 30px 20px;
    box-sizing: border-box;
    font-family: 'PingFang SC', sans-serif;
    color: #5c3a19; /* 深棕色文字，更柔和 */
    z-index: -1;
    overflow: hidden;
    border-radius: 0;
}

/* 装饰纹理 */
.poster-bg-pattern {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: 
        radial-gradient(#ffddaa 2px, transparent 2px),
        radial-gradient(#ffddaa 2px, transparent 2px);
    background-size: 30px 30px;
    background-position: 0 0, 15px 15px;
    opacity: 0.3;
    z-index: 0;
}

/* 边框装饰 */
.poster-container::after {
    content: "";
    position: absolute;
    top: 12px; left: 12px; right: 12px; bottom: 12px;
    border: 2px solid #e6b88a;
    border-radius: 12px;
    pointer-events: none;
    z-index: 1;
}

.poster-content-layer {
    position: relative;
    z-index: 2;
    background: rgba(255, 255, 255, 0.6); /* 半透明白底衬托文字 */
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(139, 90, 43, 0.05);
}

.poster-header {
    text-align: center;
    margin-bottom: 20px;
}

.poster-title {
    font-size: 26px;
    font-weight: bold;
    color: #4a2c0f;
    margin-bottom: 8px;
    letter-spacing: 2px;
}

.poster-date {
    font-size: 14px;
    color: #8c6b4a;
}

.poster-divider {
    border-top: 2px dashed #dcbca0;
    margin: 16px 0;
    opacity: 0.6;
}

.poster-list {
    min-height: 100px;
}

.poster-item {
    margin-bottom: 14px;
}

.poster-item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
}

.poster-name {
    flex: 1;
}

.poster-count {
    font-weight: bold;
    margin-left: 12px;
    color: #d35400; /* 数量突出显示 */
}

.poster-note {
    font-size: 14px;
    color: #8c7b6a;
    margin-top: 4px;
    padding-left: 20px;
    font-style: italic;
}

.poster-footer {
    text-align: center;
    margin-top: 30px;
}

.poster-total {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 12px;
    color: #4a2c0f;
}

.poster-sign {
    font-size: 14px;
    color: #8c6b4a;
    background: #fff;
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    border: 1px solid #ebdccb;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.cart-page {
    background: #f7f8fa;
    min-height: 100vh;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 50px;
}

.cart-list {
    padding: 12px;
}

.cart-item {
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.dish-img {
    margin-right: 12px;
    flex-shrink: 0;
}

.item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.name {
    font-weight: 600;
    font-size: 15px;
}

.note-input {
    padding: 4px 8px;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 12px;
}

/* 覆盖 vant field 默认样式 */
.note-input :deep(.van-cell__value) {
    background: transparent;
}

.cart-footer-spacer {
    height: 80px;
}

.cart-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    z-index: 100;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
}

.footer-info {
    font-size: 14px;
    color: #333;
}

.highlight {
    color: #ee0a24;
    font-weight: bold;
    font-size: 18px;
}

.footer-actions {
    display: flex;
    align-items: center;
}

.mr-2 {
    margin-right: 12px;
}

.submit-btn {
    padding: 0 24px;
    font-weight: 600;
}
</style>

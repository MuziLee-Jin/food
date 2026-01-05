<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDishStore } from '@/stores/dishStore'
import { storeToRefs } from 'pinia'
import { showToast, showDialog, showLoadingToast } from 'vant'
import { api } from '@/data/api'

const router = useRouter()
const store = useDishStore()
const { dishesByCategory, dishes, loading } = storeToRefs(store)

const showAddPopup = ref(false)
const showImport = ref(false)
const importJson = ref('')
const uploaderFiles = ref([])
const uploadingImage = ref(false)

onMounted(() => {
    store.init()
})

const onAfterRead = async (item) => {
    const file = Array.isArray(item) ? item[0]?.file : item?.file
    if (!file) return

    uploadingImage.value = true
    const toast = showLoadingToast({ message: '图片上传中...', forbidClick: true, duration: 0 })
    try {
        const url = await api.uploadImage(file)
        newDish.image = url
        showToast('上传成功')
    } catch (e) {
        console.error(e)
        showToast('上传失败')
    } finally {
        toast.close()
        uploadingImage.value = false
    }
}

const newDish = reactive({
    name: '',
    category: '热菜',
    spicy: 0,
    tagsStr: '',
    image: ''
})

const categories = ['热菜', '凉菜', '主食', '饮料', '汤羹']

const onSubmit = async () => {
    if (!newDish.name) {
        showToast('菜名必填')
        return
    }
    await store.addDish({
        name: newDish.name,
        category: newDish.category,
        spicy: newDish.spicy,
        tags: newDish.tagsStr.split(/[,， ]/).filter(t => t),
        description: '暂无描述',
        image: newDish.image
    })
    showAddPopup.value = false
    showToast('添加成功')
    
    // reset
    newDish.name = ''
    newDish.tagsStr = ''
    newDish.spicy = 0
    newDish.image = ''
    uploaderFiles.value = []
}

const onDelete = (id) => {
    showDialog({ 
        title: '确认删除？', 
        message: '删除后无法恢复',
        showCancelButton: true 
    })
    .then(() => store.deleteDish(id))
    .catch(() => {})
}

// 导出功能
const showExport = async () => {
    // 只导出必要字段
    const data = JSON.stringify(dishes.value, null, 2)
    try {
        await navigator.clipboard.writeText(data)
        showDialog({
            title: '配置已复制',
            message: '您可以：\n1. 发送给朋友导入\n2. 粘贴到 src/data/mock.js 更新默认数据',
        })
    } catch (e) {
        showToast('复制失败')
        console.error(e)
    }
}

// 导入功能
const handleImport = () => {
    try {
        const data = JSON.parse(importJson.value)
        if (Array.isArray(data)) {
            store.dishes = data
            showToast('导入成功')
            importJson.value = ''
        } else {
            showToast('数据格式错误')
        }
    } catch (e) {
        showToast('无效的 JSON')
    }
}
</script>

<template>
  <div class="admin-page">
    <van-nav-bar title="后厨管理" left-text="返回菜单" left-arrow @click-left="router.push('/')" fixed placeholder>
        <template #right>
            <van-icon name="plus" size="18" @click="showAddPopup = true" />
        </template>
    </van-nav-bar>

    <van-loading v-if="loading" vertical class="mt-20">同步中...</van-loading>

    <div v-else class="list-container">
        <template v-for="(group, category) in dishesByCategory" :key="category">
            <div class="category-title">{{ category }}</div>
            <van-cell-group inset class="mb-3">
                <van-swipe-cell v-for="dish in group" :key="dish.id">
                    <van-card
                        :desc="dish.tags.join(' ')"
                        :title="dish.name"
                        :thumb="dish.image"
                        class="admin-card"
                    >
                        <template #tags>
                            <van-tag plain type="success" class="mr-1">已点{{ dish.order_count || 0 }}</van-tag>
                            <van-tag v-if="dish.spicy > 0" plain type="warning" class="mr-1">辣{{ dish.spicy }}</van-tag>
                            <van-tag plain type="danger" v-if="!dish.available">已估清</van-tag>
                        </template>
                        <template #footer>
                            <div class="card-actions">
                                <span class="action-label">{{ dish.available ? '供应中' : '已估清' }}</span>
                                <van-switch 
                                    :model-value="dish.available" 
                                    size="20px" 
                                    @update:model-value="store.toggleAvailable(dish.id)" 
                                />
                            </div>
                        </template>
                    </van-card>
                    <template #right>
                        <van-button square text="删除" type="danger" class="delete-button" @click="onDelete(dish.id)" />
                    </template>
                </van-swipe-cell>
            </van-cell-group>
        </template>
        
        <div class="empty-tip" v-if="Object.keys(dishesByCategory).length === 0">
            暂无菜品，快去添加吧
        </div>
        
        <!-- 数据管理区域 -->
        <div class="data-manage-section">
            <div class="section-title">数据管理</div>
            <van-cell-group inset>
                <van-cell title="导出菜单配置" is-link @click="showExport" label="复制配置数据，分享给朋友或备份" />
                <van-cell title="导入菜单配置" is-link @click="showImport = true" label="粘贴配置数据以覆盖当前菜单" />
            </van-cell-group>
        </div>
    </div>

    <!-- 添加弹窗 -->
    <van-popup v-model:show="showAddPopup" position="bottom" round :style="{ height: '70%' }">
        <div class="popup-content">
            <h3 class="popup-title">录入新菜</h3>
            <van-form @submit="onSubmit">
                <van-cell-group inset>
                    <van-field 
                        v-model="newDish.name" 
                        name="name" 
                        label="菜名" 
                        placeholder="例如：番茄炒蛋" 
                        :rules="[{ required: true, message: '请填写菜名' }]" 
                    />
                    
                    <van-field name="category" label="分类">
                        <template #input>
                            <van-radio-group v-model="newDish.category" direction="horizontal">
                                <van-radio v-for="c in categories" :key="c" :name="c">{{ c }}</van-radio>
                            </van-radio-group>
                        </template>
                    </van-field>

                    <van-field name="spicy" label="辣度">
                         <template #input>
                            <van-stepper v-model="newDish.spicy" min="0" max="5" />
                         </template>
                    </van-field>

                    <van-field v-model="newDish.tagsStr" name="tags" label="标签" placeholder="空格分隔，如：推荐 耗时" />
                    
                    <van-field name="imageUpload" label="图片">
                        <template #input>
                            <van-uploader
                                v-model="uploaderFiles"
                                :max-count="1"
                                :after-read="onAfterRead"
                                :disabled="uploadingImage"
                            />
                        </template>
                    </van-field>

                    <van-field v-model="newDish.image" name="image" label="图片URL" placeholder="上传后自动生成或手动填写" />
                </van-cell-group>
                <div style="margin: 24px 16px;">
                    <van-button round block type="primary" native-type="submit" :loading="uploadingImage" :disabled="uploadingImage">
                    提交录入
                    </van-button>
                </div>
            </van-form>
        </div>
    </van-popup>

    <!-- 导入弹窗 -->
    <van-dialog v-model:show="showImport" title="导入配置" show-cancel-button @confirm="handleImport">
        <div class="import-container">
            <van-field
                v-model="importJson"
                rows="5"
                autosize
                type="textarea"
                placeholder="在此粘贴 JSON 配置数据..."
                border
            />
            <div class="import-tip">警告：导入将完全覆盖当前所有菜品数据！</div>
        </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.admin-page {
    background: #f7f8fa;
    min-height: 100vh;
    padding-bottom: 20px;
}

.mt-20 {
    margin-top: 80px;
}

.category-title {
    padding: 16px 16px 8px;
    font-size: 14px;
    color: #969799;
    font-weight: 600;
}

.mb-3 {
    margin-bottom: 12px;
}

.admin-card {
    background: #fff;
}

.card-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.action-label {
    font-size: 12px;
    color: #666;
    margin-right: 8px;
}

.delete-button {
    height: 100%;
}

.popup-content {
    padding-top: 10px;
}

.popup-title {
    text-align: center;
    margin-bottom: 20px;
    font-size: 18px;
    color: #333;
}

.mr-1 {
    margin-right: 4px;
}

.empty-tip {
    text-align: center;
    color: #999;
    padding: 40px;
}

.data-manage-section {
    margin-top: 30px;
}

.section-title {
    padding: 0 16px 8px;
    font-size: 14px;
    color: #969799;
    font-weight: 600;
}

.import-container {
    padding: 16px;
}

.import-tip {
    font-size: 12px;
    color: #ee0a24;
    margin-top: 8px;
    text-align: center;
}
</style>

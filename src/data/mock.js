// 初始 Mock 数据
export const initialDishes = [
  {
    id: 1,
    name: '红烧肉',
    description: '肥而不腻，经典本帮口味',
    category: '热菜',
    tags: ['推荐', '耗时'],
    spicy: 0, // 0-不辣, 1-微辣, 2-中辣, 3-特辣
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', // 占位图
    available: true
  },
  {
    id: 2,
    name: '拍黄瓜',
    description: '清爽解腻，加了蒜泥',
    category: '凉菜',
    tags: ['快手'],
    spicy: 1,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  },
  {
    id: 3,
    name: '酸辣土豆丝',
    description: '脆爽口感',
    category: '热菜',
    tags: ['素食'],
    spicy: 2,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  },
  {
    id: 4,
    name: '番茄炒蛋',
    description: '国民下饭菜，甜口',
    category: '热菜',
    tags: ['儿童喜爱'],
    spicy: 0,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  },
  {
    id: 5,
    name: '可乐',
    description: '冰镇快乐水',
    category: '饮料',
    tags: [],
    spicy: 0,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  }
]

export const categories = ['热菜', '凉菜', '主食', '饮料', '汤羹']

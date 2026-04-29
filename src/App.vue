<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
const route = useRouter()

const activeMenu = ref('helloWorld')
const sidebarOpen = ref(false) // 移动端侧边栏状态

// 监听路由变化
watch(() => {
  console.log(route)
})

const menuItems = [
  { id: 'TimeShow', name: '显示当前时间应用', path: '/TimeShow' },
  { id: 'AiRequirement', name: 'AI 需求解析', path: '/aiRequirement' },
  { id: 'Three', name: '3D场景', path: '/three' },
  { id: '3DVisualizationPipeline', name: '3D可视化流水线', path: '/3DVisualizationPipeline' },
  // { id: 'router', name: '路由练习', path: '/routerTest' },
  // { id: 'reactive', name: '响应式API', path: '#' },
  // { id: 'composables', name: '组合式函数', path: '#' },
  // { id: 'directives', name: '自定义指令', path: '#' },
  // { id: 'store', name: '状态管理', path: '#' }
]

const handleMenuClick = (menuId) => {
  console.log(menuId)
  activeMenu.value = menuId
  sidebarOpen.value = false // 点击菜单后关闭侧边栏
  if (menuId !== 'router') {
    route.push(menuId)
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="app-container">
    <!-- 移动端菜单按钮 -->
    <button class="sidebar-toggle" @click="toggleSidebar">
      <span></span>
      <span></span>
      <span></span>
    </button>
    
    <!-- 移动端遮罩层 -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
    
    <!-- 左侧菜单 -->
    <aside class="sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="logo">Vue3练习系统</div>
      <ul class="menu">
        <li v-for="item in menuItems" :key="item.id" class="menu-item">
          <a 
            :href="item.path" 
            class="menu-link" 
            :class="{ active: activeMenu === item.id }"
            @click.prevent="handleMenuClick(item.id)"
          >
            {{ item.name }}
          </a>
        </li>
      </ul>
    </aside>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <main>
        <router-view />
      </main>
    </div>
  </div>
</template>

<style>
* {
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  overflow-x: hidden;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

/* 移动端菜单按钮 */
.sidebar-toggle {
  display: none;
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1001;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle span {
  display: block;
  width: 20px;
  height: 2px;
  background: #333;
  margin: 3px 0;
  transition: all 0.3s ease;
}

.sidebar-toggle:hover {
  background: #f5f5f5;
}

/* 移动端遮罩层 */
.sidebar-overlay {
  display: none;
}

.sidebar {
  width: 240px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 20px 0;
  flex-shrink: 0;
}

.sidebar .logo {
  padding: 0 20px 20px;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.menu {
  list-style: none;
}

.menu-item {
  margin: 5px 10px;
  border-radius: 4px;
}

.menu-link {
  display: block;
  padding: 10px 20px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
}

.menu-link:hover {
  background-color: #e0e0e0;
  color: #007bff;
}

.menu-link.active {
  background-color: #007bff;
  color: white;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  background-color: white;
}

header .logos {
  display: flex;
  gap: 20px;
}

header .logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

header .logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

header .logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

main {
  flex: 1;
  /* padding: 20px; */
  background-color: #f9f9f9;
}

main h1 {
  margin-bottom: 20px;
  color: #333;
}

main p {
  color: #666;
  font-size: 16px;
}

/* 平板端适配 */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }
}

/* 手机端适配 */
@media (max-width: 768px) {
  /* 显示菜单按钮 */
  .sidebar-toggle {
    display: flex;
  }
  
  /* 侧边栏改为抽屉式 */
  .sidebar {
    position: fixed;
    top: 0;
    left: -240px;
    width: 240px;
    height: 100vh;
    background: #f5f5f5;
    z-index: 1000;
    transition: left 0.3s ease;
    overflow-y: auto;
  }
  
  .sidebar.is-open {
    left: 0;
  }
  
  /* 显示遮罩层 */
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
  
  /* 主内容区全屏 */
  .main-content {
    width: 100%;
  }
  
  main {
    /* padding: 10px; */
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .sidebar {
    width: 220px;
    left: -220px;
  }
  
  .sidebar .logo {
    font-size: 16px;
  }
  
  .menu-link {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>
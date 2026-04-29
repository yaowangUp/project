<template>
  <div class="factory-container">
    <!-- 顶部标题栏 -->
    <header class="header">
      <!-- 移动端菜单按钮 -->
      <button class="menu-toggle" @click="toggleMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="logo">精工机械智慧工厂</div>
    </header>

    <!-- 移动端遮罩层 -->
    <div v-if="menuOpen" class="menu-overlay" @click="toggleMenu"></div>

    <!-- 主视图区域 -->
    <div class="main-view">
      <!-- 左侧信息面板 -->
      <aside class="info-panel" :class="{ 'is-open': menuOpen }">
        <div class="panel-section">
          <h3>📊 产线概览</h3>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-value">{{ stats.output }}</span>
              <span class="stat-label">今日产量(片)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.quality }}%</span>
              <span class="stat-label">钢化合格率</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.efficiency }}%</span>
              <span class="stat-label">设备效率</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.energy }}kWh</span>
              <span class="stat-label">能耗</span>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>✨ 核心能力</h3>
          <ul class="feature-list">
            <li>✓ 自动排版</li>
            <li>✓ 自动上下片</li>
            <li>✓ 自动调工艺参数</li>
            <li>✓ 稳步提升钢化质量</li>
          </ul>
        </div>

        <div class="panel-section"></div>
      </aside>

      <!-- 3D 场景区域 -->
      <main class="three-view">
        <div id="three-container"></div>
        
        <!-- 设备标签覆盖层 -->
        <div class="labels-overlay">
          <div 
            v-for="label in deviceLabels" 
            :key="label.id"
            class="device-label"
            :style="{ left: label.screenX + 'px', top: label.screenY + 'px' }"
          >
            {{ label.name }}
          </div>
        </div>
        
        <!-- 操作提示 -->
        <div class="hint-box">
          <span>🖱️ 拖动旋转 | 滚轮缩放 | 右键平移 | 点击设备查看详情</span>
        </div>

        <!-- 设备信息提示框 -->
        <div 
          v-if="selectedDevice" 
          class="device-tooltip"
          :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
        >
          <div class="tooltip-header">
            <span class="tooltip-icon">🔧</span>
            <span class="tooltip-name">{{ selectedDevice.name }}</span>
          </div>
          <div class="tooltip-content">
            <p><strong>状态:</strong> {{ selectedDevice.status }}</p>
            <p><strong>类型:</strong> {{ selectedDevice.type }}</p>
            <p><strong>参数:</strong> {{ selectedDevice.params }}</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
// 引入轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// 响应式数据
const selectedDevice = ref(null) // 选中的设备
const tooltipPos = reactive({ x: 0, y: 0 }) // 设备信息提示框位置
const deviceLabels = reactive([]) // 设备标签数组
const menuOpen = ref(false) // 移动端菜单状态

// 左侧数据驾驶舱
const stats = reactive({
  output: 12580,
  quality: 99.2,
  efficiency: 94.5,
  energy: 3420
})

let scene, camera, renderer, controls, animationId // 场景、相机、渲染器、轨道控制器、动画ID
let raycaster, mouse // 射线投射器、鼠标对象
let devices = [] // 设备对象数组
let glassSheets = [] // 玻璃片对象数组

// 切换移动端菜单
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

// 设备数据
const deviceData = [
  { id: 1, name: '自动上片机', type: '上片设备', status: '运行中', params: '速度: 45片/h', position: [-18, 0, -8] },
  { id: 2, name: '钢化炉(加热段)', type: '核心设备', status: '运行中', params: '温度: 692℃', position: [-10, 0, -5] },
  { id: 3, name: '钢化炉(冷却段)', type: '核心设备', status: '运行中', params: '风压: 0.8MPa', position: [-2, 0, -5] },
  { id: 4, name: '冷却风栅', type: '冷却设备', status: '运行中', params: '风速: 45m/s', position: [6, 0, -5] },
  { id: 5, name: '自动下片机', type: '下片设备', status: '运行中', params: '效率: 98%', position: [14, 0, -8] },
  { id: 6, name: '玻璃仓储区', type: '仓储设备', status: '正常', params: '容量: 500片', position: [-15, 0, 8] },
  { id: 7, name: '质检设备', type: '检测设备', status: '运行中', params: '精度: 0.1mm', position: [12, 0, 5] },
  { id: 8, name: '空压机站', type: '动力设备', status: '正常', params: '压力: 0.8MPa', position: [0, 0, 12] }
]

// 创建工厂地面
const createFloor = () => {
  // 创建工厂地面
  const floorGeo = new THREE.PlaneGeometry(50, 35)
  // 创建工厂地面材质
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x3a4a5a, 
    roughness: 0.8, // 地面粗糙度
    metalness: 0.2, // 地面金属度
  })
  // 创建工厂地面网格
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // 创建工厂地面边界框
  const borderMat = new THREE.MeshStandardMaterial({ color: 0xc4a35a, roughness: 0.6 })
  const borderWidth = 0.2 // 边框宽度
  
  // 创建工厂地面边界框
  // 长边界框
  const longBorder = new THREE.Mesh(new THREE.BoxGeometry(50, 0.1, borderWidth), borderMat)
  // 长边界框位置
  longBorder.position.set(0, 0.05, -17.5 + borderWidth/2)
  scene.add(longBorder.clone())
  // 长边界框位置坐标
  longBorder.position.z = 17.5 - borderWidth/2
  scene.add(longBorder)

  // 创建工厂地面边界框
  // 短边界框
  const shortBorder = new THREE.Mesh(new THREE.BoxGeometry(borderWidth, 0.1, 35 - borderWidth), borderMat)
  // 短边界框位置
  shortBorder.position.set(-25 + borderWidth/2, 0.05, 0)
  scene.add(shortBorder.clone())
  // 短边界框位置坐标
  shortBorder.position.x = 25 - borderWidth/2
  scene.add(shortBorder)

  // 创建网格辅助线
  const gridHelper = new THREE.GridHelper(50, 50, 0x4a5a6a, 0x3a4a5a)
  // 网格辅助线坐标
  gridHelper.position.y = 0.02
  scene.add(gridHelper)
}

// 创建设备模型
const createDevice = (data) => {
  // 创建设备模型组
  const group = new THREE.Group()
  group.position.set(...data.position)
  group.userData = data

  let geometry, material // 设备模型几何体和材质

  switch(data.type) {
    case '核心设备':
      geometry = new THREE.BoxGeometry(6, 2.5, 3) // 核心设备几何体
      material = new THREE.MeshStandardMaterial({ // 核心设备材质
        color: 0x5a4a3a, 
        roughness: 0.4, // 核心设备粗糙度
        metalness: 0.7, // 核心设备金属度
        emissive: 0x2a1a0a
      })
      break
    case '上片设备':
    case '下片设备':
      geometry = new THREE.BoxGeometry(3, 1.8, 4) // 下片设备几何体
      material = new THREE.MeshStandardMaterial({ // 下片设备材质
        color: 0x3a6a8a, 
        roughness: 0.3, // 下片设备粗糙度
        metalness: 0.8 // 下片设备金属度
      })
      break
    case '冷却设备':
      geometry = new THREE.BoxGeometry(4, 2, 2.5)
      material = new THREE.MeshStandardMaterial({ 
        color: 0x3a8a7a, 
        roughness: 0.3, // 冷却设备粗糙度
        metalness: 0.7 // 冷却设备金属度
      })
      break
    case '仓储设备':
      geometry = new THREE.BoxGeometry(5, 3, 4)
      material = new THREE.MeshStandardMaterial({ 
        color: 0x6a5a4a, 
        roughness: 0.5, // 仓储设备粗糙度
        metalness: 0.5 // 仓储设备金属度
      })
      break
    case '检测设备':
      geometry = new THREE.BoxGeometry(2.5, 1.5, 2)
      material = new THREE.MeshStandardMaterial({ 
        color: 0x4a8a6a, 
        roughness: 0.2, // 检测设备粗糙度
        metalness: 0.8 // 检测设备金属度
      })
      break
    case '动力设备':
      geometry = new THREE.CylinderGeometry(2, 2, 1.5, 32)
      material = new THREE.MeshStandardMaterial({ 
        color: 0x5a5a6a, 
        roughness: 0.3, // 动力设备粗糙度
        metalness: 0.9 // 动力设备金属度
      })
      break
    default:
      geometry = new THREE.BoxGeometry(3, 2, 3)
      material = new THREE.MeshStandardMaterial({ 
        color: 0x4a5a6a, 
        roughness: 0.4, // 其他设备粗糙度
        metalness: 0.6 // 其他设备金属度
      })
  }

  // 设备模型位置
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = geometry.parameters.height / 2 || 1
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)

  // 设备模型灯光位置
  const lightGeo = new THREE.SphereGeometry(0.15)
  // 设备模型灯光材质
  const lightMat = new THREE.MeshStandardMaterial({ 
    color: data.status === '运行中' ? 0x00ff00 : 0xffff00,
    emissive: data.status === '运行中' ? 0x00ff00 : 0xffff00, // 设备模型灯光颜色
    emissiveIntensity: 1 // 设备模型灯光强度
  })
  // 设备模型指示灯光位置
  const light = new THREE.Mesh(lightGeo, lightMat)
  light.position.y = mesh.position.y + 0.5
  light.position.x = geometry.parameters.width / 2 + 0.5 || 2
  group.add(light)

  // 存储设备信息用于 HTML 标签
  deviceLabels.push({
    id: data.id,
    name: data.name,
    worldPos: new THREE.Vector3(data.position[0], mesh.position.y + 1.5, data.position[2]),// 设备模型位置
    screenX: 0,
    screenY: 0
  })
  return group
}

// 创建传送带
const createConveyor = (startX, endX, z) => {
  // 创建传送带组
  const conveyorGroup = new THREE.Group()
  // 传送带长度
  const length = Math.abs(endX + 3 - startX)
  // 传送带方向
  const direction = startX < endX ? 1 : -1
  
  // 传送带位置
  const beltGeo = new THREE.BoxGeometry(length, 0.1, 1.5)
  // 传送带材质
  const beltMat = new THREE.MeshStandardMaterial({ 
    color: 0x2a3a4a, 
    roughness: 0.8,
    metalness: 0.3
  })
  
  // 传送带中间材质
  const belt = new THREE.Mesh(beltGeo, beltMat)
  belt.position.set(startX + length * direction / 2, 0.3, z)
  belt.castShadow = true
  conveyorGroup.add(belt)
  
  // 传送带边缘位置
  const edgeMat = new THREE.MeshStandardMaterial({ 
    color: 0x4a5a6a, 
    roughness: 0.5, // 传送带边缘粗糙度 
    metalness: 0.8 // 传送带边缘金属度
  })
  // 传送带边缘位置
  const edge = new THREE.Mesh(new THREE.BoxGeometry(length, 0.15, 0.1), edgeMat)
  edge.position.set(startX + length * direction / 2, 0.35, z + 0.75)
  conveyorGroup.add(edge.clone())
  edge.position.z = z - 0.75
  conveyorGroup.add(edge)

  // 传送带腿位置
  const legMat = new THREE.MeshStandardMaterial({ 
    color: 0x3a4a5a, 
    roughness: 0.4, // 传送带腿粗糙度
    metalness: 0.9 // 传送带腿金属度
  })
  // 遍历生成传送带腿
  for (let i = 0; i <= 4; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.15), legMat)
    leg.position.set(startX + (length / 4) * i * direction, 0.15, z + 0.6)
    // 传送带腿添加到传送带组
    conveyorGroup.add(leg.clone())
    leg.position.z = z - 0.6
    // 另一侧传送带腿添加到传送带组
    conveyorGroup.add(leg)
  }
  // 添加传送带组到场景
  scene.add(conveyorGroup)
}

// 创建玻璃片
const createGlassSheets = () => {
  const glassMat = new THREE.MeshStandardMaterial({ 
    color: 0x88ccff, 
    roughness: 0.1, // 玻璃片粗糙度
    metalness: 0.1, // 玻璃片金属度
    transparent: true, // 玻璃片是否透明
    opacity: 0.7 // 玻璃片透明度
  })

  // 玻璃片数量
  const glassCount = 12
  // 遍历生成玻璃片
  for (let i = 0; i < glassCount; i++) {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), glassMat)
    glass.castShadow = true // 玻璃片是否投阴影
    glass.receiveShadow = true // 玻璃片是否接收阴影
    
    // 根据不同传送带位置分布玻璃片
    const conveyorIndex = Math.floor(i / 3)
    let startX, endX, zPos
    // 玻璃片位置
    switch(conveyorIndex) {
      case 0:
        startX = -15; endX = -12; zPos = -5; break
      case 1:
        startX = -7; endX = -4; zPos = -5; break
      case 2:
        startX = 1; endX = 4; zPos = -5; break
      case 3:
        startX = 8; endX = 11; zPos = -5; break
      default:
        startX = -15; endX = -12; zPos = -5
    }
    // 随机生成玻璃片位置
    glass.position.set(
      startX + Math.random() * (endX - startX), 
      0.38, 
      zPos + (Math.random() - 0.5) * 0.5
    )
    // 玻璃片信息（ID、类型、速度、起始位置、结束位置）
    glass.userData = {
      id: i,
      type: '玻璃片',
      speed: 0.2 + Math.random() * 0.4,
      startX: startX,
      endX: endX
    }
    // 玻璃片添加到场景
    scene.add(glass)
    // 玻璃片添加到玻璃片数组
    glassSheets.push(glass)
  }
}

// 创建生产线布局
const createProductionLine = () => {
  deviceData.forEach(data => {
    const device = createDevice(data)
    // 设备添加到场景
    scene.add(device)
    // 设备添加到设备数组
    devices.push(device)
  })

  // 流水线区传送带
  createConveyor(-15, -12, -5)
  createConveyor(-7, -4, -5)
  createConveyor(1, 4, -5)
  createConveyor(8, 11, -5)

  createConveyor(-18, -12, 5) // 玻璃仓储区传送带
  createConveyor(11, 14, 2) // 质检设备传送带
  
  // 调用开始创建 添加玻璃片
  createGlassSheets()
}

// 初始化 Three.js
const initThree = () => {
  // 容器元素
  const container = document.getElementById('three-container')
  // 场景
  scene = new THREE.Scene()
  // 场景背景
  scene.background = new THREE.Color(0x1a2a3a)
  // 场景雾效
  scene.fog = new THREE.Fog(0x1a2a3a, 30, 80)

  // 容器比例设置
  const aspect = container.clientWidth / container.clientHeight
  // 相机初始化
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
  // 相机位置
  camera.position.set(30, 25, 35)
  // 相机看向场景中心
  camera.lookAt(0, 0, 0)

  // 渲染器初始化
  renderer = new THREE.WebGLRenderer({ antialias: true })
  // 渲染器大小设置
  renderer.setSize(container.clientWidth, container.clientHeight)
  // 渲染器像素比设置
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 10
  controls.maxDistance = 80
  controls.maxPolarAngle = Math.PI / 2.2
  controls.target.set(0, 2, 0)
  
  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight)

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(20, 30, 20)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 100
  directionalLight.shadow.camera.left = -40
  directionalLight.shadow.camera.right = 40
  directionalLight.shadow.camera.top = 40
  directionalLight.shadow.camera.bottom = -40
  scene.add(directionalLight)

  // 点光源
  const fillLight = new THREE.PointLight(0x4488ff, 0.5, 50)
  fillLight.position.set(-15, 10, -15)
  scene.add(fillLight)

  // 创建地板
  createFloor()
  // 创建生产线布局
  createProductionLine()

  // 创建射线检测器
  raycaster = new THREE.Raycaster()
  // 创建鼠标向量
  mouse = new THREE.Vector2()

  // 绑定点击事件
  container.addEventListener('click', onMouseClick)
}

// 鼠标点击事件
const onMouseClick = (event) => {
  // 获取容器元素
  const container = document.getElementById('three-container')
  // 获取容器元素的矩形信息
  const rect = container.getBoundingClientRect()
  // 计算鼠标位置
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  // 设置射线检测器
  raycaster.setFromCamera(mouse, camera)
  
  // 先检测玻璃片
  const glassIntersects = raycaster.intersectObjects(glassSheets)
  if (glassIntersects.length > 0) {
    const glass = glassIntersects[0].object
    selectedDevice.value = {
      name: `玻璃片 #${glass.userData.id}`,
      type: '玻璃片',
      status: '移动中',
      params: `速度: ${(glass.userData.speed * 60).toFixed(1)}片/min`
    }
    tooltipPos.x = event.clientX - rect.left + 15
    tooltipPos.y = event.clientY - rect.top - 80
    return
  }
  
  // 再检测设备
  const intersects = raycaster.intersectObjects(devices, true)
  
  if (intersects.length > 0) {
    let obj = intersects[0].object
    // 遍历父对象，直到找到设备对象
    while (obj && !obj.userData.name) {
      obj = obj.parent
    }
    
    if (obj?.userData) {
      selectedDevice.value = obj.userData
      // 更新提示框位置
      tooltipPos.x = event.clientX - rect.left + 15
      // 更新提示框位置
      tooltipPos.y = event.clientY - rect.top - 80
    }
    console.log(event)
    console.log(rect)
    console.log(tooltipPos)
  } else {
    selectedDevice.value = null
  }
}

// 更新设备标签位置
const updateLabels = () => {
  // 获取容器元素
  const container = document.getElementById('three-container')
  if (!container || !camera) return
  // 遍历设备标签
  deviceLabels.forEach((label, index) => {
    if (!label.worldPos) return
    // 计算设备标签在屏幕上的位置
    const screenPos = label.worldPos.clone().project(camera)
    const x = (screenPos.x * 0.5 + 0.5) * container.clientWidth
    const y = (-screenPos.y * 0.5 + 0.5) * container.clientHeight
    label.screenX = x
    label.screenY = y
  })
}

// 玻璃片传送动画
const animateGlass = (delta) => {
  // 遍历玻璃片
   glassSheets.forEach(glass => {
    if (!glass.userData) return
    // 计算玻璃片移动速度
    const speed = glass.userData.speed || 0.3
    // 计算玻璃片移动距离(速度 * 时间间隔 * 倍数)
    glass.position.x += speed * delta * 5
    
    // 到达终点后重置到起点，形成循环
    if (glass.position.x > glass.userData.endX + 1) {
      glass.position.x = glass.userData.startX - 1
    }
  })
}

const animate = () => {
  // 递归调用动画函数
  animationId = requestAnimationFrame(animate)
  // 计算时间间隔，单位为秒
  const delta = 0.016
  // 更新玻璃片位置
  animateGlass(delta)

  // 更新设备标签位置
  updateLabels()
  // 控制器更新
  controls.update()
  // 渲染场景重新渲染
  renderer.render(scene, camera)
}

// 窗口大小调整
const onWindowResize = () => {
  const container = document.getElementById('three-container')
  if (camera && renderer && container) {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
}

// vue组件挂载时，初始化3D场景和动画
onMounted(() => {
  // 初始化3D场景
  initThree()
  // 开始动画
  animate()
  // 绑定窗口大小调整事件
  window.addEventListener('resize', onWindowResize)
})

// 组件卸载时，清理动画和事件绑定
onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onWindowResize)
  renderer?.dispose()
})
</script>

<style scoped>
.factory-container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a2a3a;
  overflow: hidden;
  font-family: 'Microsoft YaHei', sans-serif;
  box-sizing: border-box;
}

.header {
  height: 56px;
  min-height: 56px;
  background: linear-gradient(90deg, #1a2a3a 0%, #2a3a4a 50%, #1a2a3a 100%);
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
  flex-shrink: 0;
}

/* 移动端菜单按钮 */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  margin-right: 12px;
  padding: 0;
}

.menu-toggle span {
  display: block;
  width: 20px;
  height: 2px;
  background: #00e5ff;
  margin: 3px 0;
  transition: all 0.3s ease;
}

.menu-toggle:hover {
  background: rgba(0, 229, 255, 0.2);
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #00e5ff;
  margin-right: 12px;
  line-height: 60px;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.title {
  font-size: 14px;
  color: #8899aa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-view {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.info-panel {
  width: 260px;
  background: rgba(10, 20, 30, 0.9);
  backdrop-filter: blur(10px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 1px solid rgba(0, 229, 255, 0.15);
  overflow-y: auto;
  flex-shrink: 0;
}

.panel-section {
  background: rgba(0, 229, 255, 0.05);
  border-radius: 8px;
  padding: 14px;
  border: 1px solid rgba(0, 229, 255, 0.1);
}

.panel-section h3 {
  color: #00e5ff;
  font-size: 14px;
  margin: 0 0 12px 0;
  padding-left: 8px;
  border-left: 3px solid #00e5ff;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #8899aa;
  margin-top: 4px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  color: #88ccaa;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.feature-list li:last-child {
  border-bottom: none;
}

.small-text {
  font-size: 12px;
  color: #667788;
}

.three-view {
  flex: 1;
  position: relative;
  background: #0a1a2a;
}

#three-container {
  width: 100%;
  height: 100%;
}

.hint-box {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #8899aa;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
}

.device-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  max-width: 280px;
  width: auto;
  border: 1px solid #00e5ff;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
  z-index: 100;
  pointer-events: none;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip-icon {
  font-size: 18px;
}

.tooltip-name {
  font-size: 14px;
  font-weight: bold;
  color: #00e5ff;
}

.tooltip-content p {
  margin: 6px 0;
  font-size: 12px;
  color: #aaaabb;
}

.tooltip-content strong {
  color: #8899aa;
}

.labels-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.device-label {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(0, 0);
  display: inline-block;
  width: auto;
  max-width: 180px;
  background: rgba(0, 40, 70, 0.9);
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 200, 255, 0.7);
  word-wrap: break-word;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 平板端适配 */
@media (max-width: 1024px) {
  .info-panel {
    width: 200px;
    padding: 12px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .title {
    font-size: 12px;
  }
  
  .panel-section h3 {
    font-size: 13px;
  }
  
  .stat-value {
    font-size: 16px;
  }
  
  .device-label {
    font-size: 10px;
    padding: 3px 6px;
    max-width: 120px;
  }
}

/* 手机端适配 */
@media (max-width: 768px) {
  .factory-container {
    width: 100%;
    height: 100vh;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  
  .header {
    height: 48px;
    min-height: 48px;
    padding: 0 12px;
  }
  
  /* 显示菜单按钮 */
  .menu-toggle {
    display: flex;
  }
  
  .logo {
    font-size: 16px;
    margin-right: 8px;
  }
  
  .title {
    font-size: 11px;
  }
  
  /* 左侧面板改为抽屉式菜单 */
  .info-panel {
    position: fixed;
    top: 48px;
    left: -260px;
    width: 260px;
    height: calc(100vh - 48px);
    background: rgba(10, 20, 30, 0.98);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    transition: left 0.3s ease;
    overflow-y: auto;
    border-right: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 0;
  }
  
  .info-panel.is-open {
    left: 0;
  }
  
  /* 遮罩层 */
  .menu-overlay {
    position: fixed;
    top: 48px;
    left: 0;
    width: 100%;
    height: calc(100vh - 48px);
    background: rgba(0, 0, 0, 0.6);
    z-index: 999;
    backdrop-filter: blur(2px);
  }
  
  .hint-box {
    font-size: 11px;
    padding: 8px 12px;
  }
  
  .device-label {
    font-size: 9px;
    padding: 2px 5px;
    max-width: 100px;
    border-radius: 3px;
  }
  
  .device-tooltip {
    min-width: 200px;
    padding: 10px;
  }
  
  .tooltip-name {
    font-size: 12px;
  }
  
  .tooltip-content p {
    font-size: 11px;
  }
}

/* 平板端适配 */
@media (max-width: 1024px) {
  .hint-box {
    font-size: 11px;
    padding: 8px 12px;
  }
  
  .device-label {
    font-size: 10px;
    padding: 3px 6px;
    max-width: 120px;
  }
}  .device-tooltip {
    min-width: 200px;
    padding: 10px;
  }
  
  .tooltip-name {
    font-size: 12px;
  }
  
  .tooltip-content p {
    font-size: 11px;
  }

/* 小屏手机适配 */
@media (max-width: 480px) {
  .header {
    height: 40px;
    min-height: 40px;
  }
  
  .logo {
    font-size: 14px;
  }
  
  .title {
    display: none;
  }
  
  .hint-box {
    font-size: 10px;
    padding: 6px 10px;
  }
  
  .device-label {
    font-size: 8px;
    padding: 2px 4px;
    max-width: 80px;
  }
}

/* 全局滚动条隐藏 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 200, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 200, 255, 0.5);
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
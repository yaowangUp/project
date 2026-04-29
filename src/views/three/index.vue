<template>
  <div class="gear-container">
    <div id="info">
      <h2>⚙️ 精工机械 - 齿轮轴装配</h2>
      <p>鼠标拖动旋转 | 滚轮缩放 | 右键平移 | 点击零件查看信息</p>
    </div>
    <div id="status">✅ 运转中 | FPS: <span id="fps">60</span></div>
    <div id="controls">
      <button id="btnRun" class="active" @click="setRunning(true)">▶ 运转</button>
      <button id="btnPause" @click="setRunning(false)">⏸ 暂停</button>
      <button id="btnExplode" @click="toggleExplode">拆分</button>
      <button id="btnReset" @click="resetView">组合</button>
    </div>
    <div ref="container" class="three-container"></div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import * as THREE from 'three'
// 引入轨道控制器
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onMounted, onUnmounted, ref } from 'vue'

const container = ref(null)

let scene, camera, renderer, controls // 场景 // 相机 // 渲染器 // 轨道控制器
let gear1Group, gear2Group, shaftGroup, boltsGroup // 主动齿轮 // 从动齿轮 // 中心轴组 // 螺栓组

let isRunning = ref(true) // 是否运行 默认运行
let isExploded = ref(false) // 是否分解 默认组合
let animationId // 动画ID
let fps = 60 // 帧率
let fpsFrames = 0 // 帧数
let fpsTime = 0 // 帧时间

// 原始位置
const originalPositions = {
  gear2: new THREE.Vector3(2.15, 0.15, 0), // 从动齿轮原始位置
  bolts: new THREE.Vector3(0, 0, 0) // 螺栓原始位置
}

// 创建金属材质
// color 颜色
// roughness 光滑度
// metalness 金属度
const createMetalMaterial = (color, roughness = 0.3, metalness = 0.9) => {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

// 初始化Three.js
const initThree = () => {
  // 获取容器元素的矩形信息
  const containerRect = container.value.getBoundingClientRect()
  // 初始化场景
  scene = new THREE.Scene()
  // 创建场景画布
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 512
  // 创建2d画布上下文对象
  const ctx = canvas.getContext('2d')
  // 创建线性渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, 512)
  // 线性渐变颜色
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(0.5, '#16213e')
  gradient.addColorStop(1, '#0f3460')
  // 填充样式
  ctx.fillStyle = gradient
  // 填充矩形
  ctx.fillRect(0, 0, 2, 512)
  // 创建场景背景
  scene.background = new THREE.CanvasTexture(canvas)

  // 创建相机
  camera = new THREE.PerspectiveCamera(50, containerRect.width / containerRect.height, 0.1, 100)
  // 相机位置
  camera.position.set(6, 4, 8)
  // 相机看向
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  // 设置渲染器大小
  renderer.setSize(containerRect.width, containerRect.height)
  // 设置渲染器像素比
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  // 开启阴影映射
  renderer.shadowMap.enabled = true
  // 设置阴影映射类型
  renderer.shadowMap.type = THREE.PCFSoftShadowMap // 软阴影
  // 设置色调映射
  renderer.toneMapping = THREE.ACESFilmicToneMapping // 
  // 设置色调映射曝光
  renderer.toneMappingExposure = 1.2
  // 添加渲染器到容器
  container.value.appendChild(renderer.domElement)

  // 初始化轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  // 开启阻尼
  controls.enableDamping = true
  // 设置阻尼因子
  controls.dampingFactor = 0.08
  // 设置最小距离
  controls.minDistance = 2.5
  // 设置最大距离
  controls.maxDistance = 15
  // 设置最大极角
  controls.maxPolarAngle = Math.PI * 0.7
  // 设置目标位置
  controls.target.set(0, 0.2, 0)
  // 更新轨道控制器
  controls.update()

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0x404080, 0.6)
  scene.add(ambientLight)

  // 添加太阳光
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5)
  // 设置太阳光位置
  sunLight.position.set(8, 12, 5)
  // 开启阴影投射
  sunLight.castShadow = true
  sunLight.shadow.mapSize.width = 2048
  sunLight.shadow.mapSize.height = 2048
  sunLight.shadow.camera.near = 0.5
  sunLight.shadow.camera.far = 50
  sunLight.shadow.camera.left = -10
  sunLight.shadow.camera.right = 10
  sunLight.shadow.camera.top = 10
  sunLight.shadow.camera.bottom = -10
  // 设置阴影偏移
  sunLight.shadow.bias = -0.0009
  // 设置阴影正常偏移
  sunLight.shadow.normalBias = 0.02
  // 添加太阳光到场景
  scene.add(sunLight)

  // 添加填充光
  const fillLight = new THREE.PointLight(0x4488ff, 0.8, 15)
  fillLight.position.set(-3, 2, 4)
  scene.add(fillLight)

  // 添加边框光
  const rimLight = new THREE.PointLight(0xff8844, 0.5, 10)
  rimLight.position.set(0, -1, 0)
  scene.add(rimLight)

  // 添加网格辅助
  // 圆半径
  // 网格数量
  // 网格数量
  // 网格颜色
  // 网格颜色
  const gridHelper = new THREE.PolarGridHelper(4, 32, 24, 64, 0x444466, 0x222244)
  scene.add(gridHelper)

  // 添加地面平面
  const groundPlane = new THREE.Mesh(
    // 地面平面几何体
    new THREE.PlaneGeometry(12, 12), // 地面平面宽度 // 地面平面高度
    // 地面平面材质
    new THREE.ShadowMaterial({ opacity: 0.25 }) // 地面平面透明度
  )
  // 设置地面平面旋转角度
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.position.y = -1.8
  // 开启阴影接收
  groundPlane.receiveShadow = true
  // 添加地面平面到场景
  scene.add(groundPlane)

  // 添加零件组
  const partsGroup = new THREE.Group()
  scene.add(partsGroup)

  // 添加主动齿轮组
  gear1Group = new THREE.Group()
  gear1Group.name = '主动齿轮'
  gear1Group.position.set(0, 0, 0)

  // 添加主动齿轮主体
  const gearBody1 = new THREE.Mesh(
    // 主动齿轮主体几何体
    new THREE.CylinderGeometry(1.2, 1.2, 0.4, 48),
    // 主动齿轮主体材质
    createMetalMaterial(0xc0c0c0)
  )
  // 开启阴影投射
  gearBody1.castShadow = true
  // 开启阴影接收
  gearBody1.receiveShadow = true
  // 设置主动齿轮主体名称
  gearBody1.name = 'gearBody1'
  // 添加主动齿轮主体到主动齿轮组
  gear1Group.add(gearBody1)

  // 添加主动齿轮齿
  const toothCount = 24
  // 遍历生成主动齿轮齿
  for (let i = 0; i < toothCount; i++) {
    // 主动齿轮齿角度
    const angle = (i / toothCount) * Math.PI * 2
    // 主动齿轮齿几何体
    const tooth = new THREE.Mesh(
      // 主动齿轮齿几何体
      new THREE.BoxGeometry(0.1, 0.15, 0.45),
      // 主动齿轮齿材质
      createMetalMaterial(0xd4d4d4, 0.25, 0.95)
    )
    tooth.position.x = Math.cos(angle) * 1.2
    tooth.position.z = Math.sin(angle) * 1.2
    tooth.rotation.y = -angle
    tooth.castShadow = true
    tooth.receiveShadow = true
    gear1Group.add(tooth)
  }

  // 添加主动齿轮中心轴
  const hub1 = new THREE.Mesh(
    // 主动齿轮中心轴几何体
    new THREE.CylinderGeometry(0.35, 0.4, 0.5, 32),
    // 主动齿轮中心轴材质
    createMetalMaterial(0xe8e8e8, 0.2, 0.95)
  )
  hub1.position.y = 0
  hub1.castShadow = true
  hub1.receiveShadow = true
  gear1Group.add(hub1)

  // 添加主动齿轮到零件组
  partsGroup.add(gear1Group)

  // 添加从动齿轮组
  gear2Group = new THREE.Group()
  gear2Group.name = '从动齿轮'
  gear2Group.position.set(2.15, 0.15, 0)

  // 添加从动齿轮主体
  const gearBody2 = new THREE.Mesh(
    // 从动齿轮主体几何体
    new THREE.CylinderGeometry(0.85, 0.85, 0.35, 40),
    // 从动齿轮主体材质
    createMetalMaterial(0xa0b8d0)
  )
  gearBody2.castShadow = true
  gearBody2.receiveShadow = true
  gear2Group.add(gearBody2)

  // 添加从动齿轮齿
  const toothCount2 = 10 // 从动齿轮齿数量
  for (let i = 0; i < toothCount2; i++) {
    const angle = (i / toothCount2) * Math.PI * 2
    const tooth = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.13, 0.4),
      createMetalMaterial(0xb0c8e0, 0.25, 0.95)
    )
    tooth.position.x = Math.cos(angle) * 0.85
    tooth.position.z = Math.sin(angle) * 0.85
    tooth.rotation.y = -angle
    tooth.castShadow = true
    tooth.receiveShadow = true
    gear2Group.add(tooth)
  }

  partsGroup.add(gear2Group)

  // 添加中心转轴组
  shaftGroup = new THREE.Group()
  shaftGroup.name = '中心转轴'
  shaftGroup.position.set(0, 0, 0)

  const shaftMain = new THREE.Mesh(
    // 中心转轴主体几何体
    new THREE.CylinderGeometry(0.22, 0.22, 3.2, 32),
    // 中心转轴主体材质
    createMetalMaterial(0x4a4a5a, 0.15, 1.0)
  )
  shaftMain.castShadow = true
  shaftMain.receiveShadow = true
  shaftGroup.add(shaftMain)

  // 添加中心转轴上端螺丝
  const shaftEnd1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.15, 32),
    createMetalMaterial(0x555566, 0.15, 1.0)
  )
  shaftEnd1.position.y = 1.6
  shaftEnd1.castShadow = true
  shaftGroup.add(shaftEnd1)

  // 添加中心转轴下端螺丝
  const shaftEnd2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.15, 32),
    createMetalMaterial(0x555566, 0.15, 1.0)
  )
  shaftEnd2.position.y = -1.6
  shaftEnd2.castShadow = true
  shaftGroup.add(shaftEnd2)

  partsGroup.add(shaftGroup)

  // 添加固定螺栓组
  boltsGroup = new THREE.Group()
  boltsGroup.name = '固定螺栓组'

  // 固定螺栓位置坐标
  const boltPositions = [
    [0.8, 0.25, 0], [-0.8, 0.25, 0], [0, 0.25, 0.8], [0, 0.25, -0.8],
    [0.8, -0.25, 0], [-0.8, -0.25, 0], [0, -0.25, 0.8], [0, -0.25, -0.8],
  ]

  // 遍历生成固定螺栓
  boltPositions.forEach(([x, y, z], index) => {
    const bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16),
      createMetalMaterial(0x333344, 0.2, 1.0)
    )
    // 固定螺栓位置坐标
    bolt.position.set(x, y, z)
    bolt.castShadow = true
    bolt.receiveShadow = true
    bolt.name = `bolt_${index}`
    boltsGroup.add(bolt)

    // 固定螺栓头
    const boltHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.05, 6),
      createMetalMaterial(0x444455, 0.2, 1.0)
    )
    boltHead.position.set(x, y, z + 0.08)
    boltHead.rotation.x = Math.PI / 2
    boltHead.castShadow = true
    boltsGroup.add(boltHead)
  })

  partsGroup.add(boltsGroup)

  // 添加点击事件
  const raycaster = new THREE.Raycaster()
  // 鼠标位置
  const mouse = new THREE.Vector2()

  // 点击事件处理
  renderer.domElement.addEventListener('click', (event) => {
    // 计算鼠标位置
    const rect = renderer.domElement.getBoundingClientRect()
    // 计算鼠标位置
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    // 计算鼠标位置
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 计算点击位置
    raycaster.setFromCamera(mouse, camera)
    // 计算点击位置
    const intersects = raycaster.intersectObjects(partsGroup.children, true)

    // 如果点击的元素本身没有名称的话，那么就显示他的父级元素的名称
    if (intersects.length > 0) {
      let obj = intersects[0].object
      while (obj && !obj.name && obj.parent) {
        obj = obj.parent
      }
      const groupName = obj?.name || '未知零件'
      ElMessage({
        message: `选中零件: ${groupName}\n材质: 合金钢\n表面处理: 渗碳淬火`,
        type: 'success'
      })
    }
  })

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    // 更新相机和渲染器的大小
    // 计算新的相机参数
    const newRect = container.value.getBoundingClientRect()
    camera.aspect = newRect.width / newRect.height
    camera.updateProjectionMatrix()
    // 更新渲染器的大小
    renderer.setSize(newRect.width, newRect.height)
  })
}

// 动画循环
const animate = () => {
  // 动画ID
  animationId = requestAnimationFrame(animate)

  // 计算动画时间间隔
  const delta = 0.016
  // 计算动画帧间隔
  fpsFrames++
  // 计算动画时间间隔
  fpsTime += delta
  // 计算动画帧间隔
  if (fpsTime >= 0.5) {
    const fpsEl = document.getElementById('fps')
    if (fpsEl) fpsEl.textContent = Math.round(fpsFrames / fpsTime)
    fpsFrames = 0
    fpsTime = 0
  }

  if (isRunning.value) {
    // 主动齿轮组件动画位移
    gear1Group.rotation.y += 0.015
    // 从动齿轮组件动画位移
    gear2Group.rotation.y -= 0.015 * (24 / 10)
    // 中心轴组件动画位移
    shaftGroup.rotation.y += 0.015
  }

  // 如果当前组件是分解状态，那么就将固定螺栓的位置设置为分解后的位置
  if (isExploded.value) {
    gear2Group.position.lerp(new THREE.Vector3(3.2, 0.15, 0), 0.08)
    boltsGroup.position.lerp(new THREE.Vector3(0, 0.6, 0), 0.08)
  } else {
    gear2Group.position.lerp(originalPositions.gear2, 0.08)
    boltsGroup.position.lerp(originalPositions.bolts, 0.08)
  }

  controls.update()
  renderer.render(scene, camera)
}

// 设置运行状态（默认运行中）
const setRunning = (running) => {
  // 设置运行状态
  isRunning.value = running

  // 运行按钮
  const btnRun = document.getElementById('btnRun')
  // 暂停按钮
  const btnPause = document.getElementById('btnPause')
  // 运行状态内容
  const status = document.getElementById('status')

  // 如果当前运行是运行状态，那么就将运行按钮设置为活动状态，暂停按钮设置为非活动状态
  if (running) {
    btnRun?.classList.add('active')
    btnPause?.classList.remove('active')
    if (status) status.innerHTML = '✅ 运转中 | FPS: <span id="fps">60</span>'
  } else {
    btnRun?.classList.remove('active')
    btnPause?.classList.add('active')
    if (status) status.innerHTML = '⏸ 已暂停 | FPS: <span id="fps">60</span>'
  }
}

// 点击拆分和组合按钮切换
const toggleExplode = () => {
  isExploded.value = !isExploded.value
  const btn = document.getElementById('btnExplode')
  if (isExploded.value) {
    btn.textContent = '🔧 合并'
    btn.classList.add('active')
  } else {
    btn.textContent = '💥 分解'
    btn.classList.remove('active')
  }
}

// 点击组合按钮事件
const resetView = () => {
  // 重置相机位置
  camera.position.set(6, 4, 8)
  // 控制器重置
  controls.target.set(0, 0.2, 0)
  // 控制器更新
  controls.update()
  isExploded.value = false
  const btn = document.getElementById('btnExplode')
  if (btn) {
    btn.textContent = '💥 分解'
    btn.classList.remove('active')
  }
  gear2Group.position.copy(originalPositions.gear2)
  boltsGroup.position.copy(originalPositions.bolts)
}

// Vue初始化实例
onMounted(() => {
  // 默认加载3D模型
  initThree()
  // 默认加载动画循环
  animate()
})

// Vue卸载实例
onUnmounted(() => {
  // 如果存在动画ID，那么就取消动画ID
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  // 如果存在渲染器，那么就销毁渲染器
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.gear-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.three-container {
  width: 100%;
  height: 100%;
}

#info {
  position: absolute;
  top: 0px;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 20px;
  pointer-events: none;
  z-index: 10;
}

#info h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

#info p {
  margin: 0;
  font-size: 14px;
}

#status {
  width: 200px;
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 10;
}

#controls {
  width: 500px;
  position: absolute;
  bottom: 30px;
  left: 50%;
  right: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}

#controls button {
  width: 100px;
  padding: 12px 8px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-weight: bold;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

#controls button:hover {
  background: #ff9800;
  color: white;
}

#controls button.active {
  background: #ff9800;
  color: white;
}
</style>

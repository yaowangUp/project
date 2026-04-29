<template>
  <div class="container">
    <div ref="canvasRef" class="canvas"></div>

    <!-- 信息面板 -->
    <div v-if="selected" class="panel" :style="{ left: panelX + 'px', top: panelY + 'px' }">
      <h3>{{ selected.name }}</h3>
      <p>类型: {{ selected.type }}</p>
      <p>状态: {{ selected.status }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const canvasRef = ref()

let scene, camera, renderer, controls
let raycaster, mouse
let machines = []

const selected = ref(null)
const panelX = ref(0)
const panelY = ref(0)

onMounted(() => {
  init()
  animate()
})

function init() {
  const width = window.innerWidth
  const height = window.innerHeight

  // 场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf5f5f5) // ✅ 白色工业风

  // 摄像机（俯视角）
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(120, 120, 120)

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  canvasRef.value.appendChild(renderer.domElement)

  // 控制器（旋转/缩放/拖拽）
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)

  // 光照（关键）
  const light1 = new THREE.DirectionalLight(0xffffff, 1)
  light1.position.set(100, 100, 100)
  scene.add(light1)

  const light2 = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(light2)

  // 地面
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 200),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  )
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  // 创建产线
  createFactoryLine()

  // Raycaster
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  renderer.domElement.addEventListener('click', onClick)
  renderer.domElement.addEventListener('mousemove', onHover)
}

// ✅ 创建“产线”
function createFactoryLine() {
  const materialMachine = new THREE.MeshStandardMaterial({ color: 0xdddddd })
  const materialLine = new THREE.MeshStandardMaterial({ color: 0x999999 })

  for (let i = 0; i < 8; i++) {
    // 设备
    const machine = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 6),
      materialMachine.clone()
    )
    machine.position.set(i * 20 - 70, 3, 0)

    machine.userData = {
      name: `设备-${i + 1}`,
      type: '钢化设备',
      status: Math.random() > 0.7 ? '异常' : '正常'
    }

    scene.add(machine)
    machines.push(machine)

    // 传送带
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 4),
      materialLine
    )
    line.position.set(i * 20 - 70 + 10, 1, 0)
    scene.add(line)
  }
}

// 点击交互
function onClick(event) {
  const rect = renderer.domElement.getBoundingClientRect()

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(machines)

  if (intersects.length > 0) {
    const obj = intersects[0].object

    // 高亮
    obj.material.color.set(0xff4444)

    selected.value = obj.userData
    panelX.value = event.clientX
    panelY.value = event.clientY
  } else {
    selected.value = null
  }
}

// Hover 高亮
function onHover(event) {
  const rect = renderer.domElement.getBoundingClientRect()

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(machines)

  machines.forEach(m => m.material.color.set(0xdddddd))

  if (intersects.length > 0) {
    intersects[0].object.material.color.set(0x00aaff)
  }
}

// 渲染循环
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
</script>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.canvas {
  width: 100%;
  height: 100%;
}

.panel {
  position: absolute;
  background: white;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
</style>
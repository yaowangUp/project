import { createRouter, createWebHistory } from 'vue-router'
const routes = [
  // {
  //   path: '/helloWorld',
  //   name: 'HelloWorld',
  //   component: () => import('../views/components/HelloWorld.vue')
  // },
  {
    path: '/timeShow',
    name: 'TimeShow',
    component: () => import('../views/TimeShow.vue')
  },
  {
    path: '/three',
    name: 'Three',
    component: () => import('../views/three/index.vue')
  },
  {
    path: '/3DVisualizationPipeline',
    name: '3D Visualization Pipeline',
    component: () => import('../views/three/3DVisualizationPipeline.vue')
  },
  {
    path: '/aiRequirement',
    name: 'AiRequirement',
    component: () => import('../views/AiRequirement.vue')
  },
]
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
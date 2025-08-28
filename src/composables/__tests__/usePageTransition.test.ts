import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import {
  usePageTransition,
  useLoadingAnimation,
  useElementTransition,
  PAGE_TRANSITIONS
} from '../usePageTransition'

// Mock Vue Router
const mockRouter = {
  beforeEach: vi.fn(),
  afterEach: vi.fn()
}

const mockRoute = {
  path: '/test',
  name: 'test'
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute
}))

describe('usePageTransition', () => {
  const {
    isTransitioning,
    transitionName,
    transitionDirection,
    currentTransition,
    effectiveTransition,
    routeHistory,
    setTransition,
    detectTransitionDirection,
    beforeRouteTransition,
    afterRouteTransition,
    triggerPageTransition
  } = usePageTransition()
  let mockAnimation

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset state before each test
    isTransitioning.value = false
    transitionName.value = 'fade'
    transitionDirection.value = 'none'
    routeHistory.value = []

    mockAnimation = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      cancel: vi.fn(),
      finish: vi.fn(),
    }

    Object.defineProperty(Element.prototype, 'animate', {
      value: vi.fn().mockReturnValue(mockAnimation),
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基本功能', () => {
    it('應該正確初始化頁面過渡系統', () => {
      expect(isTransitioning.value).toBe(false)
      expect(transitionName.value).toBe('fade')
      expect(transitionDirection.value).toBe('none')
      expect(currentTransition.value).toEqual(PAGE_TRANSITIONS.fade)
      expect(effectiveTransition.value).toEqual(PAGE_TRANSITIONS.fade)
      expect(Array.isArray(routeHistory.value)).toBe(true)
    })

    it('應該能設置過渡效果', () => {
      setTransition('slide')
      expect(currentTransition.value).toEqual(PAGE_TRANSITIONS.slide)
    })

    it('應該能檢測過渡方向', () => {
      const to = { path: '/users/profile', name: 'profile' } as any
      const from = { path: '/users', name: 'users' } as any
      const direction = detectTransitionDirection(to, from)
      expect(direction).toBe('forward')
    })

    it('在減少動畫模式下應該使用無過渡效果', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { effectiveTransition: newEffectiveTransition } = usePageTransition()
      expect(newEffectiveTransition.value).toEqual(PAGE_TRANSITIONS.none)
    })
  })

  describe('路由過渡處理', () => {
    it('應該能處理路由過渡開始', () => {
      const to = { path: '/new-page', name: 'new' } as any
      const from = { path: '/old-page', name: 'old' } as any
      beforeRouteTransition(to, from)
      expect(isTransitioning.value).toBe(true)
      expect(transitionDirection.value).toBe('none')
    })

    it('應該能處理路由過渡完成', () => {
      isTransitioning.value = true
      afterRouteTransition()
      expect(isTransitioning.value).toBe(false)
    })
  })

  describe('手動頁面過渡', () => {
    it('應該能觸發頁面進入動畫', async () => {
      const element = document.createElement('div')
      const promise = triggerPageTransition(element, 'enter')
      expect(Element.prototype.animate).toHaveBeenCalled()
      const finishHandler = mockAnimation.addEventListener.mock.calls.find(call => call[0] === 'finish')?.[1]
      if (finishHandler) finishHandler()
      await expect(promise).resolves.toBeUndefined()
    })

    it('應該能觸發頁面離開動畫', async () => {
      const element = document.createElement('div')
      const promise = triggerPageTransition(element, 'leave')
      expect(Element.prototype.animate).toHaveBeenCalled()
      const finishHandler = mockAnimation.addEventListener.mock.calls.find(call => call[0] === 'finish')?.[1]
      if (finishHandler) finishHandler()
      await expect(promise).resolves.toBeUndefined()
    })

    it('在減少動畫模式下應該立即完成', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { triggerPageTransition: newTrigger } = usePageTransition()
      const element = document.createElement('div')
      const promise = newTrigger(element, 'enter')
      await expect(promise).resolves.toBeUndefined()
      expect(Element.prototype.animate).not.toHaveBeenCalled()
    })
  })
})

describe('useLoadingAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('載入狀態管理', () => {
    it('應該正確初始化載入狀態', () => {
      const { isLoading, loadingProgress, loadingMessage } = useLoadingAnimation()

      expect(isLoading.value).toBe(false)
      expect(loadingProgress.value).toBe(0)
      expect(loadingMessage.value).toBe('')
    })

    it('應該能開始載入動畫', () => {
      const { startLoading, isLoading, loadingProgress, loadingMessage } = useLoadingAnimation()

      startLoading('載入中...')

      expect(isLoading.value).toBe(true)
      expect(loadingProgress.value).toBe(0)
      expect(loadingMessage.value).toBe('載入中...')
    })

    it('應該能更新載入進度', () => {
      const { updateProgress, loadingProgress, loadingMessage } = useLoadingAnimation()

      updateProgress(50, '載入中...')

      expect(loadingProgress.value).toBe(50)
      expect(loadingMessage.value).toBe('載入中...')
    })

    it('應該能完成載入動畫', async () => {
      const { startLoading, finishLoading, isLoading, loadingProgress } = useLoadingAnimation()

      startLoading()
      expect(isLoading.value).toBe(true)

      finishLoading()
      expect(loadingProgress.value).toBe(100)

      // 等待延遲完成
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(isLoading.value).toBe(false)
    })
  })

  describe('骨架屏功能', () => {
    it('應該能創建骨架屏元素', () => {
      const { createSkeletonElement } = useLoadingAnimation()

      const element = createSkeletonElement({
        width: '200px',
        height: '20px',
        className: 'test-skeleton'
      })

      expect(element).toBeInstanceOf(HTMLElement)
      expect(element.style.width).toBe('200px')
      expect(element.style.height).toBe('20px')
      expect(element.className).toContain('skeleton-loading')
      expect(element.className).toContain('test-skeleton')
    })

    it('應該能創建多個骨架屏元素', () => {
      const { createSkeletonElement } = useLoadingAnimation()

      const elements = createSkeletonElement({ count: 3 })

      expect(Array.isArray(elements)).toBe(true)
      expect(elements).toHaveLength(3)
      elements.forEach(element => {
        expect(element).toBeInstanceOf(HTMLElement)
        expect(element.className).toContain('skeleton-loading')
      })
    })

    it('應該能應用骨架屏到容器', () => {
      const { applySkeletonToContainer } = useLoadingAnimation()
      const container = document.createElement('div')

      applySkeletonToContainer(container, {
        lines: 3,
        lineHeight: '16px',
        spacing: '8px'
      })

      expect(container.children.length).toBeGreaterThan(0)
      const skeletons = container.querySelectorAll('.skeleton-loading')
      expect(skeletons.length).toBe(3)
    })

    it('應該能移除容器中的骨架屏', () => {
      const { applySkeletonToContainer, removeSkeletonFromContainer } = useLoadingAnimation()
      const container = document.createElement('div')

      applySkeletonToContainer(container, { lines: 3 })
      expect(container.querySelectorAll('.skeleton-loading').length).toBe(3)

      removeSkeletonFromContainer(container)
      expect(container.querySelectorAll('.skeleton-loading').length).toBe(0)
    })
  })
})

describe('useElementTransition', () => {
  let mockAnimation

  beforeEach(() => {
    vi.clearAllMocks()

    mockAnimation = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      cancel: vi.fn(),
      finish: vi.fn(),
    }

    Object.defineProperty(Element.prototype, 'animate', {
      value: vi.fn().mockReturnValue(mockAnimation),
      writable: true,
    })
  })

  describe('元素進入動畫', () => {
    it('應該能創建淡入動畫', async () => {
      const { animateElementEnter } = useElementTransition()
      const element = document.createElement('div')

      const promise = animateElementEnter(element, 'fade', { duration: 300 })

      expect(Element.prototype.animate).toHaveBeenCalledWith(
        [
          { opacity: 0 },
          { opacity: 1 }
        ],
        expect.objectContaining({
          duration: 300,
          easing: 'ease-out',
          fill: 'forwards'
        })
      )

      // 模擬動畫完成
      const finishHandler = mockAnimation.addEventListener.mock.calls
        .find(call => call[0] === 'finish')?.[1]
      if (finishHandler) finishHandler()

      await expect(promise).resolves.toBeUndefined()
    })

    it('應該能創建滑動動畫', async () => {
      const { animateElementEnter } = useElementTransition()
      const element = document.createElement('div')

      const promise = animateElementEnter(element, 'slide', {
        duration: 300,
        direction: 'up'
      })

      expect(Element.prototype.animate).toHaveBeenCalledWith(
        [
          { transform: 'translateY(20px)', opacity: 0 },
          { transform: 'translateY(0px)', opacity: 1 }
        ],
        expect.objectContaining({
          duration: 300,
          easing: 'ease-out',
          fill: 'forwards'
        })
      )

      // 模擬動畫完成
      const finishHandler = mockAnimation.addEventListener.mock.calls
        .find(call => call[0] === 'finish')?.[1]
      if (finishHandler) finishHandler()

      await expect(promise).resolves.toBeUndefined()
    })

    it('應該能創建縮放動畫', async () => {
      const { animateElementEnter } = useElementTransition()
      const element = document.createElement('div')

      const promise = animateElementEnter(element, 'scale', { duration: 300 })

      expect(Element.prototype.animate).toHaveBeenCalledWith(
        [
          { transform: 'scale(0.95)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ],
        expect.objectContaining({
          duration: 300,
          easing: 'ease-out',
          fill: 'forwards'
        })
      )

      // 模擬動畫完成
      const finishHandler = mockAnimation.addEventListener.mock.calls
        .find(call => call[0] === 'finish')?.[1]
      if (finishHandler) finishHandler()

      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('元素離開動畫', () => {
    it('應該能創建淡出動畫', async () => {
      const { animateElementLeave } = useElementTransition()
      const element = document.createElement('div')

      const promise = animateElementLeave(element, 'fade', { duration: 250 })

      expect(Element.prototype.animate).toHaveBeenCalledWith(
        [
          { opacity: 1 },
          { opacity: 0 }
        ],
        expect.objectContaining({
          duration: 250,
          easing: 'ease-in',
          fill: 'forwards'
        })
      )

      // 模擬動畫完成
      const finishHandler = mockAnimation.addEventListener.mock.calls
        .find(call => call[0] === 'finish')?.[1]
      if (finishHandler) finishHandler()

      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('批量元素動畫', () => {
    it('應該能批量創建進入動畫', async () => {
      const { animateElementsBatch } = useElementTransition()
      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
      ]

      const promise = animateElementsBatch(elements, 'enter', 'fade', {
        stagger: 100,
        duration: 300
      })

      expect(Element.prototype.animate).toHaveBeenCalledTimes(3)

      // 模擬所有動畫完成
      mockAnimation.addEventListener.mock.calls.forEach(call => {
        if (call[0] === 'finish') {
          call[1]()
        }
      })

      await expect(promise).resolves.toHaveLength(3)
    })

    it('應該能批量創建離開動畫', async () => {
      const { animateElementsBatch } = useElementTransition()
      const elements = [
        document.createElement('div'),
        document.createElement('div')
      ]

      const promise = animateElementsBatch(elements, 'leave', 'slide', {
        stagger: 50,
        duration: 250,
        direction: 'up'
      })

      expect(Element.prototype.animate).toHaveBeenCalledTimes(2)

      // 模擬所有動畫完成
      mockAnimation.addEventListener.mock.calls.forEach(call => {
        if (call[0] === 'finish') {
          call[1]()
        }
      })

      await expect(promise).resolves.toHaveLength(2)
    })
  })

  describe('減少動畫模式', () => {
    it('在減少動畫模式下應該立即完成', async () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { animateElementEnter } = useElementTransition()
      const element = document.createElement('div')

      const promise = animateElementEnter(element, 'fade')

      await expect(promise).resolves.toBeUndefined()
      expect(Element.prototype.animate).not.toHaveBeenCalled()
    })
  })
})

describe('PAGE_TRANSITIONS', () => {
  it('應該包含所有必要的過渡效果', () => {
    expect(PAGE_TRANSITIONS).toHaveProperty('fade')
    expect(PAGE_TRANSITIONS).toHaveProperty('slide')
    expect(PAGE_TRANSITIONS).toHaveProperty('scale')
    expect(PAGE_TRANSITIONS).toHaveProperty('slideUp')
    expect(PAGE_TRANSITIONS).toHaveProperty('slideDown')
    expect(PAGE_TRANSITIONS).toHaveProperty('none')
  })

  it('每個過渡效果應該有正確的結構', () => {
    Object.values(PAGE_TRANSITIONS).forEach(transition => {
      expect(transition).toHaveProperty('name')
      expect(transition).toHaveProperty('mode')
      expect(transition).toHaveProperty('duration')
      expect(transition).toHaveProperty('appear')
      expect(typeof transition.duration).toBe('number')
      expect(typeof transition.appear).toBe('boolean')
    })
  })

  it('無過渡效果應該有零持續時間', () => {
    expect(PAGE_TRANSITIONS.none.duration).toBe(0)
    expect(PAGE_TRANSITIONS.none.appear).toBe(false)
  })
})

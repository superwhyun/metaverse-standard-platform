import { useCallback, useEffect } from 'react'
import { getNavigationTarget, getAllPageIds } from '@/config/navigation'

interface UseNavigationProps {
  currentView: string
  setCurrentView: (view: string) => void
  setIsTransitioning: (transitioning: boolean) => void
  isTransitioning: boolean
  onViewChange?: (newView: string) => void
}

export const useKeyboardNavigation = ({
  currentView,
  setCurrentView,
  setIsTransitioning,
  isTransitioning,
  onViewChange
}: UseNavigationProps) => {
  
  const navigateToPage = useCallback((targetPageId: string) => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setCurrentView(targetPageId)
    onViewChange?.(targetPageId)
    setTimeout(() => setIsTransitioning(false), 600)
  }, [isTransitioning, setCurrentView, setIsTransitioning, onViewChange])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when user is typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        // Handle form-specific shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case "s":
              event.preventDefault()
              // Trigger form save if in admin forms
              if (currentView.includes("admin-add") || currentView.includes("admin-edit")) {
                const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement
                if (submitButton) submitButton.click()
              }
              break
            case "Enter":
              event.preventDefault()
              const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement
              if (submitButton) submitButton.click()
              break
          }
        }
        return
      }

      // Ignore key inputs during transition
      if (isTransitioning) return

      let targetPageId: string | undefined

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          targetPageId = getNavigationTarget(currentView, 'left')
          console.log('ArrowLeft pressed:', currentView, '->', targetPageId)
          break
        case "ArrowRight":
          event.preventDefault()
          targetPageId = getNavigationTarget(currentView, 'right')
          console.log('ArrowRight pressed:', currentView, '->', targetPageId)
          break
        case "ArrowDown":
          event.preventDefault()
          targetPageId = getNavigationTarget(currentView, 'down')
          console.log('ArrowDown pressed:', currentView, '->', targetPageId)
          break
        case "ArrowUp":
          event.preventDefault()
          targetPageId = getNavigationTarget(currentView, 'up')
          console.log('ArrowUp pressed:', currentView, '->', targetPageId)
          break
        case "Escape":
          event.preventDefault()
          // Handle escape key for going back
          if (currentView === "report-detail") {
            targetPageId = getNavigationTarget(currentView, 'left') || 'reports'
          } else if (currentView.startsWith("admin-")) {
            if (currentView === "admin") {
              targetPageId = 'calendar'
            } else {
              targetPageId = 'admin'
            }
          } else if (currentView === "monthly-reports") {
            targetPageId = 'reports'
          } else if (currentView === "organization-reports") {
            targetPageId = 'monthly-reports'
          } else if (['reports', 'admin', 'standard-search'].includes(currentView)) {
            targetPageId = 'calendar'
          }
          break
        case "1":
        case "2":
        case "3":
        case "4":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            const shortcuts = {
              "1": "admin",
              "2": "calendar", 
              "3": "reports",
              "4": "standard-search"
            }
            targetPageId = shortcuts[event.key as keyof typeof shortcuts]
            console.log('Number key pressed:', event.key, '->', targetPageId)
          }
          break
      }

      if (targetPageId) {
        navigateToPage(targetPageId)
      }
    },
    [currentView, isTransitioning, navigateToPage]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return {
    navigateToPage
  }
}

// 페이지 전환 관련 유틸리티
export const usePageTransition = () => {
  const scrollToTop = useCallback((currentView: string) => {
    // Don't scroll for overlay views like report-detail
    if (currentView !== "report-detail") {
      // Scroll to top and focus main content when view changes
      window.scrollTo({ top: 0, behavior: "smooth" })

      // Set focus to main content for screen readers
      const mainElement = document.querySelector("main")
      if (mainElement) {
        mainElement.focus()
      }
    }
  }, [])

  return {
    scrollToTop
  }
}
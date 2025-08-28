'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Eye, X } from 'lucide-react'
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
} from './ai-elements/web-preview'
import { DownloadButton } from './DownloadButton'

interface Chat {
  id: string
  demo: string
}

interface MobilePreviewButtonProps {
  chat?: Chat | null
}

export default function MobilePreviewButton({ chat }: MobilePreviewButtonProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  // Handle body scroll lock
  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isPreviewOpen])

  // Handle touch events for swipe to close
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isBottomSwipe = distance < -minSwipeDistance
    
    // Close modal on swipe down from top
    if (isBottomSwipe && touchStart < 100) {
      setIsPreviewOpen(false)
    }
  }

  // Only show button if chat exists and has demo
  if (!chat || !chat.demo) {
    return null
  }

  return (
    <>
      {/* Floating Preview Button - positioned above input */}
      <div className="fixed right-4 z-50 md:hidden mobile-preview-button">
        <Button
          onClick={() => setIsPreviewOpen(true)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center border-2 border-white transition-all duration-200 hover:scale-105 active:scale-95"
          size="sm"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </div>

      {/* Full Screen Preview Modal - Exact same structure as desktop */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-[9999] md:hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Swipe indicator - only addition for mobile UX */}
          <div className="flex justify-center pt-2 pb-1 bg-card">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Exact same WebPreview structure as desktop preview panel */}
          <div className="h-[calc(100vh-1rem)] flex flex-col">
            <WebPreview>
              <WebPreviewNavigation>
                <WebPreviewUrl
                  readOnly
                  placeholder={chat && chat.demo ? "Your app here..." : "Preview will appear after generation completes"}
                  value={chat?.demo}
                />
                {chat && chat.demo && (
                  <div className="flex items-center gap-2 ml-2">
                    <DownloadButton 
                      chat={chat} 
                      projectName={`v0-project-${chat.id.slice(-6)}`}
                      className="text-xs"
                    />
                    {/* Close button only for mobile */}
                    <Button
                      onClick={() => setIsPreviewOpen(false)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:text-foreground"
                      title="Close Preview"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </WebPreviewNavigation>
              {chat && chat.demo ? (
                <WebPreviewBody src={chat.demo} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <div className="text-lg">No preview available</div>
                    <div className="text-sm">Generate an app to see the preview</div>
                  </div>
                </div>
              )}
            </WebPreview>
          </div>
        </div>
      )}
    </>
  )
}

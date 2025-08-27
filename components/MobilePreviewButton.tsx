'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, X } from 'lucide-react'
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
} from '@/components/ai-elements/web-preview'
import { DownloadButton } from '@/components/DownloadButton'

interface Chat {
  id: string
  demo: string
}

interface MobilePreviewButtonProps {
  chat: Chat | null
}

export function MobilePreviewButton({ chat }: MobilePreviewButtonProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Don't show the button if there's no chat or demo
  if (!chat || !chat.demo) {
    return null
  }

  return (
    <>
      {/* Floating Button - only visible on mobile */}
      <button
        onClick={() => setIsPreviewOpen(true)}
        className="fixed bottom-6 right-6 z-50 md:hidden bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors mobile-preview-button"
        aria-label="Open preview"
      >
        <Eye className="h-6 w-6" />
      </button>

      {/* Full Screen Mobile Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden flex flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold">Preview</h2>
            <div className="flex items-center gap-2">
              {chat.demo && (
                <DownloadButton 
                  chat={chat} 
                  projectName={`v0-project-${chat.id.slice(-6)}`}
                  className="text-xs"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            <WebPreview>
              <WebPreviewNavigation>
                <WebPreviewUrl
                  readOnly
                  placeholder="Your app here..."
                  value={chat.demo}
                  className="text-sm"
                />
              </WebPreviewNavigation>
              <WebPreviewBody src={chat.demo} />
            </WebPreview>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadProjectAsZip, extractFilesFromChat } from '@/lib/export-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DownloadButtonProps {
  chat: any
  projectName?: string
  className?: string
}

export function DownloadButton({ 
  chat, 
  projectName = 'v0-project',
  className = '' 
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [fileCount, setFileCount] = useState<number>(0)

  const handleDownload = async () => {
    if (!chat) return

    setIsDownloading(true)
    
    try {
      const files = extractFilesFromChat(chat)
      setFileCount(files.length)
      
      if (files.length === 0) {
        alert('No files found to download')
        return
      }

      const success = await downloadProjectAsZip(files, projectName)
      
      if (!success) {
        alert('Failed to create ZIP file')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Error occurred while downloading')
    } finally {
      setIsDownloading(false)
    }
  }

  // Don't show button if no chat
  if (!chat) {
    console.log('DownloadButton: No chat provided')
    return null
  }

  const files = extractFilesFromChat(chat)
  console.log('DownloadButton: Files extracted:', files.length, files)
  
  // Show button even if no files, for debugging
  // if (files.length === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            size="sm"
            variant="outline"
            className={`gap-2 ${className}`}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download ZIP
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>Download project as ZIP file</p>
            <p className="text-xs text-muted-foreground mt-1">
              {files.length} file{files.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function FilePreviewButton({ chat }: { chat: any }) {
  const [showFiles, setShowFiles] = useState(false)
  
  if (!chat) return null
  
  const files = extractFilesFromChat(chat)
  if (files.length === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setShowFiles(!showFiles)}
            size="sm"
            variant="ghost"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {files.length} file{files.length !== 1 ? 's' : ''}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>Preview project files</p>
            <div className="text-xs text-muted-foreground mt-1 max-w-xs">
              {files.slice(0, 3).map(f => f.name).join(', ')}
              {files.length > 3 && ` +${files.length - 3} more`}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

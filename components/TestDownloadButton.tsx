'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadProjectAsZip } from '@/lib/export-utils'

interface TestDownloadButtonProps {
  className?: string
}

export function TestDownloadButton({ className = '' }: TestDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      // Create a test file
      const testFiles = [
        {
          name: 'test-component.tsx',
          content: `import React from 'react'

export default function TestComponent() {
  return (
    <div className="p-4">
      <h1>Test Component</h1>
      <p>This is a test download from v0 clone.</p>
    </div>
  )
}`
        }
      ]

      const success = await downloadProjectAsZip(testFiles, 'test-project')
      
      if (!success) {
        alert('Failed to create ZIP file')
      } else {
        alert('Test ZIP created successfully!')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Error occurred while downloading')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
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
          Testing...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Test Download
        </>
      )}
    </Button>
  )
}

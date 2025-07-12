import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { action, filePath } = await request.json()

    if (!action || !filePath) {
      return NextResponse.json({ error: 'Action and file path are required' }, { status: 400 })
    }

    // Resolve the absolute path
    const absolutePath = path.resolve(filePath)

    // Check if file exists
    if (!existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    let command = ''
    const platform = process.platform

    if (action === 'open-file') {
      // Open the file with default application
      switch (platform) {
        case 'win32':
          command = `start "" "${absolutePath}"`
          break
        case 'darwin':
          command = `open "${absolutePath}"`
          break
        case 'linux':
          command = `xdg-open "${absolutePath}"`
          break
        default:
          return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
      }
    } else if (action === 'open-location') {
      // Open the folder containing the file
      const directory = path.dirname(absolutePath)

      switch (platform) {
        case 'win32':
          command = `explorer /select,"${absolutePath}"`
          break
        case 'darwin':
          command = `open -R "${absolutePath}"`
          break
        case 'linux':
          command = `xdg-open "${directory}"`
          break
        default:
          return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Execute the command
    try {
      await execAsync(command)
      return NextResponse.json({ success: true, message: 'File operation completed' })
    } catch (error) {
      console.error('File operation error:', error)
      return NextResponse.json({ error: 'Failed to execute file operation' }, { status: 500 })
    }

  } catch (error) {
    console.error('File operation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
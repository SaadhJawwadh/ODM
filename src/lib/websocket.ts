
import { WebSocketServer, WebSocket } from 'ws'

let wss: WebSocketServer | null = null

export function initWebSocketServer() {
    if (wss) {
        return wss
    }

    try {
        // Try to get the global instance first (production)
        if (typeof global !== 'undefined' && (global as any).wss) {
            wss = (global as any).wss
            return wss
        }

        // If not available, create a new WebSocket server (development)
        wss = new WebSocketServer({ port: 3002 })

        wss.on('connection', (ws) => {
            console.log('WebSocket client connected')
            ws.on('close', () => console.log('WebSocket client disconnected'))
        })

        // Store globally for reuse
        if (typeof global !== 'undefined') {
            (global as any).wss = wss
        }

        console.log('WebSocket server initialized on port 3002')
        return wss
    } catch (error) {
        console.error('Failed to initialize WebSocket server:', error)
        return null
    }
}

export function getWebSocketServer() {
    if (!wss) {
        wss = initWebSocketServer()
    }
    return wss
}

export function broadcast(data: any) {
    const server = getWebSocketServer()
    if (!server) {
        console.error("WebSocket server not available.")
        return
    }

    const jsonData = JSON.stringify(data)

    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(jsonData)
        }
    })
}

// Initialize the WebSocket server immediately
initWebSocketServer()
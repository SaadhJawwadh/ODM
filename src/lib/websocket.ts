
import { WebSocketServer, WebSocket } from 'ws'

function getWebSocketServer() {
    // Access the global WSS instance created in server.js
    return (global as any).wss as WebSocketServer | undefined;
}

export function broadcast(data: any) {
    const wss = getWebSocketServer();
    if (!wss) {
        console.error("WebSocket server not available.");
        return
    }

    const jsonData = JSON.stringify(data)

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(jsonData)
        }
    })
}
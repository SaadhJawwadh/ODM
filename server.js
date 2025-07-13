
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const port = process.env.PORT || 3000;

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true)
        handle(req, res, parsedUrl)
    }).listen(port, (err) => {
        if (err) throw err
        console.log(`> Ready on http://localhost:${port}`)
    })

    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
        console.log('> WebSocket client connected')
        ws.on('close', () => console.log('> WebSocket client disconnected'))
    })

    // This is a global workaround for sharing the WSS instance in a Next.js environment.
    global.wss = wss;

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server')
        server.close(() => {
            console.log('HTTP server closed')
        })
    })
})
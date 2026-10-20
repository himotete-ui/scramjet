// Lightweight production server for the scramjet demo.
// Serves the built UI (packages/demo/dist) and the wisp websocket on ONE port.
// Run from the repo root:  node prod-server.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// @ts-ignore no typedefs
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "packages", "demo", "dist");
const PORT = Number(process.env.PORT) || 4141;

// Public server: never let proxy users reach Render's internal network.
wisp.options.allow_private_ips = false;
wisp.options.allow_loopback_ips = false;

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json",
	".map": "application/json",
	".wasm": "application/wasm",
	".png": "image/png",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".ttf": "font/ttf",
	".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
	const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
	let file = path.normalize(path.join(ROOT, urlPath));

	// block path traversal
	if (!file.startsWith(ROOT)) {
		res.writeHead(403).end("Forbidden");
		return;
	}
	if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
		file = path.join(file, "index.html");
	}
	if (!fs.existsSync(file)) {
		// fall back to index.html (single-page app)
		file = path.join(ROOT, "index.html");
	}

	const type = MIME[path.extname(file)] || "application/octet-stream";
	res.writeHead(200, {
		"Content-Type": type,
		// lets the service worker control the whole site
		"Service-Worker-Allowed": "/",
	});
	fs.createReadStream(file).pipe(res);
});

// websocket traffic to /wisp/ goes to the wisp server
server.on("upgrade", (req, socket, head) => {
	if ((req.url || "").startsWith("/wisp")) {
		wisp.routeRequest(req, socket, head);
	} else {
		socket.destroy();
	}
});

server.listen(PORT, "0.0.0.0", () => {
	console.log(`scramjet running on port ${PORT}`);
});

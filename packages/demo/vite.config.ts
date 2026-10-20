import { viteStaticCopy } from "vite-plugin-static-copy";

export default {
	server: {
		proxy: {
			"/wisp": {
				target: process.env.VITE_WISP_URL || "ws://localhost:4142/",
				ws: true,
				changeOrigin: true,
				rewrite: (path: string) => path.replace(/^\/wisp/, ""),
			},
		},
	},
	plugins: [
		viteStaticCopy({
			structured: false,
			targets: [
				{
					src: "node_modules/@mercuryworkshop/scramjet/dist/*",
					dest: "scramjet",
				},
				{
					src: "node_modules/@mercuryworkshop/scramjet-controller/dist/*",
					dest: "controller",
				},
				{
					src: "node_modules/@mercuryworkshop/libcurl-transport/dist/*",
					dest: "libcurl",
				},
			],
			watch: {
				reloadPageOnChange: true,
			},
		}),
	],
};

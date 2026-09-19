import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import Icons from 'unplugin-icons/vite'

// Plugin to prevent Rollup from trying to parse .node binary files
const nodeFilePlugin = {
    name: 'node-file-plugin',
    resolveId(id: string) {
        // Mark .node files as external
        if (id.endsWith('.node')) {
            return { id, external: true };
        }
        // Mark @napi-rs/canvas packages as external before they get processed
        if (id.startsWith('@napi-rs/canvas')) {
            return { id, external: true };
        }
    }
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    const extraAllowedHosts = (env.VITE_ALLOWED_HOSTS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const serverConfig: {
        allowedHosts: string[];
        origin?: string;
        host?: boolean;
        port?: number;
        fs?: { allow: string[] };
    } = {
        allowedHosts: [
            // '', // Put hosting location here (for much later)
            'localhost',
            '127.0.0.1',
            'lasallelocations',
            ...extraAllowedHosts
        ],
        host: true,
        port: 3000,
        fs: {
            allow: ["./uploads/"]
        }
    };

    if (env.VITE_PUBLIC_ORIGIN) {
        serverConfig.origin = env.VITE_PUBLIC_ORIGIN;
    }

    return {
		plugins: [nodeFilePlugin, sveltekit(), Icons({compiler: "svelte"})],
        optimizeDeps: {
            exclude: ["@napi-rs/canvas"]
        },
        ssr: {
            external: [
                "pdfjs-dist",
                "@napi-rs/canvas",
                "@napi-rs/canvas-android-arm64",
                "@napi-rs/canvas-darwin-arm64",
                "@napi-rs/canvas-darwin-x64",
                "@napi-rs/canvas-linux-arm-gnueabihf",
                "@napi-rs/canvas-linux-arm64-gnu",
                "@napi-rs/canvas-linux-arm64-musl",
                "@napi-rs/canvas-linux-riscv64-gnu",
                "@napi-rs/canvas-linux-x64-gnu",
                "@napi-rs/canvas-linux-x64-musl",
                "@napi-rs/canvas-win32-arm64-msvc",
                "@napi-rs/canvas-win32-x64-msvc"
            ]
        },
        build: {
            rollupOptions: {
                external: [
                    "pdfjs-dist",
                    "@napi-rs/canvas",
                    /^@napi-rs\/canvas-.*/
                ]
            }
        },
        server: serverConfig,
    };
});
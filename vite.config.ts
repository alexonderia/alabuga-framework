import {defineConfig} from 'vite';
import {resolve,extname,sep} from 'node:path';
import {readFile} from 'node:fs/promises';
export default defineConfig({base:'./',publicDir:false,server:{host:'127.0.0.1'},plugins:[{name:'framework-assets',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 const path=req.url?.split('?')[0]||'';if(!/^\/(assets|docs)\//.test(path))return next();
 const root=resolve(path.startsWith('/docs/')?'dist/docs':'.');const file=resolve(root,'.'+decodeURIComponent(path));if(!file.startsWith(root+sep))return next();
 try{const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'} as Record<string,string>)[extname(file)]||'application/octet-stream');res.end(body)}catch{next()}
 })}}],build:{outDir:'dist/docs',emptyOutDir:true,rollupOptions:{input:{docs:resolve('index.html'),panel:resolve('demos/panel.html'),form:resolve('demos/form.html'),slides:resolve('demos/slides.html'),showcase:resolve('demos/showcase.html')}}}});

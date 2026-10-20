import { z } from 'zod';

import {VERSION} from './version.js';
export {VERSION};
export const DOCUMENT_SCHEMA_VERSION = 3 as const;
export const SUPPORTED_DOCUMENT_SCHEMA_VERSIONS = [1,2,3] as const;
export function isSafeUrl(value: string): boolean {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith('//')) return false;
  try { return ['https:', 'http:'].includes(new URL(value, 'https://alabuga.invalid/').protocol); }
  catch { return false; }
}
const text = z.string().max(100000);
const url = z.string().max(4096).refine(isSafeUrl, 'Разрешены относительные ссылки и HTTP(S)');
function safeImageData(v:string){if(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(v))return true;if(!/^data:image\/svg\+xml;base64,[A-Za-z0-9+/]+={0,2}$/.test(v))return false;try{const xml=atob(v.split(',')[1]);return /<svg\b/.test(xml)&&/<\/svg>\s*$/.test(xml)&&!/<(?:script|foreignObject)\b|<!DOCTYPE|<!ENTITY|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?!#)|@import|url\(\s*["']?(?!#)/i.test(xml)}catch{return false}}
const imageUrl = z.string().max(3000000).refine(v=>isSafeUrl(v) || /^asset:[a-f0-9]{64}$/.test(v) || safeImageData(v),'Нужна безопасная ссылка или изображение PNG, JPEG, WebP, GIF, SVG');
const focalPoint=z.object({x:z.number().min(0).max(100),y:z.number().min(0).max(100)}).strict();
const position = z.object({ col: z.number().int().min(1).max(24), row: z.number().int().min(1).max(1000), width: z.number().int().min(1).max(24), height: z.number().int().min(1).max(100) }).strict();
const action=z.discriminatedUnion('type',[
  z.object({type:z.literal('link'),href:url}).strict(),
  z.object({type:z.enum(['section','slide','modal']),target:z.string().max(64)}).strict(),
  z.object({type:z.literal('close')}).strict(),
]);
const motion=z.object({effect:z.enum(['none','fade','rise','scale','sequence']),speed:z.enum(['fast','normal','slow']).default('normal'),intensity:z.enum(['subtle','expressive']).default('subtle'),step:z.number().int().min(0).max(20).default(0)}).strict();
export const backgroundPlacements=['none','full','left-quarter','right-quarter','left-third','right-third'] as const;
const typography=z.object({heading:z.union([z.literal(64),z.literal(80),z.literal(96),z.literal(112)]),body:z.union([z.literal(32),z.literal(36),z.literal(40)]),cardTitle:z.union([z.literal(36),z.literal(40),z.literal(44)]),caption:z.union([z.literal(24),z.literal(28)]),table:z.union([z.literal(28),z.literal(32)]),metric:z.union([z.literal(96),z.literal(120),z.literal(144)])}).strict();
export type SlideTypography=z.infer<typeof typography>;
const elementStyle=z.object({size:z.enum(['compact','normal','large']).optional(),color:z.enum(['inherit','ink','blue','white','muted']).optional(),padding:z.enum(['none','compact','normal','spacious']).optional(),locked:z.boolean().optional()}).strict();
export type ElementStyle=z.infer<typeof elementStyle>;
const base = { style:elementStyle.optional(), slot:z.string().max(64).optional(), typography:typography.optional(), id: z.string().regex(/^[a-zA-Z][\w-]{0,63}$/), title: z.string().max(200).default(''), align: z.enum(['left','center','right']).optional(), position, motion:motion.optional(), mobileOrder:z.number().int().min(0).max(100).optional(),tabletOrder:z.number().int().min(0).max(100).optional(),surface:z.enum(['plain','card']).optional() };
const contentBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text, dropCap: z.boolean().default(false) }).strict(),
  z.object({ type: z.literal('heading'), text }).strict(),
  z.object({ type: z.literal('list'), items: z.array(text).max(100), ordered: z.boolean().default(false) }).strict(),
  z.object({ type: z.literal('divider'), decorative: z.boolean().default(false) }).strict(),
  z.object({ type: z.literal('callout'), text, tone: z.enum(['info', 'success', 'warning', 'danger']).default('info') }).strict(),
  z.object({ type: z.literal('link'), text, href: url }).strict(),
]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {
  const d = new Date(s + 'T12:00:00Z'); return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === s;
}, 'Некорректная дата');
const cell = z.union([z.string().max(10000), z.number().finite(), z.null()]);
const widget = z.discriminatedUnion('type', [
  z.object({...base,type:z.literal('button'),label:z.string().max(200),action,variant:z.enum(['primary','secondary']).default('primary')}).strict(),
  z.object({...base,type:z.literal('quote'),text,author:z.string().max(200)}).strict(),
  z.object({...base,type:z.literal('cards'),items:z.array(z.object({title:z.string().max(200),text}).strict()).min(1).max(6)}).strict(),
  z.object({...base,type:z.literal('gallery'),items:z.array(z.object({src:imageUrl,alt:z.string().min(1).max(500),caption:z.string().max(1000)}).strict()).min(1).max(6)}).strict(),
  z.object({ ...base, type: z.literal('text'), content: z.array(contentBlock).max(200) }).strict(),
  z.object({ ...base, type: z.literal('image'), src: imageUrl, alt: z.string().min(1).max(500), fit: z.enum(['cover', 'contain']).default('cover'), focalPoint:focalPoint.optional(),mobileFocalPoint:focalPoint.optional(),focal:z.enum(['center','top','bottom','left','right']).optional(),caption: z.string().max(1000).default('') }).strict(),
  z.object({ ...base, type: z.literal('metric'), value: z.string().max(30), note: z.string().max(100).default('') }).strict(),
  z.object({ ...base, type: z.literal('calendar'), date: isoDate }).strict(),
  z.object({ ...base, type: z.literal('table'), wrap:z.boolean().optional(), variant:z.enum(['corporate','striped','minimal']).optional(), columns: z.array(z.object({ key: z.string().regex(/^[a-zA-Z][\w-]{0,63}$/).refine(v => !['__proto__','constructor','prototype'].includes(v)), label: z.string().max(100) }).strict()).min(1).max(30), rows: z.array(z.record(z.string(), cell)).max(5000), pageSize: z.number().int().min(1).max(100).default(5) }).strict(),
]);
const grid = z.object({ columns: z.number().int().min(1).max(24).default(12), rowHeight: z.number().int().min(32).max(160).default(64), gap: z.number().int().min(0).max(48).default(16) }).strict().default({ columns: 12, rowHeight: 64, gap: 16 });
const appearance=z.object({backgroundId:z.string().max(100).optional(),backgroundPlacement:z.enum(backgroundPlacements).optional(),fitted:z.boolean().optional(),theme:z.enum(['light','contrast','accent','image']).default('light'),spacing:z.enum(['compact','normal','generous']).default('normal'),width:z.enum(['wide','narrow']).default('wide'),layout:z.enum(['fixed','flow']).default('flow'),decoration:z.enum(['none','orbit','lines']).default('none'),background:imageUrl.optional(),focalPoint:focalPoint.optional(),mobileFocalPoint:focalPoint.optional(),focal:z.enum(['center','top','bottom','left','right']).default('center'),shade:z.enum(['medium','strong']).default('strong')}).strict();
const page = z.object({ layoutVariant:z.enum(['primary','stacked','asymmetric']).optional(), id: z.string().regex(/^[a-zA-Z][\w-]{0,63}$/), title: z.string().max(200), role:z.enum(['header','content','footer']).optional(),composition:z.string().max(40).optional(),appearance:appearance.optional(),transition:z.enum(['none','fade','slide']).optional(), grid, widgets: z.array(widget).max(100) }).strict();
const schema = z.object({ schemaVersion: z.union([z.literal(1),z.literal(2),z.literal(3)]), kind: z.enum(['page', 'presentation']), title: z.string().min(1).max(200), pages: z.array(page).min(1).max(100),modals:z.array(z.object({id:z.string().regex(/^[a-zA-Z][\w-]{0,63}$/),title:z.string().min(1).max(200),text}).strict()).max(20).optional() }).strict();
export type AFDocument = z.infer<typeof schema>;
export type Widget = z.infer<typeof widget>;
export type TextBlock = z.infer<typeof contentBlock>;
export type Section=AFDocument['pages'][number];
export type Action=z.infer<typeof action>;
export type ValidationIssue = { path: string; message: string };
export const widgetRegistry = Object.freeze({
  button:{title:'Кнопка',minWidth:2,minHeight:1},quote:{title:'Цитата',minWidth:3,minHeight:2},cards:{title:'Карточки',minWidth:4,minHeight:2},gallery:{title:'Галерея',minWidth:4,minHeight:3},
  text: { title: 'Текст', minWidth: 1, minHeight: 1 },
  image: { title: 'Изображение', minWidth: 2, minHeight: 2 },
  metric: { title: 'Показатель', minWidth: 1, minHeight: 1 },
  calendar: { title: 'Календарь', minWidth: 4, minHeight: 4 },
  table: { title: 'Таблица', minWidth: 2, minHeight: 2 },
});
export type ValidationResult = { success: true; data: AFDocument; issues: [] } | { success: false; issues: ValidationIssue[] };
export function validateDocument(input: unknown): ValidationResult {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, issues: parsed.error.issues.map(e => ({ path: e.path.join('.'), message: e.message })) };
  const doc = parsed.data;
  doc.schemaVersion=3;
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  for(const modal of doc.modals??[]){if(ids.has(modal.id))issues.push({path:'modals',message:'Повторяющийся ID'});ids.add(modal.id)}
  doc.pages.forEach((p, pi) => {
    if (ids.has(p.id)) issues.push({ path: `pages.${pi}.id`, message: 'Повторяющийся ID' });
    ids.add(p.id);
    p.widgets.forEach((w, wi) => {
      const path = `pages.${pi}.widgets.${wi}`;
      if (ids.has(w.id)) issues.push({ path: path + '.id', message: 'Повторяющийся ID' });
      ids.add(w.id);
      const r = widgetRegistry[w.type], a = w.position;
      if(w.type==='button'&&'target'in w.action){const target=w.action.target;const exists=w.action.type==='modal'?doc.modals?.some(m=>m.id===target):doc.pages.some(p=>p.id===target);if(!exists||w.action.type==='slide'&&doc.kind!=='presentation'||w.action.type==='section'&&doc.kind!=='page')issues.push({path:path+'.action',message:'Цель действия недоступна'});}
      if (a.width < r.minWidth || a.height < r.minHeight) issues.push({ path: path + '.position', message: `Минимум для «${r.title}»: ${r.minWidth}×${r.minHeight}` });
      if (a.col + a.width - 1 > p.grid.columns) issues.push({ path: path + '.position', message: 'Виджет выходит за границы колонок' });
      if (doc.kind === 'presentation' && (a.row + a.height - 1) * (p.grid.rowHeight + p.grid.gap) - p.grid.gap > 688) issues.push({ path: path + '.position', message: 'Виджет выходит за высоту слайда' });
      for (const other of p.widgets.slice(0, wi)) {
        const b = other.position;
        if (a.col < b.col + b.width && a.col + a.width > b.col && a.row < b.row + b.height && a.row + a.height > b.row) issues.push({ path: path + '.position', message: `Пересечение с ${other.id}` });
      }
      if (w.type === 'table') {
        const keys = w.columns.map(c => c.key);
        if (new Set(keys).size !== keys.length) issues.push({ path: path + '.columns', message: 'Повторяющийся ключ колонки' });
        if (w.rows.some(row => Object.keys(row).some(k => !keys.includes(k)))) issues.push({ path: path + '.rows', message: 'Неизвестная колонка в данных' });
      }
    });
  });
  return issues.length ? { success: false, issues } : { success: true, data: doc, issues: [] };
}

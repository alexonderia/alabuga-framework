import './styles.css';
import './compositions.css';
export { VERSION, validateDocument, widgetRegistry, isSafeUrl } from './schema';
export type { AFDocument, Widget, TextBlock, ValidationResult } from './schema';
export { renderDocument } from './runtime';
export type { DocumentController } from './runtime';
export { initComponents } from './components';
export {compositions,compositionCatalog,makeComposition,changeComposition,showcase} from './compositions';
export type {Section,Action} from './schema';
export {fitSlide,measureSlide,slideBackgrounds} from './slide-fit';
export type {FitSlideOptions,FitSlideResult,BackgroundPlacement} from './slide-fit';
export type {SlideTypography} from './schema';

export {applyLayoutVariant,layoutVariants,semanticSlots} from './layout-variants';
export type {ElementStyle} from './schema';

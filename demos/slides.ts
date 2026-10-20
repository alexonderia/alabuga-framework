import '@alabuga/framework/standalone.css';
import { renderDocument } from '@alabuga/framework';
import { presentationExample } from '@alabuga/framework/examples';
import './style.css';
const controller=renderDocument(document.querySelector<HTMLElement>('#document')!,presentationExample('../assets/brand-landscape.svg'));
// Expose the same public controller for the demo's integration tests and inspection.
Object.assign(window,{demoController:controller});

declare const __AF_VERSION__:string;
export const VERSION=typeof __AF_VERSION__==='undefined'?'development':__AF_VERSION__;

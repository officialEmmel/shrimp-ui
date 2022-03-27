export class Events {
    static fire(type: string, detail: any) {
        window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }
  
    static on(type: any, callback: (this: Window, ev: any) => any) {
        return window.addEventListener(type, callback, false);
    }
  
    static off(type: any, callback: (this: Window, ev: any) => any) {
      return window.removeEventListener(type, callback, false);
  }
}
declare module 'lodash/debounce' {
  const debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: import('lodash').DebounceSettings
  ) => import('lodash').DebouncedFunc<T>;
  export default debounce;
}

declare module 'lodash/throttle' {
  const throttle: <T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: import('lodash').ThrottleSettings
  ) => import('lodash').DebouncedFunc<T>;
  export default throttle;
}

declare module 'lodash' {
  export interface DebounceSettings {
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
  }
  export interface ThrottleSettings {
    leading?: boolean;
    trailing?: boolean;
  }
  export interface DebouncedFunc<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T> | undefined;
    cancel(): void;
    flush(): ReturnType<T> | undefined;
  }
  export const debounce: any;
  export const throttle: any;
}

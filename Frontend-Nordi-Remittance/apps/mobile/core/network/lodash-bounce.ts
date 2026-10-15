import debounce from "lodash/debounce";
import throttle from "lodash/throttle";
import { DebouncedFunc, ThrottleSettings, DebounceSettings } from "lodash";

export function createDebounce<T extends (...args: any) => any>(
    func: T,
    wait: number = 300,
    options?: DebounceSettings,
): DebouncedFunc<T> {
    return debounce(func, wait, options);
}

export function createThrottle<T extends (...args: any) => any>(
    func: T,
    wait: number = 300,
    options?: ThrottleSettings,
): DebouncedFunc<T> {
    return throttle(func, wait, options);
}

export { debounce, throttle };
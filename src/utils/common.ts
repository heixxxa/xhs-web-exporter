import dayjs from 'dayjs';
import { useSignal } from '@preact/signals';
import logger from './logger';

/**
 * JSON.parse with error handling.
 */
export function safeJSONParse(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    logger.error((e as Error).message);
    return null;
  }
}

/**
 * Use signal to mimic React's `useState` hook.
 */
export function useSignalState<T>(value: T) {
  const signal = useSignal(value);

  const updateSignal = (newValue: T) => {
    signal.value = newValue;
  };

  return [signal.value, updateSignal, signal] as const;
}

/**
 * A signal representing a boolean value.
 */
export function useToggle(defaultValue = false) {
  const signal = useSignal(defaultValue);

  const toggle = () => {
    signal.value = !signal.value;
  };

  return [signal.value, toggle, signal] as const;
}

/**
 * Merge CSS class names.
 * Avoid using `tailwind-merge` here since it increases bundle size.
 *
 * @example
 * cx('foo', 'bar', false && 'baz') // => 'foo bar'
 */
export function cx(...classNames: (string | boolean | undefined)[]) {
  return classNames.filter(Boolean).join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isEqual(obj1: any, obj2: any) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDateTime(date: string | number | dayjs.Dayjs, format?: string) {
  if (typeof date === 'number' || typeof date === 'string') {
    date = dayjs(date);
  }

  // Display in local time zone.
  return date.format(format);
}

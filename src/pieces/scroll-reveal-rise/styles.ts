import type {CSSProperties} from 'react';

export const styles = {
  anchor: {minWidth: 0},
  button: {display: 'inline-block', verticalAlign: 'top'},
  content: {display: 'flow-root', minWidth: 0},
  focus: {outline: '3px solid currentColor', outlineOffset: 4},
} satisfies Record<string, CSSProperties>;

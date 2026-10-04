import { type ReactNode } from 'react';
import { type MotionDials } from '../../dials.js';
export interface AccordionItem {
    /** Stable, unique item id. Duplicate ids are ignored after their first item. */
    id: string;
    /** Header content; do not put interactive elements inside this button label. */
    heading: ReactNode;
    content: ReactNode;
}
export interface AccordionProps {
    items: readonly AccordionItem[];
    /** Supports speed and cascade. Unsupported settings are ignored. */
    dials?: MotionDials;
    /** Allow several open panels. Default false; overrides the cascade dial. */
    multiple?: boolean;
    /** Initial open item ids; defaults to []. Unknown and repeated ids are ignored. */
    defaultOpenIds?: readonly string[];
    /** Panel duration in seconds, 0–2. Default .5; overrides speed. */
    duration?: number;
    /** Called after a user toggles a header, with the resulting open ids. */
    onChange?: (openIds: string[]) => void;
}
/** A disclosure group with an explicitly authorized animated grid-row height. */
export declare function Accordion({ items, dials, multiple, defaultOpenIds, duration, onChange }: AccordionProps): import("react").JSX.Element;

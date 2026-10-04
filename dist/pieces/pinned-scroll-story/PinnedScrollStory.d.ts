import { type ReactNode, type CSSProperties } from 'react';
import { type PinnedScrollStorySettings } from './settings';
export interface PinnedScrollStoryItem {
    id: string;
    label: string;
    content: ReactNode;
    thumbnail?: ReactNode;
}
export interface PinnedScrollStoryProps extends PinnedScrollStorySettings {
    items: readonly PinnedScrollStoryItem[];
    overviewLabel?: string;
    ariaLabel?: string;
    className?: string;
    style?: CSSProperties;
}
export declare function PinnedScrollStory({ items, overviewLabel, ariaLabel, className, style, ...settings }: PinnedScrollStoryProps): import("react").JSX.Element | null;

import type { CSSProperties } from 'react';
export declare const styles: {
    region: {
        position: "relative";
        width: string;
        minWidth: number;
        color: "inherit";
        fontFamily: "inherit";
    };
    viewport: {
        display: "grid";
        placeItems: "center";
        overflow: "hidden";
        padding: string;
        touchAction: "pan-y pinch-zoom";
        userSelect: "none";
        isolation: "isolate";
    };
    card: {
        gridArea: "1 / 1";
        position: "relative";
        aspectRatio: "3 / 4";
        borderRadius: number;
        overflow: "hidden";
        background: string;
        color: "#fff";
        boxShadow: "0 12px 24px -16px rgba(0,0,0,.55)";
        transformOrigin: string;
        minWidth: number;
    };
    image: {
        position: "absolute";
        inset: number;
        width: string;
        height: string;
        objectFit: "cover";
        pointerEvents: "none";
    };
    content: {
        position: "absolute";
        inset: number;
        display: "flex";
        flexDirection: "column";
        justifyContent: "flex-end";
        padding: string;
        background: string;
    };
    title: {
        fontSize: string;
        lineHeight: number;
        letterSpacing: string;
        margin: string;
        overflowWrap: "anywhere";
    };
    text: {
        fontSize: number;
        lineHeight: number;
        margin: string;
        overflowWrap: "anywhere";
    };
    cta: {
        alignSelf: "flex-start";
        display: "inline-flex";
        padding: string;
        borderRadius: number;
        color: "#14262a";
        background: string;
        fontSize: number;
        fontWeight: number;
        textDecoration: string;
    };
    dots: {
        display: "flex";
        flexWrap: "wrap";
        justifyContent: "center";
        gap: number;
        padding: string;
    };
    dot: {
        display: "grid";
        placeItems: "center";
        width: number;
        height: number;
        padding: number;
        border: number;
        borderRadius: number;
        background: string;
        color: "inherit";
        cursor: "pointer";
    };
    dotMark: {
        display: "block";
        width: number;
        height: number;
        borderRadius: number;
        background: string;
    };
    srOnly: {
        position: "absolute";
        width: number;
        height: number;
        padding: number;
        margin: number;
        overflow: "hidden";
        clipPath: "inset(50%)";
        whiteSpace: "nowrap";
        border: number;
    };
};
export declare const focusRing: CSSProperties;

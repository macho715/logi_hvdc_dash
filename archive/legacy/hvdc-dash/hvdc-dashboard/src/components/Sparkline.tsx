/*
 * Sparkline.tsx
 *
 * A lightweight React component for rendering mini line charts (sparklines)
 * without any external charting libraries. The component leverages basic
 * SVG elements to draw a polyline based off of the provided data.
 */

"use client";

import React from "react";

export interface SparklineProps {
    /**
     * Numeric data to plot. Must contain at least two values to draw a line.
     */
    data: number[];
    /**
     * Stroke colour for the line. Accepts any valid CSS colour string.
     * Defaults to the current text colour (inherit).
     */
    color?: string;
    /**
     * Additional CSS classes applied to the SVG element. Optional.
     */
    className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, className }) => {
    // Do not render when there are insufficient points
    if (!data || data.length < 2) {
        return null;
    }

    // Determine data bounds to normalise values
    const min = Math.min(...data);
    const max = Math.max(...data);

    // Precompute the polyline point string. Use a fixed height (32) and width (100)
    // for the viewBox so that scaling is consistent. The y coordinate is inverted
    // (height - scaled value) because SVG origin (0,0) is at the top‑left.
    const points = data
        .map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            // Avoid division by zero when all values are equal; treat range as 1
            const range = max - min === 0 ? 1 : max - min;
            const y = 32 - ((value - min) / range) * 32;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg
            viewBox="0 0 100 32"
            className={className}
            fill="none"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "1.5rem" }}
        >
            <polyline
                points={points}
                stroke={color ?? "currentColor"}
                strokeWidth={2}
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
};

export default Sparkline;

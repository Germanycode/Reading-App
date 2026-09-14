"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import HTMLFlipBook from "react-pageflip";

type FlipCorner = "top" | "bottom";

export type FlipBookPageFlip = {
  flipPrev: (corner?: FlipCorner) => void;
  flipNext: (corner?: FlipCorner) => void;
  turnToPage: (pageIndex: number) => void;
};

export type FlipBookRef = {
  pageFlip: () => FlipBookPageFlip;
};

type HTMLFlipBookClientProps = {
  bookRef: RefObject<FlipBookRef | null>;
  width: number;
  height: number;
  size: "fixed" | "stretch";
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  startPage: number;
  drawShadow: boolean;
  flippingTime: number;
  usePortrait: boolean;
  startZIndex: number;
  autoSize: boolean;
  maxShadowOpacity: number;
  showCover: boolean;
  mobileScrollSupport: boolean;
  clickEventForward: boolean;
  useMouseEvents: boolean;
  swipeDistance: number;
  showPageCorners: boolean;
  disableFlipByClick: boolean;
  className: string;
  style: CSSProperties;
  renderOnlyPageLengthChange?: boolean;
  onFlip?: (event: { data: number }) => void;
  children: ReactNode;
};

export function HTMLFlipBookClient({
  bookRef,
  children,
  ...props
}: HTMLFlipBookClientProps) {
  return (
    <HTMLFlipBook ref={bookRef} {...props}>
      {children}
    </HTMLFlipBook>
  );
}

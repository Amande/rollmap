"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";
import type MapComponent from "./Map";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[250px] bg-bg3 animate-pulse rounded-[10px] flex items-center justify-center">
      <span className="text-text3 text-sm">Loading map...</span>
    </div>
  ),
});

export default function MapDynamic(props: ComponentProps<typeof MapComponent>) {
  return <Map {...props} />;
}

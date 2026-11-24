// frontend/components/icons/papicon.tsx

import * as React from "react";

const papiconSources = import.meta.glob<string>("./papicons/*.svg", {
  eager: true,
  import: "default",
  query: "?raw",
});

type NameFromPath<Path> = Path extends `./papicons/${infer Name}.svg` ? Name : never;

export type PapiconName = NameFromPath<keyof typeof papiconSources>;

export type PapiconProps = Omit<React.SVGProps<SVGSVGElement>, "height" | "name" | "width"> & {
  name: PapiconName;
  size?: number | string;
};

export function Papicon({ name, size = 24, color, style, ...props }: PapiconProps) {
  const source = papiconSources[`./papicons/${name}.svg` as keyof typeof papiconSources];
  const match = source.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);

  if (!match) {
    throw new Error(`Papicons SVG "${name}" is invalid.`);
  }

  const content = match[1].replace(/(fill=")(?!none)[^"]+(")/g, "$1currentColor$2");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      focusable="false"
      {...props}
      aria-hidden={props["aria-hidden"] ?? !props["aria-label"]}
      style={{ color, ...style }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

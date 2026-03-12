"use client";

import { useEffect } from "react";

type ClientBodyClassNamesProps = {
  classNames: string[];
};

export default function ClientBodyClassNames({
  classNames,
}: ClientBodyClassNamesProps) {
  const classNamesKey = classNames.filter(Boolean).join(" ");

  useEffect(() => {
    const normalizedClassNames = classNamesKey.split(" ").filter(Boolean);
    if (normalizedClassNames.length === 0) {
      return;
    }

    const { classList } = document.body;
    normalizedClassNames.forEach((className) => {
      classList.add(className);
    });

    return () => {
      normalizedClassNames.forEach((className) => {
        classList.remove(className);
      });
    };
  }, [classNamesKey]);

  return null;
}

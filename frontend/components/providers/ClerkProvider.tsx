"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function AppClerkProvider({ children }: Props) {
  return <ClerkProvider>{children}</ClerkProvider>;
}



"use client";

import { useEffect, useState } from "react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { getOrCreateUser, type User as DbUser } from "@/lib/supabase";

interface UseUserResult {
  clerkUser: ReturnType<typeof useClerkUser>["user"];
  dbUser: DbUser | null;
  loading: boolean;
}

export function useUser(): UseUserResult {
  const { user } = useClerkUser();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setDbUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    getOrCreateUser(
      user.id,
      user.emailAddresses[0]?.emailAddress || "",
      user.fullName || undefined
    )
      .then((u) => setDbUser(u))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to sync user with Supabase", err);
        setDbUser(null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return { clerkUser: user, dbUser, loading };
}



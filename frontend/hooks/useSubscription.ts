"use client";

import { useEffect, useState } from "react";
import { supabase, type User } from "@/lib/supabase";

type SubscriptionTier = User["subscription_tier"];

interface SubscriptionState {
  tier: SubscriptionTier;
  loading: boolean;
}

export function useSubscription(userId: string | null | undefined): SubscriptionState {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("subscription_tier")
          .eq("id", userId)
          .single();

        if (error) throw error;
        if (data?.subscription_tier) {
          setTier(data.subscription_tier);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load subscription", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  return { tier, loading };
}



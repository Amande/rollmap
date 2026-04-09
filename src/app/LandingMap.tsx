"use client";

import { useEffect, useState } from "react";
import MapDynamic from "@/components/MapDynamic";
import { Club } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export default function LandingMap() {
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    async function fetchClubs() {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name, lat, lng, city, country, gi, nogi, open_mat, drop_in")
        .not("lat", "is", null)
        .not("lng", "is", null)
        .limit(2000);

      if (!error && data) {
        setClubs(data as Club[]);
      }
    }
    fetchClubs();
  }, []);

  return <MapDynamic clubs={clubs} center={[30, 0]} zoom={2} />;
}

export interface Club {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  email: string | null;
  drop_in: boolean | null;
  gi: boolean | null;
  nogi: boolean | null;
  open_mat: boolean | null;
  price: string | null;
  nb_licencies: string | null;
  source: string | null;
  source_url: string | null;
  kids_friendly: boolean | null;
  schedule_notes: string | null;
  drop_in_price: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubFilters {
  gi?: boolean;
  nogi?: boolean;
  open_mat?: boolean;
  drop_in?: boolean;
  kids_friendly?: boolean;
}

export interface SearchParams {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

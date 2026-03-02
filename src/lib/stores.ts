/**
 * Demo stores with predefined locations
 * Used for POS dropdown in payment flow
 */

export interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const STORES: Store[] = [
  {
    id: "fira-montjuic",
    name: "Fira Montjuïc · Talent Arena",
    address: "Av. Reina María Cristina, Barcelona",
    latitude: 41.371178,
    longitude: 2.147488,
  },
  {
    id: "plaza-espanya",
    name: "Plaza d'Espanya",
    address: "Plaça d'Espanya, Barcelona",
    latitude: 41.375236,
    longitude: 2.146984,
  },
  {
    id: "passeig-gracia",
    name: "Passeig de Gràcia",
    address: "Passeig de Gràcia 92, Barcelona",
    latitude: 41.395887,
    longitude: 2.161632,
  },
  {
    id: "las-ramblas",
    name: "Las Ramblas",
    address: "La Rambla 100, Barcelona",
    latitude: 41.385064,
    longitude: 2.173404,
  },
  {
    id: "custom",
    name: "Use custom coordinates",
    address: "Enter lat/lng manually",
    latitude: 0,
    longitude: 0,
  },
];

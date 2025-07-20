export interface Location {
    latitude: number;
    longitude: number;
}

export interface Report {
    description: string;
    mediaUrl: string;
    location: Location;
    place: string;
  }
  
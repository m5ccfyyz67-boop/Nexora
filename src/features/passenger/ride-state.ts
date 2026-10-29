import type { RideStatus } from '../../types/database';

export const rideStatusLabels: Record<RideStatus, string> = {
  searching: 'Demande enregistrée',
  assigned: 'Chauffeur attribué',
  driver_en_route: 'Chauffeur en route',
  driver_arrived: 'Chauffeur arrivé',
  in_progress: 'Trajet en cours',
  completed: 'Trajet terminé',
  cancelled: 'Trajet annulé',
  no_driver: 'Aucun chauffeur disponible',
};

export function isRideActive(status: RideStatus): boolean {
  return ['searching', 'assigned', 'driver_en_route', 'driver_arrived', 'in_progress'].includes(status);
}

export function isRideCancellable(status: RideStatus, hasAssignedDriver: boolean): boolean {
  return status === 'searching' && !hasAssignedDriver;
}

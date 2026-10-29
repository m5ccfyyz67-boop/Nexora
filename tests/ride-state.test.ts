import { describe, expect, it } from 'vitest';
import { isRideActive, isRideCancellable, rideStatusLabels } from '../src/features/passenger/ride-state';
import type { RideStatus } from '../src/types/database';

describe('machine à états des trajets passager', () => {
  it('considère la recherche, l’attribution et le trajet en cours comme actifs', () => {
    const active: RideStatus[] = ['searching', 'assigned', 'driver_en_route', 'driver_arrived', 'in_progress'];
    for (const status of active) expect(isRideActive(status)).toBe(true);
  });

  it('considère les états finaux comme inactifs', () => {
    const terminal: RideStatus[] = ['completed', 'cancelled', 'no_driver'];
    for (const status of terminal) expect(isRideActive(status)).toBe(false);
  });

  it('permet l’annulation uniquement d’une demande non encore attribuée', () => {
    expect(isRideCancellable('searching', false)).toBe(true);
    expect(isRideCancellable('searching', true)).toBe(false);
    expect(isRideCancellable('assigned', true)).toBe(false);
    expect(isRideCancellable('completed', false)).toBe(false);
  });

  it('fournit un libellé français pour chaque état du schéma', () => {
    const statuses: RideStatus[] = ['searching', 'assigned', 'driver_en_route', 'driver_arrived', 'in_progress', 'completed', 'cancelled', 'no_driver'];
    expect(Object.keys(rideStatusLabels).sort()).toEqual(statuses.slice().sort());
    for (const status of statuses) expect(rideStatusLabels[status].length).toBeGreaterThan(0);
  });
});

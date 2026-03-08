/**
 * Device Repository
 *
 * Extends BaseRepository with device-specific data access methods.
 */

import { BaseRepository } from './base.repository';
import Device from '@/app/models/Device';
import type { IDevice } from '@/app/types';

class DeviceRepository extends BaseRepository<IDevice> {
  constructor() {
    super(Device);
  }

  /** Find all trusted devices for a user. */
  async findByUser(userId: string): Promise<IDevice[]> {
    return this.findAll({ user: userId }, { sort: { lastSeenAt: -1 } });
  }

  /** Find a specific device by user + deviceId. */
  async findByDeviceId(userId: string, deviceId: string): Promise<IDevice | null> {
    return this.findOne({ user: userId, deviceId });
  }

  /** Update lastSeenAt for a device (called on login / app open). */
  async touch(userId: string, deviceId: string): Promise<IDevice | null> {
    return this.model.findOneAndUpdate(
      { user: userId, deviceId },
      { lastSeenAt: new Date() },
      { returnDocument: 'after' }
    );
  }

  /** Delete all devices belonging to a user (cascade). */
  async deleteByUser(userId: string): Promise<number> {
    return this.deleteWhere({ user: userId });
  }

  /** Delete a specific device by user + deviceId. */
  async deleteByDeviceId(userId: string, deviceId: string): Promise<IDevice | null> {
    return this.model.findOneAndDelete({ user: userId, deviceId });
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let instance: DeviceRepository | null = null;

export function getDeviceRepository(): DeviceRepository {
  if (!instance) instance = new DeviceRepository();
  return instance;
}

export { DeviceRepository };

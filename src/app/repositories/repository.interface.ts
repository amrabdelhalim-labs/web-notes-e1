/**
 * Repository Interface
 *
 * Defines the contract that all repositories must implement.
 * Provides a consistent API for data access operations across all entities.
 */

import { Document, QueryFilter, UpdateQuery, QueryOptions } from 'mongoose';
import type { PaginatedResult } from '@/app/types';

export interface IRepository<T extends Document> {
  /** Find all documents matching a filter. */
  findAll(filter?: QueryFilter<T>, options?: QueryOptions<T>): Promise<T[]>;

  /** Find a single document matching a filter. */
  findOne(filter: QueryFilter<T>, options?: QueryOptions<T>): Promise<T | null>;

  /** Find a document by its `_id`. */
  findById(id: string, options?: QueryOptions<T>): Promise<T | null>;

  /** Find documents with safe pagination (bounded page/limit). */
  findPaginated(
    page: number,
    limit: number,
    filter?: QueryFilter<T>,
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>>;

  /** Create a new document. */
  create(data: Partial<T>): Promise<T>;

  /** Update a document by `_id` and return the updated version. */
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;

  /** Update all documents matching a filter. Returns number of modified docs. */
  updateWhere(filter: QueryFilter<T>, data: UpdateQuery<T>): Promise<number>;

  /** Delete a document by `_id` and return the deleted version. */
  delete(id: string): Promise<T | null>;

  /** Delete all documents matching a filter. Returns number of deleted docs. */
  deleteWhere(filter: QueryFilter<T>): Promise<number>;

  /** Check if at least one document matches the filter. */
  exists(filter: QueryFilter<T>): Promise<boolean>;

  /** Count documents matching a filter. */
  count(filter?: QueryFilter<T>): Promise<number>;
}

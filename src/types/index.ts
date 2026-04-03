export * from './xhs';

/**
 * Represents a piece of data captured by an extension.
 */
export interface Capture {
  /** Unique identifier for the capture. */
  id: string;
  /** Name of extension that captured the data. */
  extension: string;
  /** Type of data captured. */
  type: string;
  /** The index of the captured item. Use this to query actual data from the database. */
  data_key: string;
  /** Timestamp when the data was captured. */
  created_at: number;
}

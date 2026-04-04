import { unsafeWindow } from '$';
import Dexie, { KeyPaths } from 'dexie';
import { exportDB, importInto } from 'dexie-export-import';

import packageJson from '@/../package.json';
import { Capture } from '@/types';
import { XHSComment, XHSNote } from '@/types/xhs';
import logger from '@/utils/logger';
import { ExtensionType } from '../extensions';
import { options } from '../options';

const DB_NAME = packageJson.name;
const DB_VERSION = 5;

declare global {
  interface Window {
    __META_DATA__: {
      userId: string;
      userHash: string;
    };
  }
}

export class DatabaseManager {
  private db: Dexie;

  constructor() {
    const globalObject = unsafeWindow ?? window ?? globalThis;
    const userId = globalObject.__META_DATA__?.userId ?? 'unknown';
    const suffix = options.get('dedicatedDbForAccounts') ? `_${userId}` : '';
    logger.debug(`Using database: ${DB_NAME}${suffix} for userId: ${userId}`);

    this.db = new Dexie(`${DB_NAME}${suffix}`);
    this.init();
  }

  /*
  |--------------------------------------------------------------------------
  | Type-Safe Table Accessors
  |--------------------------------------------------------------------------
  */

  private xhsNotes() {
    return this.db.table<XHSNote>('xhs_notes');
  }

  private xhsComments() {
    return this.db.table<XHSComment>('xhs_comments');
  }

  private captures() {
    return this.db.table<Capture>('captures');
  }

  /*
  |--------------------------------------------------------------------------
  | Read Methods for Extensions
  |--------------------------------------------------------------------------
  */

  async extGetCaptures(extName: string) {
    return this.captures()
      .where('extension')
      .equals(extName)
      .toArray()
      .catch((error) => {
        this.logError(error);
        return [];
      });
  }

  async extGetCaptureCount(extName: string) {
    return this.captures()
      .where('extension')
      .equals(extName)
      .count()
      .catch((error) => {
        this.logError(error);
        return 0;
      });
  }

  async extGetCapturedXHSNotes(extName: string) {
    const captures = await this.extGetCaptures(extName);
    if (captures.length === 0) {
      return [];
    }

    const noteIds = captures.map((capture) => capture.data_key);
    const notes = await this.xhsNotes()
      .where('note_id')
      .anyOf(noteIds)
      .toArray()
      .catch((error) => {
        this.logError(error);
        return [];
      });

    return this.mergeCaptureMetadata(captures, notes, (note) => note.note_id);
  }

  async extGetCapturedXHSComments(extName: string) {
    const captures = await this.extGetCaptures(extName);
    if (captures.length === 0) {
      return [];
    }

    const commentIds = captures.map((capture) => capture.data_key);
    const comments = await this.xhsComments()
      .where('comment_id')
      .anyOf(commentIds)
      .toArray()
      .catch((error) => {
        this.logError(error);
        return [];
      });

    return this.mergeCaptureMetadata(captures, comments, (comment) => comment.comment_id);
  }

  /*
  |--------------------------------------------------------------------------
  | Write Methods for Extensions
  |--------------------------------------------------------------------------
  */

  async extAddXHSNotes(extName: string, notes: XHSNote[]) {
    if (notes.length === 0) return;

    const capturedAt = Date.now();
    await this.xhsNotes().bulkPut(notes);
    await this.upsertCaptures(
      notes.map((note) => ({
        id: `${extName}-${note.note_id}`,
        extension: extName,
        type: ExtensionType.NOTE,
        data_key: note.note_id,
        created_at: capturedAt,
      })),
    );
  }

  async extAddXHSComments(extName: string, comments: XHSComment[]) {
    if (comments.length === 0) return;

    const capturedAt = Date.now();
    await this.xhsComments().bulkPut(comments);
    await this.upsertCaptures(
      comments.map((comment) => ({
        id: `${extName}-${comment.comment_id}`,
        extension: extName,
        type: ExtensionType.COMMENT,
        data_key: comment.comment_id,
        created_at: capturedAt,
      })),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Methods for Extensions
  |--------------------------------------------------------------------------
  */

  async extClearCaptures(extName: string) {
    const captures = await this.extGetCaptures(extName);
    if (!captures) {
      return;
    }

    return this.captures().bulkDelete(captures.map((capture) => capture.id));
  }

  /*
  |--------------------------------------------------------------------------
  | Export and Import Methods
  |--------------------------------------------------------------------------
  */

  async export() {
    return exportDB(this.db).catch(this.logError);
  }

  async import(data: Blob) {
    return importInto(this.db, data).catch(this.logError);
  }

  async clear() {
    await this.clearAllData();
    logger.info('Database cleared');
  }

  async count() {
    try {
      return {
        notes: await this.xhsNotes().count(),
        comments: await this.xhsComments().count(),
        captures: await this.captures().count(),
      };
    } catch (error) {
      this.logError(error);
      return null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Common Methods
  |--------------------------------------------------------------------------
  */

  async upsertCaptures(captures: Capture[]) {
    return this.db
      .transaction('rw', this.captures(), () => {
        return this.captures().bulkPut(captures).catch(this.logError);
      })
      .catch(this.logError);
  }

  private mergeCaptureMetadata<T extends { captured_at?: number }>(
    captures: Capture[],
    records: T[],
    getDataKey: (record: T) => string,
  ) {
    const recordMap = new Map(records.map((record) => [getDataKey(record), record]));

    return [...captures]
      .sort((a, b) => b.created_at - a.created_at)
      .flatMap((capture) => {
        const record = recordMap.get(capture.data_key);
        return record ? [{ ...record, captured_at: capture.created_at }] : [];
      });
  }

  async deleteAllXHSNotes() {
    return this.xhsNotes().clear().catch(this.logError);
  }

  async deleteAllXHSComments() {
    return this.xhsComments().clear().catch(this.logError);
  }

  async deleteAllCaptures() {
    return this.captures().clear().catch(this.logError);
  }

  /*
  |--------------------------------------------------------------------------
  | Migrations
  |--------------------------------------------------------------------------
  */

  async init() {
    const captureIndexPaths: KeyPaths<Capture>[] = ['id', 'extension', 'type', 'created_at'];

    const xhsNoteIndexPaths: KeyPaths<XHSNote>[] = [
      'note_id',
      'user.user_id',
      'note_type',
      'liked_count',
      'collected_count',
      'upload_time',
    ];

    const xhsCommentIndexPaths: KeyPaths<XHSComment>[] = [
      'comment_id',
      'note_id',
      'user.user_id',
      'like_count',
      'upload_time',
    ];

    try {
      this.db
        .version(DB_VERSION)
        .stores({
          captures: captureIndexPaths.join(','),
          xhs_notes: xhsNoteIndexPaths.join(','),
          xhs_comments: xhsCommentIndexPaths.join(','),
        })
        .upgrade(async () => {
          logger.info('Upgrading database schema...');
          logger.info('Database upgraded');
        });

      await this.db.open();
      logger.info(`Database connected: ${this.db.name}`);
    } catch (error) {
      this.logError(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Maintenance Methods
  |--------------------------------------------------------------------------
  */

  async clearAllData() {
    logger.info('Clearing all data from database...');
    await Promise.all(this.db.tables.map((table) => table.clear()));
    logger.info('All data cleared.');
  }

  /*
  |--------------------------------------------------------------------------
  | Loggers
  |--------------------------------------------------------------------------
  */

  logError(error: unknown) {
    logger.error(`Database Error: ${(error as Error).message}`, error);
  }
}

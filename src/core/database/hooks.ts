import { db } from '@/core/database';
import { ExtensionType } from '@/core/extensions';
import { XHSComment, XHSNote } from '@/types/xhs';
import logger from '@/utils/logger';
import { useLiveQuery } from '@/utils/observable';

export function useCaptureCount(extName: string) {
  return useLiveQuery(() => db.extGetCaptureCount(extName), [extName], 0);
}

export function useCapturedRecords(extName: string, type: ExtensionType) {
  return useLiveQuery<XHSNote[] | XHSComment[], XHSNote[] | XHSComment[]>(
    () => {
      logger.debug('useCapturedRecords liveQuery re-run', extName);

      if (type === ExtensionType.NOTE) {
        return db.extGetCapturedXHSNotes(extName);
      }

      if (type === ExtensionType.COMMENT) {
        return db.extGetCapturedXHSComments(extName);
      }

      return Promise.resolve([]);
    },
    [extName, type],
    [],
  );
}

export function useClearCaptures(extName: string) {
  return async () => {
    logger.debug('Clearing captures for extension:', extName);
    return db.extClearCaptures(extName);
  };
}

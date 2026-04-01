import { ExtensionType } from '@/core/extensions';
import { db } from '@/core/database';
import { Tweet, User } from '@/types';
import { XHSNote, XHSComment } from '@/types/xhs';
import logger from '@/utils/logger';
import { useLiveQuery } from '@/utils/observable';

export function useCaptureCount(extName: string) {
  return useLiveQuery(() => db.extGetCaptureCount(extName), [extName], 0);
}

export function useCapturedRecords(extName: string, type: ExtensionType) {
  return useLiveQuery<
    Tweet[] | User[] | XHSNote[] | XHSComment[] | void,
    Tweet[] | User[] | XHSNote[] | XHSComment[] | void
  >(
    () => {
      logger.debug('useCapturedRecords liveQuery re-run', extName);

      if (type === ExtensionType.USER) {
        return db.extGetCapturedUsers(extName);
      }

      if (type === ExtensionType.TWEET) {
        return db.extGetCapturedTweets(extName);
      }

      if (type === ExtensionType.NOTE) {
        return db.extGetCapturedXHSNotes(extName);
      }

      if (type === ExtensionType.COMMENT) {
        return db.extGetCapturedXHSComments(extName);
      }
    },
    [extName],
    [],
  );
}

export function useClearCaptures(extName: string) {
  return async () => {
    logger.debug('Clearing captures for extension:', extName);
    return db.extClearCaptures(extName);
  };
}

import { h } from 'preact';
import { Extension, ExtensionType } from '@/core/extensions';
import { db } from '@/core/database';
import { XHSNote } from '@/types/xhs';
import { XHSHomeFeedInterceptor } from './api';
import { ExtensionPanel, Modal } from '@/components/common';
import { useTranslation, TranslationKey } from '@/i18n';
import { useToggle } from '@/utils/common';
import { useCaptureCount, useCapturedRecords, useClearCaptures } from '@/core/database/hooks';
import { BaseTableView } from '@/components/table/base';
import { columns } from '@/components/table/columns-note';

export default class XHSHomeFeedModule extends Extension {
  name = 'xhs-home-feed';
  title = 'Proposals';
  type = ExtensionType.NOTE;
  intercept = () => XHSHomeFeedInterceptor;

  render = () => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return function (props: { extension: Extension }) {
      const { t } = useTranslation();
      const [showModal, toggleShowModal] = useToggle();

      // Use the helper hook (assumes we updated it to support NOTE)
      const count = useCaptureCount(self.name);
      const records = useCapturedRecords(self.name, self.type);
      const clearCapturedData = useClearCaptures(self.name);

      const title = '小红书首页/搜索 Note'; // Hardcoded for now or add to i18n
      
      const onExportMedia = () => {
          // TODO: Implement media export logic for Notes
          alert('Not implemented yet');
      };

      return (
        <ExtensionPanel
          title={title}
          description={`${t('Captured:')} ${count}`}
          active={!!count && (count as number) > 0}
          onClick={toggleShowModal}
          indicatorColor="bg-error" // Red for Xiaohongshu
        >
          <Modal
            class="max-w-4xl md:max-w-screen-md sm:max-w-screen-sm min-h-[512px]"
            title={title}
            show={showModal}
            onClose={toggleShowModal}
          >
             <BaseTableView
                title={title}
                records={(records as XHSNote[]) ?? []}
                columns={columns}
                clear={clearCapturedData}
                renderActions={() => (
                    <button class="btn btn-secondary" onClick={onExportMedia}>
                    {t('Export Media')}
                    </button>
                )}
            />
          </Modal>
        </ExtensionPanel>
      );
    };
  };
}

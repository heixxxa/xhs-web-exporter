// src/modules/xhs-comments/index.tsx
import { Extension, ExtensionType } from '@/core/extensions';
import { ExportMediaModal } from '@/components/modals/export-media';
import { XHSComment } from '@/types/xhs';
import { XHSCommentsInterceptor } from './api';
import { ExtensionPanel, Modal } from '@/components/common';
import { TranslationKey, useTranslation } from '@/i18n';
import { useToggle } from '@/utils/common';
import { useCaptureCount, useCapturedRecords, useClearCaptures } from '@/core/database/hooks';
import { BaseTableView } from '@/components/table/base';
import { columns } from '@/components/table/columns-comment';

export default class XHSCommentsModule extends Extension {
  name = 'xhs-comments';
  type = ExtensionType.COMMENT;
  intercept = () => XHSCommentsInterceptor;

  render = () => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return function () {
      const { t } = useTranslation();
      const [showModal, toggleShowModal] = useToggle();
      const [showExportMediaModal, toggleShowExportMediaModal] = useToggle();

      const count = useCaptureCount(self.name);
      const records = useCapturedRecords(self.name, self.type);
      const clearCapturedData = useClearCaptures(self.name);

      const title = t(self.name as TranslationKey);

      return (
        <ExtensionPanel
          title={title}
          description={`${t('Captured:')} ${count}`}
          active={!!count && (count as number) > 0}
          onClick={toggleShowModal}
          indicatorColor="bg-info"
        >
          <Modal
            class="max-w-4xl md:max-w-screen-md sm:max-w-screen-sm min-h-[512px]"
            title={title}
            show={showModal}
            onClose={toggleShowModal}
          >
            <BaseTableView
              title={title}
              records={(records as XHSComment[]) ?? []}
              columns={columns}
              clear={clearCapturedData}
              renderActions={() => (
                <button class="btn btn-secondary" onClick={toggleShowExportMediaModal}>
                  {t('Export Media')}
                </button>
              )}
              renderExtra={(table) => (
                <ExportMediaModal
                  title={title}
                  table={table}
                  context="comment"
                  show={showExportMediaModal}
                  onClose={toggleShowExportMediaModal}
                />
              )}
            />
          </Modal>
        </ExtensionPanel>
      );
    };
  };
}

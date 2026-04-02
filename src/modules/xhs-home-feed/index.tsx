import { ExtensionPanel, Modal } from '@/components/common';
import { ExportMediaModal } from '@/components/modals/export-media';
import { BaseTableView } from '@/components/table/base';
import { columns } from '@/components/table/columns-note';
import { useCaptureCount, useCapturedRecords, useClearCaptures } from '@/core/database/hooks';
import { Extension, ExtensionType } from '@/core/extensions';
import { TranslationKey, useTranslation } from '@/i18n';
import { XHSNote } from '@/types/xhs';
import { useToggle } from '@/utils/common';
import { XHSHomeFeedInterceptor } from './api';
import { XHSHomeFeedDomCapture } from './dom';

export default class XHSHomeFeedModule extends Extension {
  private domCapture = new XHSHomeFeedDomCapture(this);

  name = 'xhs-home-feed';
  type = ExtensionType.NOTE;
  intercept = () => XHSHomeFeedInterceptor;

  public setup() {
    this.domCapture.start();
  }

  public dispose() {
    this.domCapture.stop();
  }

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
          indicatorColor="bg-error"
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
                <button class="btn btn-secondary" onClick={toggleShowExportMediaModal}>
                  {t('Export Media')}
                </button>
              )}
              renderExtra={(table) => (
                <ExportMediaModal
                  title={title}
                  table={table}
                  context="note"
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

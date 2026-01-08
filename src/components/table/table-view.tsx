import { ExportMediaModal } from '@/components/modals/export-media';
import { useCapturedRecords, useClearCaptures } from '@/core/database/hooks';
import { Extension, ExtensionType } from '@/core/extensions';
import { useTranslation } from '@/i18n';
import { Tweet, User } from '@/types';
import { XHSNote, XHSComment } from '@/types/xhs';
import { useToggle } from '@/utils/common';
import { ColumnDef } from '@tanstack/table-core';

import { BaseTableView } from './base';
import { columns as columnsTweet } from './columns-tweet';
import { columns as columnsUser } from './columns-user';
// We need to import comment columns here but for now let's just use empty or assume the component passing props handles it?
// Wait, TableView selects columns based on type.
// I should import columnsComment
import { columns as columnsComment } from './columns-comment';

type TableViewProps = {
  title: string;
  extension: Extension;
};

type InferDataType<T> = T extends ExtensionType.TWEET ? Tweet : T extends ExtensionType.USER ? User : T extends ExtensionType.NOTE ? XHSNote : XHSComment;



/**
 * Common table view.
 */
export function TableView({ title, extension }: TableViewProps) {
  const { t } = useTranslation();

  // Infer data type (Tweet or User) from extension type.
  type DataType = InferDataType<typeof extension.type>;

  // Query records from the database.
  const { name, type } = extension;
  const records = useCapturedRecords(name, type);
  const clearCapturedData = useClearCaptures(name);

  // Control modal visibility for exporting media.
  const [showExportMediaModal, toggleShowExportMediaModal] = useToggle();

  const columns = (
    type === ExtensionType.TWEET ? columnsTweet : type === ExtensionType.USER ? columnsUser : type === ExtensionType.COMMENT ? columnsComment : []
  ) as ColumnDef<DataType>[];

  return (
    <BaseTableView
      title={title}
      records={(records as DataType[]) ?? []}
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
          isTweet={type === ExtensionType.TWEET}
          show={showExportMediaModal}
          onClose={toggleShowExportMediaModal}
        />
      )}
    />
  );
}

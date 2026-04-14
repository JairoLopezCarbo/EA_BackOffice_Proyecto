export type HistoryAction = 'CREATE' | 'MODIFY' | 'STATUS' | 'DELETE';
export type HistoryEntity = 'USER' | 'ROUTE' | 'POINT';

export interface HistoryChange {
  _id: string;
  historyId: string;
  objectId: string;
  fieldName: string;
  beforeValue: string;
  afterValue: string;
  changedAt: string;
}

export interface HistoryItem {
  _id: string;
  name: string;
  action: HistoryAction;
  entity: HistoryEntity;
  entityId: string;
  changes: HistoryChange[];
  createdAt: string;
  updatedAt: string;
}

export type CreateHistoryPayload = Record<string, never>;
export type UpdateHistoryPayload = Record<string, never>;
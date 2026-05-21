import { api } from './api';

const B = '/db-schema';

export const dbSchema = {
  getInfo:           ()                              => api.get(`${B}/info`).then(r => r.data.data),
  getSchemas:        ()                              => api.get(`${B}/schemas`).then(r => r.data.data),
  getTables:         (s: string)                     => api.get(`${B}/schema/${s}/tables`).then(r => r.data.data),
  getColumns:        (s: string, t: string)          => api.get(`${B}/schema/${s}/table/${t}/columns`).then(r => r.data.data),
  getIndexes:        (s: string, t: string)          => api.get(`${B}/schema/${s}/table/${t}/indexes`).then(r => r.data.data),
  getConstraints:    (s: string, t: string)          => api.get(`${B}/schema/${s}/table/${t}/constraints`).then(r => r.data.data),
  getTableScript:    (s: string, t: string)          => api.get(`${B}/schema/${s}/table/${t}/script`).then(r => r.data.data),
  getViewDefinition: (s: string, v: string)          => api.get(`${B}/schema/${s}/view/${v}/definition`).then(r => r.data.data),
  getTypes:          (s: string)                     => api.get(`${B}/schema/${s}/types`).then(r => r.data.data),
  getFunctions:      (s: string)                     => api.get(`${B}/schema/${s}/functions`).then(r => r.data.data),
  getSequences:      (s: string)                     => api.get(`${B}/schema/${s}/sequences`).then(r => r.data.data),
  addColumn:         (s: string, t: string, d: any)  => api.post(`${B}/schema/${s}/table/${t}/add-column`, d).then(r => r.data),
  renameColumn:      (s: string, t: string, d: any)  => api.post(`${B}/schema/${s}/table/${t}/rename-column`, d).then(r => r.data),
};

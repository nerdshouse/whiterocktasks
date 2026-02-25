import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Task, UserRole } from '../types';
import { useSearchParams } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { isHoliday, compressImageForUpload, getPendingDays } from '../lib/utils';
import { Paperclip, Check, X, HelpCircle, ExternalLink, FileText } from 'lucide-react';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

const PAGE_SIZE = 7;

export const TaskTable: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [completeTask, setCompleteTask] = useState<Task | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentText, setAttachmentText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewAttachment, setViewAttachment] = useState<{ url?: string; text?: string } | null>(null);

  const isAuditor = user?.role === UserRole.AUDITOR;
  const isOwner = user?.role === UserRole.OWNER;
  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.OWNER;
  const isDoer = user?.role === UserRole.DOER;

  const loadPage = useCallback(
    async (startAfterDoc: QueryDocumentSnapshot | null | undefined, append: boolean) => {
      const filters: { assignedTo?: string; assignedBy?: string; status?: 'completed' } = {};
      if (isDoer) filters.assignedTo = user?.id ?? '';
      if (isAuditor) filters.status = 'completed';
      const { tasks: nextTasks, lastDoc: nextLastDoc } = await api.getTasksPaginated({
        pageSize: PAGE_SIZE,
        startAfterDoc: startAfterDoc ?? undefined,
        ...filters,
      });
      setTasks((prev) => (append ? [...prev, ...nextTasks] : nextTasks));
      setLastDoc(nextLastDoc);
      setHasNextPage(nextLastDoc != null);
      setLoading(false);
    },
    [user?.id, isDoer, isAuditor]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [h] = await Promise.all([api.getHolidays()]);
      setHolidays(h);
      await loadPage(undefined, false);
    };
    load();
  }, [loadPage]);

  let filteredTasks = tasks;
  if (isDoer && startDateFilter) {
    filteredTasks = tasks.filter((t) => t.start_date === startDateFilter);
  }

  const handleCompleteClick = (t: Task) => {
    if (t.attachment_required) {
      setCompleteTask(t);
      setAttachmentUrl('');
      setAttachmentText('');
      setAttachmentFile(null);
      setUploading(false);
      setUploadError(null);
    } else {
      handleComplete(t, undefined, undefined);
    }
  };

  const handleMediaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !completeTask) return;
    setAttachmentUrl('');
    setUploadError(null);
    setAttachmentFile(file);
    setUploading(true);
    const path = `task-attachments/${completeTask.id}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    try {
      const toUpload = await compressImageForUpload(file);
      await uploadBytes(storageRef, toUpload);
      const url = await getDownloadURL(storageRef);
      setAttachmentUrl(url);
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
      setAttachmentFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async (t: Task, url?: string, text?: string) => {
    if (!user) return;
    if (t.attachment_required) {
      const isText = t.attachment_type === 'text';
      if (isText && !text?.trim()) return;
      if (!isText && !url?.trim()) return;
    }
    try {
      await api.updateTask(t.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        ...(url && { attachment_url: url }),
        ...(text && { attachment_text: text }),
      });
      setLoading(true);
      await loadPage(undefined, false);
      setCompleteTask(null);
      setAttachmentUrl('');
      setAttachmentText('');
      setAttachmentFile(null);
      setUploading(false);
      setUploadError(null);
    } catch (err) {
      console.error(err);
    }
  };

  const closeCompleteModal = () => {
    setCompleteTask(null);
    setAttachmentUrl('');
    setAttachmentText('');
    setAttachmentFile(null);
    setUploading(false);
    setUploadError(null);
  };

  const handleAudit = async (taskId: string, status: 'audited' | 'bogus' | 'unclear') => {
    if (!user) return;
    try {
      await api.setAuditStatus(taskId, status, user.name);
      setLoading(true);
      await loadPage(undefined, false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadMore = () => {
    if (!lastDoc || !hasNextPage) return;
    setLoading(true);
    loadPage(lastDoc, true);
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  if (isAuditor) {
    return (
      <div>
        <p className="text-slate-500 text-sm mb-4">Tasks pending audit. Mark as audited, bogus, or unclear.</p>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium text-slate-800">{filteredTasks.length}</span> task{filteredTasks.length !== 1 ? 's' : ''}
            {hasNextPage && '+'}
          </p>
          {hasNextPage && (
            <Button size="sm" variant="secondary" onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Task</th>
                <th>Description</th>
                <th>Attachment</th>
                <th>Status</th>
                <th>Pending Days</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id} className={highlightId === t.id ? 'bg-amber-50' : ''}>
                  <td>
                    {t.assigned_to_name}
                    {t.assignee_deleted && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">Member deleted</span>
                    )}
                  </td>
                  <td>{t.assigned_to_city || (t.assignee_deleted ? '—' : '-')}</td>
                  <td>{t.title}</td>
                  <td className="max-w-[150px] truncate" title={t.description}>
                    {t.description || '-'}
                  </td>
                  <td>
                    {(t.attachment_url || t.attachment_text) ? (
                      <button
                        type="button"
                        onClick={() => setViewAttachment({ url: t.attachment_url, text: t.attachment_text })}
                        className="text-teal-600 hover:underline text-sm inline-flex items-center gap-1 font-medium"
                      >
                        {t.attachment_url ? <ExternalLink size={14} /> : <FileText size={14} />}
                        View
                      </button>
                    ) : t.attachment_required ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Paperclip size={14} /> Required
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${
                        t.audit_status === 'audited'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.audit_status === 'bogus'
                          ? 'bg-red-100 text-red-800'
                          : t.audit_status === 'unclear'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.audit_status || 'pending'}
                    </span>
                  </td>
                  <td>{getPendingDays(t.due_date)}</td>
                  <td>
                    {(!t.audit_status || t.audit_status === 'pending') && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleAudit(t.id, 'audited')}
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleAudit(t.id, 'bogus')}
                        >
                          <X size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAudit(t.id, 'unclear')}
                        >
                          <HelpCircle size={14} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasNextPage && (
          <div className="mt-3 flex justify-center border-t border-slate-100 pt-3">
            <Button variant="secondary" onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {isDoer && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Filter by Start Date:</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:ml-auto">
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium text-slate-800">{filteredTasks.length}</span> task{filteredTasks.length !== 1 ? 's' : ''}
            {hasNextPage && '+'}
          </p>
          {hasNextPage && (
            <Button size="sm" variant="secondary" onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Assigned To</th>
              <th>Start Date</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Attachment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => {
              const onHoliday = isHoliday(t.due_date, holidays);
              return (
                <tr
                  key={t.id}
                  className={`${highlightId === t.id ? 'bg-amber-50' : ''} ${onHoliday ? 'bg-orange-50/50' : ''}`}
                >
                  <td>
                    <span className="font-medium text-slate-800">{t.title}</span>
                    {onHoliday && (
                      <span className="ml-2 text-xs text-orange-600">(Holiday)</span>
                    )}
                    {t.assignee_deleted && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">Member deleted</span>
                    )}
                  </td>
                  <td className="max-w-[200px] truncate" title={t.description}>
                    {t.description || '-'}
                  </td>
                  <td>
                    {t.assigned_to_name}
                    {t.assignee_deleted && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">Member deleted</span>
                    )}
                  </td>
                  <td>{t.start_date || '-'}</td>
                  <td>{t.due_date}</td>
                  <td>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${
                        t.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : t.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${
                        t.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {(t.attachment_url || t.attachment_text) ? (
                      <button
                        type="button"
                        onClick={() => setViewAttachment({ url: t.attachment_url, text: t.attachment_text })}
                        className="text-teal-600 hover:underline text-sm inline-flex items-center gap-1 font-medium"
                      >
                        {t.attachment_url ? <ExternalLink size={14} /> : <FileText size={14} />}
                        View
                      </button>
                    ) : t.attachment_required ? (
                      <span className="text-amber-600 text-sm">Required</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {t.assigned_to_id === user?.id && t.status !== 'completed' ? (
                      <Button size="sm" variant="success" onClick={() => handleCompleteClick(t)}>
                        Mark Complete
                      </Button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hasNextPage && (
        <div className="mt-3 flex justify-center">
          <Button variant="secondary" onClick={handleLoadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      {completeTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              {completeTask.attachment_type === 'text'
                ? 'Text required to mark complete'
                : 'Upload media required to mark complete'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {completeTask.attachment_description ||
                (completeTask.attachment_type === 'text'
                  ? 'You must enter text below to complete this task.'
                  : 'Upload a photo/video or paste a link to your media.')}
            </p>
            {completeTask.attachment_type === 'text' ? (
              <textarea
                value={attachmentText}
                onChange={(e) => setAttachmentText(e.target.value)}
                placeholder="Enter your text here (required)..."
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
                required
              />
            ) : (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Upload photo or video
                  </label>
                  <input
                    key={completeTask.id}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaFileSelect}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                  {attachmentFile && (
                    <p className="text-xs text-slate-500 mt-1">
                      {attachmentFile.name}
                      {uploading && ' — Uploading...'}
                      {!uploading && attachmentUrl && ' — Done'}
                    </p>
                  )}
                  {uploadError && (
                    <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Or paste media link
                  </label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => {
                      setAttachmentUrl(e.target.value);
                      setAttachmentFile(null);
                      setUploadError(null);
                    }}
                    placeholder="e.g. Google Drive, cloud link for photo/video"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  You must either upload a file or provide a link to mark this task complete.
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={closeCompleteModal}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleComplete(
                    completeTask,
                    completeTask.attachment_type === 'text' ? undefined : attachmentUrl,
                    completeTask.attachment_type === 'text' ? attachmentText : undefined
                  )
                }
                disabled={
                  completeTask.attachment_type === 'text'
                    ? !attachmentText.trim()
                    : !attachmentUrl.trim()
                }
              >
                Complete
              </Button>
            </div>
          </div>
        </div>
      )}

      {viewAttachment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewAttachment(null)}>
          <div className="card p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Attachment</h3>
            {viewAttachment.url && (
              <div className="mb-4">
                <a
                  href={viewAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-teal-600 hover:underline font-medium"
                >
                  <ExternalLink size={18} />
                  Open media / link
                </a>
              </div>
            )}
            {viewAttachment.text != null && viewAttachment.text !== '' && (
              <pre className="flex-1 overflow-auto text-sm text-slate-700 whitespace-pre-wrap border border-slate-200 rounded-lg p-4 bg-slate-50 min-h-[100px]">
                {viewAttachment.text}
              </pre>
            )}
            {viewAttachment.url && !viewAttachment.text && <p className="text-sm text-slate-500">Media or link attached. Use the link above to view.</p>}
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setViewAttachment(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

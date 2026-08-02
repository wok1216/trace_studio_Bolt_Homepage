import type { SiteAnalysisData } from '../types';
import { buildWebhookAnalysisPayload } from './projectAnalysisData';

const DESIGN_MEMO_CHAT_URL = 'http://localhost:5678/webhook/Trace_projects';

export interface DesignMemoChatPayload {
  projectId: string;
  message: string;
  designNote: string;
  analysis: SiteAnalysisData;
}

export async function sendDesignMemoMessage(
  payload: DesignMemoChatPayload,
): Promise<Response> {
  const bodyObject = {
    projectId: payload.projectId,
    message: payload.message,
    designNote: payload.designNote,
    analysis: buildWebhookAnalysisPayload(payload.analysis),
  };

  const body = JSON.stringify(bodyObject);

  console.log('Webhook URL:', DESIGN_MEMO_CHAT_URL);
  console.log('Webhook Body', body);

  return fetch(DESIGN_MEMO_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

export { DESIGN_MEMO_CHAT_URL };

import {isCloudConfigured} from '../../lib/supabase';
import {isRealAI} from '../../config/runtime';
import {cloudAI} from './cloud';
import {mockAI} from './mock';
export const ai=isRealAI&&isCloudConfigured?cloudAI:mockAI;
export * from './types';

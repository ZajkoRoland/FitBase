import { coachRepository, CoachRepository } from '@/repositories/CoachRepository';
import { i18n } from '@/services/LocalizationService';
import type { ChatMessage, CoachChatResponse } from '@/types/coach';
import { planService } from './PlanService';

export class CoachService {
  private static instance: CoachService;
  private readonly repository: CoachRepository;

  private constructor(repository: CoachRepository = coachRepository) {
    this.repository = repository;
  }

  public static getInstance(): CoachService {
    if (!CoachService.instance) {
      CoachService.instance = new CoachService();
    }
    return CoachService.instance;
  }

  public getTodayWorkoutTitle(week?: any[]): string {
    const activeWeek = week && week.length > 0 ? week : planService.getWeekPlan();
    const dayOfWeek = (new Date().getDay() + 6) % 7;
    const today = activeWeek[dayOfWeek];
    if (today && today.type === 'workout' && today.workoutTitle) {
      return i18n.translateWorkoutTitle(today.workoutTitle);
    }
    return i18n.t('plan.restDayTitle');
  }

  public isTodayRestDay(week?: any[]): boolean {
    const activeWeek = week && week.length > 0 ? week : planService.getWeekPlan();
    const dayOfWeek = (new Date().getDay() + 6) % 7;
    const today = activeWeek[dayOfWeek];
    return !today || today.type === 'rest';
  }

  public getStatusText(week?: any[]): string {
    return i18n.t('coach.statusToday', {
      workout: this.getTodayWorkoutTitle(week),
    });
  }

  public getInitialQuickReplies(language?: 'hu' | 'en' | null): string[] {
    return [
      i18n.t('coach.quickReply1'),
      i18n.t('coach.quickReply2'),
      i18n.t('coach.quickReply3'),
      i18n.t('coach.quickReply4'),
    ];
  }

  public getCurrentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  public sanitizeQuickReplies(replies?: string[]): string[] {
    if (!replies || !Array.isArray(replies)) return [];
    return replies.map((reply) => {
      if (typeof reply !== 'string') return '';
      let text = reply.trim();
      text = text.replace(/^módosítsam\s+/i, 'Módosítsd ');
      text = text.replace(/^módosítanám\s+/i, 'Módosítsd ');
      text = text.replace(/^módosítom\s+/i, 'Módosítsd ');
      text = text.replace(/^részletezem\s+/i, 'Részletezd ');
      text = text.replace(/^részletezném\s+/i, 'Részletezd ');
      text = text.replace(/^megmutatom\s+/i, 'Mutasd meg ');
      text = text.replace(/^mutatom\s+/i, 'Mutasd meg ');
      text = text.replace(/^kiszámolom\s+/i, 'Számold ki ');
      text = text.replace(/^elmondom\s+/i, 'Mondd el ');
      text = text.replace(/^összeállítom\s+/i, 'Állítsd össze ');
      text = text.replace(/^készítek\s+/i, 'Készíts ');
      text = text.replace(/^elemezem\s+/i, 'Elemezd ');
      text = text.replace(/^átnézem\s+/i, 'Nézd át ');
      text = text.replace(/^kérj\s+(egy\s+)?új\s+gyakorlatot.*/i, 'Adj egy új gyakorlatot mára!');
      text = text.replace(/^kérj\s+gyakorlatot.*/i, 'Adj egy új gyakorlatot mára!');
      text = text.replace(/^kérj\s+/i, 'Adj ');
      text = text.replace(/^kérdezz\s+a\s+technikáról.*/i, 'Mutasd a helyes technikát!');
      text = text.replace(/^kérdezz\s+(a\s+)?/i, 'Mutasd a ');
      text = text.replace(/^még\s+valami\s+módosítandó\??/i, 'Cseréljünk még egy gyakorlatot!');
      text = text.replace(/^segíthetek.*\??/i, 'Van még kérdésem!');
      text = text.replace(/^van\s+még\s+kérdésed\??/i, 'Mutass még tippeket!');
      text = text.replace(/^készen\s+állsz.*\??/i, 'Készen állok a mai edzésre!');
      text = text.replace(/^shall\s+i\s+modify\s+/i, 'Modify ');
      text = text.replace(/^i\s+detail\s+/i, 'Detail ');
      text = text.replace(/^i\s+will\s+detail\s+/i, 'Detail ');
      text = text.replace(/^i\s+show\s+/i, 'Show ');
      text = text.replace(/^i\s+calculate\s+/i, 'Calculate ');

      const imperativeStarts = /^(módosítsd|részletezd|mutasd|számold|mondd|állítsd|készíts|adj|elemezd|nézd át|modify|detail|show|calculate)\b/i;
      if (imperativeStarts.test(text) && text.endsWith('?')) {
        text = text.slice(0, -1) + '!';
      }
      return text;
    }).filter(Boolean);
  }

  public async sendChatMessage(
    message: string,
    history: ChatMessage[],
    language?: 'hu' | 'en' | null
  ): Promise<CoachChatResponse> {
    const activeLang = language ?? (i18n.isHungarian() ? 'hu' : 'en');
    const apiHistory = history.map((msg) => ({
      role: (msg.sender === 'coach' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.text,
    }));

    const response = await this.repository.sendMessage(message, apiHistory, activeLang);
    if (response.quick_replies) {
      response.quick_replies = this.sanitizeQuickReplies(response.quick_replies);
    }
    return response;
  }
}

export const coachService = CoachService.getInstance();

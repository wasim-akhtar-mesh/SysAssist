import { JiraTicket } from '../types';

export interface JiraConfig {
  domain: string;
  projectKey: string;
  apiToken: string;
  userEmail: string;
  autoSync: boolean;
}

export const DEFAULT_JIRA_CONFIG: JiraConfig = {
  domain: 'meshconnect.atlassian.net',
  projectKey: 'SYS',
  apiToken: 'jira_pat_sec_994810284',
  userEmail: 'wasim.akhtar@meshconnect.com',
  autoSync: true
};

export class JiraService {
  private static config: JiraConfig = { ...DEFAULT_JIRA_CONFIG };

  static getConfig(): JiraConfig {
    return this.config;
  }

  static updateConfig(newConfig: Partial<JiraConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  static generateTicketKey(existingTickets: JiraTicket[]): string {
    const maxNumber = existingTickets.reduce((max, t) => {
      const parts = t.key.split('-');
      const num = parseInt(parts[1] || '1000', 10);
      return num > max ? num : max;
    }, 1085);
    return `${this.config.projectKey}-${maxNumber + 1}`;
  }
}

declare module '@mailchimp/mailchimp_transactional' {
  interface MailchimpClient {
    users: {
      ping(): Promise<any>;
    };
    messages: {
      send(params: any): Promise<any>;
    };
  }

  function mailchimp(apiKey: string): MailchimpClient;

  export = mailchimp;
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  private messages: any[] = [];

  saveMessage(data: any) {
    this.messages.push(data);
    return data;
  }
}

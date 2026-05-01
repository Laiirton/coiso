export interface WhatsAppMessageId {
  _serialized?: string;
  fromMe?: boolean;
  id?: string;
  remote?: unknown;
  toString?: () => string;
}

export interface WhatsAppMessage {
  id: string | WhatsAppMessageId;
  from: string;
  body?: string;
  caption?: string;
  content?: string;
  isMedia?: boolean;
  isNotification?: boolean;
  fromMe?: boolean;
  quotedMsgId?: string | null;
  quotedMsgObj?: WhatsAppMessage | null;
  type?: string;
  mimetype?: string;
}

export interface WhatsAppClient {
  onMessage(callback: (message: WhatsAppMessage) => void): void;
  close(): Promise<boolean>;
  reply(chatId: string, content: string, quotedMsgId: string): Promise<unknown>;
  sendText(chatId: string, content: string): Promise<unknown>;
  sendImageAsSticker(
    chatId: string,
    pathOrBase64: string,
    options?: { quotedMsg?: string }
  ): Promise<unknown>;
  sendImageAsStickerGif(
    chatId: string,
    pathOrBase64: string,
    options?: { quotedMsg?: string }
  ): Promise<unknown>;
  downloadMedia(messageOrId: string | WhatsAppMessage): Promise<string>;
  getMessageById?(messageId: string): Promise<WhatsAppMessage | null | undefined>;
}

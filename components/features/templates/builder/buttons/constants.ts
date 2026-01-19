import { ButtonType } from './types'

export const REQUIRES_BUTTON_TEXT = new Set<ButtonType>([
  'QUICK_REPLY',
  'URL',
  'PHONE_NUMBER',
  'COPY_CODE',
  'FLOW',
  'VOICE_CALL',
  'CATALOG',
  'MPM',
  'EXTENSION',
  'ORDER_DETAILS',
  'POSTBACK',
  'REMINDER',
  'SEND_LOCATION',
  'SPM',
  'OTP',
])

export const BUTTON_TYPE_LABELS: Record<ButtonType, string> = {
  QUICK_REPLY: 'Resposta rapida',
  URL: 'Acessar o site',
  PHONE_NUMBER: 'Ligar',
  COPY_CODE: 'Copiar codigo da oferta',
  OTP: 'OTP',
  FLOW: 'Concluir MiniApp',
  CATALOG: 'Catalogo',
  MPM: 'MPM',
  VOICE_CALL: 'Ligar no WhatsApp',
  EXTENSION: 'Extensao',
  ORDER_DETAILS: 'Detalhes do pedido',
  POSTBACK: 'Postback',
  REMINDER: 'Lembrete',
  SEND_LOCATION: 'Enviar localizacao',
  SPM: 'SPM',
}

export const TYPES_THAT_RESET_TEXT: ButtonType[] = [
  'QUICK_REPLY',
  'URL',
  'PHONE_NUMBER',
  'FLOW',
  'CATALOG',
  'MPM',
  'VOICE_CALL',
  'EXTENSION',
  'ORDER_DETAILS',
  'POSTBACK',
  'REMINDER',
  'SEND_LOCATION',
  'SPM',
]

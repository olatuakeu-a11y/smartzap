export type Spec = any

export type ButtonType =
  | 'QUICK_REPLY'
  | 'URL'
  | 'PHONE_NUMBER'
  | 'COPY_CODE'
  | 'OTP'
  | 'FLOW'
  | 'CATALOG'
  | 'MPM'
  | 'VOICE_CALL'
  | 'EXTENSION'
  | 'ORDER_DETAILS'
  | 'POSTBACK'
  | 'REMINDER'
  | 'SEND_LOCATION'
  | 'SPM'

export type Flow = {
  id: string
  name: string
  meta_flow_id?: string | null
  meta_status?: string | null
}

export interface ButtonData {
  type: ButtonType
  text?: string
  url?: string
  phone_number?: string
  example?: string | string[]
  otp_type?: string
  flow_id?: string
  flow_action?: string
}

export interface ButtonCounts {
  total: number
  url: number
  phone: number
  copyCode: number
  otp: number
}

export interface ButtonUtilities {
  clampText: (value: string, max: number) => string
  countChars: (value: unknown) => number
  splitPhone: (phone: string) => { country: string; number: string }
  joinPhone: (country: string, number: string) => string
}

export interface BaseButtonFieldProps {
  button: ButtonData
  index: number
  buttons: ButtonData[]
  updateButtons: (buttons: ButtonData[]) => void
  maxButtonText: number
  clampText: (value: string, max: number) => string
  countChars: (value: unknown) => number
}

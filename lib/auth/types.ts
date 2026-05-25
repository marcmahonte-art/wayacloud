export type AuthTab = "email" | "phone"

export interface LoginInput {
  email: string
  password: string
}

export interface PhoneInput {
  phone: string
}

export interface AuthState {
  user: any | null
  session: any | null
  loading: boolean
}

export interface AuthError {
  message: string
  code?: string
}

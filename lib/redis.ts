/**
 * Redis client (LEGADO)
 *
 * O SmartZap não usa mais Redis. Este arquivo existe apenas para manter
 * compatibilidade com imports antigos (ex.: `import { redis } from '@/lib/redis'`).
 *
 * Se você ainda precisa de cache/estado, prefira Supabase/Postgres ou outra solução.
 */

export const isRedisConfigured = (): boolean => false

export const redis = null

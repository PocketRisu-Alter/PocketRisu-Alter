import type { AdapterKind, ModelPreset } from './types'

export type BackendExecutionSupportCode = 'supported' | 'unsupported-adapter' | 'unsupported-tools'

export interface BackendExecutionSupport {
    supported: boolean
    code: BackendExecutionSupportCode
}

export function getAdapterBackendExecutionSupport(kind?: AdapterKind): BackendExecutionSupport {
    return kind === 'openai-compatible'
        ? { supported: true, code: 'supported' }
        : { supported: false, code: 'unsupported-adapter' }
}

export function getModelPresetBackendExecutionSupport(preset: ModelPreset): BackendExecutionSupport {
    const support = getAdapterBackendExecutionSupport(preset.profileSnapshot.adapterKind)
    if (!support.supported) return support
    if (preset.toolUse === true) return { supported: false, code: 'unsupported-tools' }
    return support
}

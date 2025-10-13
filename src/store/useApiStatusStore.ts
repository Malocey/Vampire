import { create } from 'zustand';
import { ApiStatusState, ApiModule, ApiStatus, API_MODULES } from '../types';

const initialStatus: Record<ApiModule, ApiStatus> = Object.keys(API_MODULES).reduce((acc, key) => {
    acc[key as ApiModule] = 'operational';
    return acc;
}, {} as Record<ApiModule, ApiStatus>);


export const useApiStatusStore = create<ApiStatusState>((set) => ({
    status: initialStatus,
    setModuleStatus: (module, status) =>
        set((state) => ({
            status: {
                ...state.status,
                [module]: status,
            },
        })),
    resetAllStatus: () =>
        set(() => ({
            status: initialStatus,
        })),
}));

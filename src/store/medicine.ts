import { defineStore } from 'pinia'
import { supabase } from '../utils/supabase'

export interface Medicine {
    id: string
    name: string
    location: string
    is_in_stock: boolean
    created_at: string
}

export const useMedicineStore = defineStore('medicine', {
    state: () => ({
        medicines: [] as Medicine[],
        loading: false,
        error: null as string | null
    }),
    actions: {
        async fetchMedicines() {
            this.loading = true
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .order('name', { ascending: true })

            if (error) {
                this.error = error.message
            } else {
                this.medicines = data as Medicine[]
            }
            this.loading = false
        },
        async addMedicine(medicine: Omit<Medicine, 'id' | 'created_at'>) {
            const { data, error } = await supabase
                .from('medicines')
                .insert([medicine])
                .select()

            if (error) throw error
            if (data) this.medicines.push(data[0] as Medicine)
        }
    }
})

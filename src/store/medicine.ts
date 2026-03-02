import { defineStore } from 'pinia'
import { supabase } from '../utils/supabase'

export interface Medicine {
    id: string
    name: string
    location: string
    stock_quantity: number
    expiry_date: string | null
    category: string | null
    internal_notes: string | null
    is_in_stock: boolean
    image_url?: string | null
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
        },
        async updateMedicine(id: string, updates: Partial<Medicine>) {
            const { data, error } = await supabase
                .from('medicines')
                .update(updates)
                .eq('id', id)
                .select()

            if (error) throw error
            if (data) {
                const index = this.medicines.findIndex(m => m.id === id)
                if (index !== -1) this.medicines[index] = data[0] as Medicine
            }
        }
    }
})

export default defineNuxtPlugin(nuxtApp => {
    const supabaseSubmit = async (data) => {
      const { $supabase } = nuxtApp
      if (!$supabase) {
        return { success: false, skipped: true }
      }

      try {
        const { error } = await $supabase
          .from('distribution')
          .insert([data])
  
        if (error) {
          throw error
        }
  
        return { success: true }
      } catch (error) {
        return { success: false, error }
      }
    }
  
    nuxtApp.provide('supabaseSubmit', supabaseSubmit)
  })
  

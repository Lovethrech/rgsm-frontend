export default defineNuxtRouteMiddleware(async () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value) {
        return navigateTo('/auth')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, account_status')
        .eq('id', user.value.id)
        .single()

    if (!profile || profile.account_status !== 'approved') {
        return navigateTo('/auth')
    }

    if (profile.role !== 'global_admin') {
        return navigateTo('/dashboard')
    }
})
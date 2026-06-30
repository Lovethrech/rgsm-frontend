export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/', '/login', '/auth']
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  if (publicRoutes.includes(to.path)) {
    return
  }

  if (!user.value) {
    return navigateTo('/auth')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, account_status')
    .eq('id', user.value.id)
    .single()

  if (!profile || profile.account_status !== 'approved') {
    await supabase.auth.signOut()
    return navigateTo('/auth')
  }
})
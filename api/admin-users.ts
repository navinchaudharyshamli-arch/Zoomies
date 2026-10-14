import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase server configuration missing.' });
  }

  // 1. Verify caller JWT and check for admin role
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }
  const token = authHeader.split(' ')[1];

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !callerUser) {
    return res.status(401).json({ error: 'Invalid or expired caller token.' });
  }

  // Verify admin role in profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', callerUser.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin privilege required.' });
  }

  const { action, payload } = req.body || {};

  try {
    switch (action) {
      case 'create_user': {
        const { email, password, fullName, phone, role } = payload;
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        });
        if (createErr) throw createErr;

        // Upsert into public.profiles
        const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
          id: newUser.user.id,
          email,
          full_name: fullName,
          phone,
          role: role || 'customer',
          disabled: false,
        });
        if (profErr) throw profErr;

        return res.status(200).json({ user: newUser.user });
      }

      case 'reset_password': {
        const { userId, newPassword } = payload;
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword
        });
        if (error) throw error;
        return res.status(200).json({ success: true, user: data.user });
      }

      case 'toggle_disable_user': {
        const { userId, disabled } = payload;
        // Supabase allows ban_duration or custom profile disabled flag
        const { error: profErr } = await supabaseAdmin
          .from('profiles')
          .update({ disabled: !!disabled })
          .eq('id', userId);
        if (profErr) throw profErr;

        // Optionally ban for 100 years if disabling
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: disabled ? '876000h' : 'none'
        });

        return res.status(200).json({ success: true, disabled });
      }

      case 'delete_user': {
        const { userId } = payload;
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (delErr) throw delErr;
        // Cascade will delete profile & pets
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error processing request.' });
  }
}

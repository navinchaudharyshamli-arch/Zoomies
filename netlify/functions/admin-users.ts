import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase server configuration missing.' }) };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing authorization token.' }) };
  }
  const token = authHeader.split(' ')[1];

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !callerUser) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired caller token.' }) };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', callerUser.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin privilege required.' }) };
  }

  try {
    const { action, payload } = JSON.parse(event.body || '{}');

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

        const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
          id: newUser.user.id,
          email,
          full_name: fullName,
          phone,
          role: role || 'customer',
          disabled: false,
        });
        if (profErr) throw profErr;

        return { statusCode: 200, body: JSON.stringify({ user: newUser.user }) };
      }

      case 'reset_password': {
        const { userId, newPassword } = payload;
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword
        });
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify({ success: true, user: data.user }) };
      }

      case 'toggle_disable_user': {
        const { userId, disabled } = payload;
        const { error: profErr } = await supabaseAdmin
          .from('profiles')
          .update({ disabled: !!disabled })
          .eq('id', userId);
        if (profErr) throw profErr;

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: disabled ? '876000h' : 'none'
        });

        return { statusCode: 200, body: JSON.stringify({ success: true, disabled }) };
      }

      case 'delete_user': {
        const { userId } = payload;
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (delErr) throw delErr;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }

      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Server error.' }) };
  }
};

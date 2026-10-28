async function testLiveLogin() {
  console.log('Testing live API login with admin@manammcare.com ...');
  try {
    const res = await fetch('https://api.manammcare.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: 'admin@manammcare.com',
        password: 'Admin@1234',
      }),
    });

    console.log('Login Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Login Response:', JSON.stringify(data, null, 2));

    const token = data?.data?.token || data?.token;
    if (token) {
      console.log('Token acquired. Testing /api/admin/dashboard ...');
      const dashRes = await fetch('https://api.manammcare.com/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      console.log('Dashboard Status:', dashRes.status, dashRes.statusText);
      const dashData = await dashRes.json();
      console.log('Dashboard Data:', JSON.stringify(dashData, null, 2));
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testLiveLogin();
